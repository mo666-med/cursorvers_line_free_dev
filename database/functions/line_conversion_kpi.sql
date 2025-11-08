create or replace function line_conversion_kpi(start_date date, end_date date)
returns table (
  week_start date,
  total_subscribers bigint,
  paid_conversions bigint,
  conversion_rate numeric(6,4),
  goal_met boolean,
  raw_counts jsonb
) as $$
  select
    date_trunc('week', created_at)::date as week_start,
    sum(case when event_type = 'follow' then 1 else 0 end) as total_subscribers,
    sum(case when event_type = 'conversion_paid' then 1 else 0 end) as paid_conversions,
    case
      when sum(case when event_type = 'follow' then 1 else 0 end) = 0 then 0
      else round(sum(case when event_type = 'conversion_paid' then 1 else 0 end)::numeric /
        nullif(sum(case when event_type = 'follow' then 1 else 0 end), 0)::numeric, 4)
    end as conversion_rate,
    case
      when sum(case when event_type = 'follow' then 1 else 0 end) = 0 then false
      else (
        sum(case when event_type = 'conversion_paid' then 1 else 0 end)::numeric /
        nullif(sum(case when event_type = 'follow' then 1 else 0 end), 0)::numeric
      ) >= 0.4
    end as goal_met,
    json_build_object(
      'registrations', sum(case when event_type = 'follow' then 1 else 0 end),
      'conversions', sum(case when event_type = 'conversion_paid' then 1 else 0 end)
    )::jsonb as raw_counts
  from progress_events
  where source = 'line'
    and (start_date is null or created_at::date >= start_date)
    and (end_date is null or created_at::date <= end_date)
  group by 1
  order by week_start desc;
$$ language sql stable;
