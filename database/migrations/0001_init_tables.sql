
create extension if not exists "pgcrypto";

create table if not exists progress_events (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('line', 'manus', 'internal')),
  user_hash text not null,
  plan_id text not null,
  plan_version text not null,
  plan_variant text not null default 'production' check (plan_variant in ('production', 'degraded', 'manual')),
  event_type text not null,
  payload jsonb not null,
  decision text not null check (decision in ('proceed', 'retry', 'amended', 'abort')),
  cost_estimate numeric(12,2),
  manus_points_consumed numeric(12,2),
  retry_after_seconds integer,
  dedupe_key text not null,
  manus_run_id text,
  status text not null check (status in ('queued', 'running', 'complete', 'failed')),
  evidence jsonb,
  correlation_id text,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists progress_events_dedupe_idx on progress_events (dedupe_key);
create index if not exists progress_events_created_at_idx on progress_events (created_at desc);
create index if not exists progress_events_user_hash_idx on progress_events (user_hash);
create index if not exists progress_events_plan_idx on progress_events (plan_id, plan_variant);

create table if not exists budget_snapshots (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  vendor_costs jsonb not null default '{}'::jsonb,
  threshold_state text not null check (threshold_state in ('normal', 'warn', 'trip')),
  mode text not null default 'normal' check (mode in ('normal', 'degraded')),
  total_cost numeric(12,2),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists budget_snapshots_period_idx on budget_snapshots (period_start desc);

create table if not exists line_members (
  user_hash text primary key,
  first_opt_in_at timestamptz not null,
  last_opt_in_at timestamptz,
  cta_tags text[] not null default '{}'::text[],
  status text not null default 'lead',
  guardrail_sent_at timestamptz,
  consent_guardrail boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists kpi_snapshots (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  total_subscribers integer not null,
  paid_conversions integer not null,
  conversion_rate numeric(6,4) not null,
  goal_met boolean not null,
  raw_counts jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create unique index if not exists kpi_snapshots_week_idx on kpi_snapshots (week_start);

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
