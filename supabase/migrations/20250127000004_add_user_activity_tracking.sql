-- Create comprehensive user activity tracking views and functions
-- Updated for team visibility where boss can see all activity

-- User activity summary view (visible to all team members)
CREATE OR REPLACE VIEW public.user_activity_summary AS
SELECT 
  p.user_id,
  p.email,
  p.full_name,
  p.role,
  p.created_at as user_joined_at,
  COUNT(vf.id) as total_violations,
  COUNT(CASE WHEN vf.created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END) as violations_this_month,
  COUNT(CASE WHEN vf.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as violations_this_week,
  COUNT(CASE WHEN vf.status = 'pending' THEN 1 END) as pending_violations,
  COUNT(CASE WHEN vf.status = 'completed' THEN 1 END) as completed_violations,
  COUNT(CASE WHEN vf.status = 'saved' THEN 1 END) as draft_violations,
  MAX(vf.created_at) as last_violation_date,
  MIN(vf.created_at) as first_violation_date,
  -- Add productivity metrics
  CASE 
    WHEN COUNT(vf.id) = 0 THEN 0
    ELSE ROUND(
      COUNT(CASE WHEN vf.status = 'completed' THEN 1 END)::numeric / 
      COUNT(vf.id)::numeric * 100, 1
    )
  END as completion_rate_percent
FROM public.profiles p
LEFT JOIN public.violation_forms vf ON p.user_id = vf.user_id
GROUP BY p.user_id, p.email, p.full_name, p.role, p.created_at;

-- Recent team activity view (last 30 days) - shows all team activity
CREATE OR REPLACE VIEW public.recent_team_activity AS
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
    WHEN vf.created_at >= CURRENT_DATE - INTERVAL '1 day' THEN 'Yesterday'
    WHEN vf.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 'This Week'
    ELSE 'Earlier'
  END as time_period,
  -- Add time since creation for tracking follow-up needs
  EXTRACT(days FROM (CURRENT_TIMESTAMP - vf.created_at))::integer as days_old
FROM public.violation_forms vf
JOIN public.profiles p ON vf.user_id = p.user_id
WHERE vf.created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY vf.created_at DESC;

-- Team performance summary for management oversight
CREATE OR REPLACE VIEW public.team_performance_summary AS
SELECT 
  COUNT(DISTINCT p.user_id) as total_team_members,
  COUNT(vf.id) as total_violations_all_time,
  COUNT(CASE WHEN vf.created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END) as violations_this_month,
  COUNT(CASE WHEN vf.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as violations_this_week,
  COUNT(CASE WHEN vf.status = 'pending' THEN 1 END) as pending_violations,
  COUNT(CASE WHEN vf.status = 'completed' THEN 1 END) as completed_violations,
  COUNT(CASE WHEN vf.status = 'saved' THEN 1 END) as draft_violations,
  -- Team productivity metrics
  CASE 
    WHEN COUNT(vf.id) = 0 THEN 0
    ELSE ROUND(
      COUNT(CASE WHEN vf.status = 'completed' THEN 1 END)::numeric / 
      COUNT(vf.id)::numeric * 100, 1
    )
  END as team_completion_rate_percent,
  -- Most active user
  (SELECT p2.full_name FROM public.profiles p2 
   JOIN public.violation_forms vf2 ON p2.user_id = vf2.user_id 
   WHERE vf2.created_at >= CURRENT_DATE - INTERVAL '30 days'
   GROUP BY p2.user_id, p2.full_name 
   ORDER BY COUNT(vf2.id) DESC 
   LIMIT 1) as most_active_user_this_month
FROM public.profiles p
LEFT JOIN public.violation_forms vf ON p.user_id = vf.user_id;

-- Function to get team statistics (accessible to all authenticated users)
CREATE OR REPLACE FUNCTION public.get_team_stats()
RETURNS TABLE (
  total_team_members BIGINT,
  total_violations BIGINT,
  violations_this_month BIGINT,
  violations_this_week BIGINT,
  pending_violations BIGINT,
  completed_violations BIGINT,
  draft_violations BIGINT,
  team_completion_rate NUMERIC,
  most_active_user TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tps.total_team_members,
    tps.total_violations_all_time,
    tps.violations_this_month,
    tps.violations_this_week,
    tps.pending_violations,
    tps.completed_violations,
    tps.draft_violations,
    tps.team_completion_rate_percent,
    tps.most_active_user_this_month
  FROM public.team_performance_summary tps;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for views and functions to all authenticated users
GRANT SELECT ON public.user_activity_summary TO authenticated;
GRANT SELECT ON public.recent_team_activity TO authenticated;
GRANT SELECT ON public.team_performance_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_stats TO authenticated;

-- Note: Since we're allowing all users to see all violations,
-- these views will be accessible to all team members for transparency