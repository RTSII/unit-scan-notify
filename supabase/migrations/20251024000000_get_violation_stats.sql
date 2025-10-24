-- Create function to compute violation statistics with occurred_at priority and date normalization
-- Returns a single-row table with all the counters used by Admin.tsx

create or replace function public.get_violation_stats()
returns table (
  total_violations bigint,
  this_month bigint,
  violations_this_week bigint,
  pending_violations bigint,
  completed_violations bigint,
  draft_violations bigint,
  team_completion_rate integer
)
language sql
stable
as $$
with base as (
  select
    coalesce(occurred_at::date, created_at::date) as d,
    status
  from public.violation_forms
),

totals as (
  select
    count(*)::bigint as total,
    count(*) filter (where status = 'pending')::bigint as pending,
    count(*) filter (where status = 'completed')::bigint as completed,
    count(*) filter (where status = 'saved')::bigint as draft,
    count(*) filter (where d >= date_trunc('month', now())::date)::bigint as month_count,
    count(*) filter (where d >= (current_date - 6))::bigint as week_count
  from base
)
select
  total as total_violations,
  month_count as this_month,
  week_count as violations_this_week,
  pending as pending_violations,
  completed as completed_violations,
  draft as draft_violations,
  case when total > 0 then round((completed::numeric/total)*100)::int else 0 end as team_completion_rate
from totals;
$$;

-- Ensure common roles can execute the function
grant execute on function public.get_violation_stats() to anon, authenticated, service_role;
