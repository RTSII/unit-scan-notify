-- Phase 1: Replace insecure views with secure functions

-- Drop the existing views that lack security
DROP VIEW IF EXISTS public.team_performance_summary CASCADE;
DROP VIEW IF EXISTS public.user_activity_summary CASCADE;
DROP VIEW IF EXISTS public.recent_team_activity CASCADE;

-- Create secure function for team performance summary (admin only)
CREATE OR REPLACE FUNCTION public.get_team_performance_summary()
RETURNS TABLE(
  total_team_members bigint,
  total_violations_all_time bigint,
  violations_this_month bigint,
  violations_this_week bigint,
  pending_violations bigint,
  completed_violations bigint,
  draft_violations bigint,
  team_completion_rate_percent numeric,
  most_active_user_this_month text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is admin
  IF get_current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    count(DISTINCT p.user_id) AS total_team_members,
    count(vf.id) AS total_violations_all_time,
    count(CASE WHEN vf.created_at >= date_trunc('month', CURRENT_DATE::timestamp with time zone) THEN 1 END) AS violations_this_month,
    count(CASE WHEN vf.created_at >= CURRENT_DATE - interval '7 days' THEN 1 END) AS violations_this_week,
    count(CASE WHEN vf.status = 'pending' THEN 1 END) AS pending_violations,
    count(CASE WHEN vf.status = 'completed' THEN 1 END) AS completed_violations,
    count(CASE WHEN vf.status = 'saved' THEN 1 END) AS draft_violations,
    CASE 
      WHEN count(vf.id) = 0 THEN 0::numeric
      ELSE round((count(CASE WHEN vf.status = 'completed' THEN 1 END)::numeric / count(vf.id)::numeric) * 100, 1)
    END AS team_completion_rate_percent,
    (
      SELECT p2.full_name
      FROM profiles p2
      JOIN violation_forms vf2 ON p2.user_id = vf2.user_id
      WHERE vf2.created_at >= CURRENT_DATE - interval '30 days'
      GROUP BY p2.user_id, p2.full_name
      ORDER BY count(vf2.id) DESC
      LIMIT 1
    ) AS most_active_user_this_month
  FROM profiles p
  LEFT JOIN violation_forms vf ON p.user_id = vf.user_id;
END;
$function$;

-- Create secure function for user activity summary
CREATE OR REPLACE FUNCTION public.get_user_activity_summary(target_user_id uuid DEFAULT NULL)
RETURNS TABLE(
  user_id uuid,
  email text,
  full_name text,
  role text,
  user_joined_at timestamp with time zone,
  total_violations bigint,
  violations_this_month bigint,
  violations_this_week bigint,
  pending_violations bigint,
  completed_violations bigint,
  draft_violations bigint,
  last_violation_date timestamp with time zone,
  first_violation_date timestamp with time zone,
  completion_rate_percent numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Security check: users can only see their own data unless they are admin
  IF target_user_id IS NOT NULL AND target_user_id != auth.uid() AND get_current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Cannot view other users activity';
  END IF;

  -- If no target specified, show current user's data or all data if admin
  IF target_user_id IS NULL THEN
    IF get_current_user_role() = 'admin' THEN
      -- Admin sees all users
      target_user_id := NULL;
    ELSE
      -- Regular user sees only their own data
      target_user_id := auth.uid();
    END IF;
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.email,
    p.full_name,
    p.role,
    p.created_at AS user_joined_at,
    count(vf.id) AS total_violations,
    count(CASE WHEN vf.created_at >= date_trunc('month', CURRENT_DATE::timestamp with time zone) THEN 1 END) AS violations_this_month,
    count(CASE WHEN vf.created_at >= CURRENT_DATE - interval '7 days' THEN 1 END) AS violations_this_week,
    count(CASE WHEN vf.status = 'pending' THEN 1 END) AS pending_violations,
    count(CASE WHEN vf.status = 'completed' THEN 1 END) AS completed_violations,
    count(CASE WHEN vf.status = 'saved' THEN 1 END) AS draft_violations,
    max(vf.created_at) AS last_violation_date,
    min(vf.created_at) AS first_violation_date,
    CASE 
      WHEN count(vf.id) = 0 THEN 0::numeric
      ELSE round((count(CASE WHEN vf.status = 'completed' THEN 1 END)::numeric / count(vf.id)::numeric) * 100, 1)
    END AS completion_rate_percent
  FROM profiles p
  LEFT JOIN violation_forms vf ON p.user_id = vf.user_id
  WHERE (target_user_id IS NULL OR p.user_id = target_user_id)
  GROUP BY p.user_id, p.email, p.full_name, p.role, p.created_at;
END;
$function$;

-- Create secure function for recent team activity
CREATE OR REPLACE FUNCTION public.get_recent_team_activity(target_user_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  email text,
  full_name text,
  role text,
  unit_number text,
  location text,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  time_period text,
  days_old integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Security check: users can only see their own data unless they are admin
  IF target_user_id IS NOT NULL AND target_user_id != auth.uid() AND get_current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Cannot view other users activity';
  END IF;

  -- If no target specified, show current user's data or all data if admin
  IF target_user_id IS NULL THEN
    IF get_current_user_role() = 'admin' THEN
      -- Admin sees all users
      target_user_id := NULL;
    ELSE
      -- Regular user sees only their own data
      target_user_id := auth.uid();
    END IF;
  END IF;

  RETURN QUERY
  SELECT 
    vf.id,
    vf.user_id,
    p.email,
    p.full_name,
    p.role,
    vf.unit_number,
    vf.location,
    vf.status,
    vf.created_at,
    vf.updated_at,
    CASE
      WHEN vf.created_at >= CURRENT_DATE THEN 'Today'
      WHEN vf.created_at >= CURRENT_DATE - interval '1 day' THEN 'Yesterday'
      WHEN vf.created_at >= CURRENT_DATE - interval '7 days' THEN 'This Week'
      ELSE 'Earlier'
    END AS time_period,
    EXTRACT(days FROM CURRENT_TIMESTAMP - vf.created_at)::integer AS days_old
  FROM violation_forms vf
  JOIN profiles p ON vf.user_id = p.user_id
  WHERE vf.created_at >= CURRENT_DATE - interval '30 days'
    AND (target_user_id IS NULL OR vf.user_id = target_user_id)
  ORDER BY vf.created_at DESC;
END;
$function$;