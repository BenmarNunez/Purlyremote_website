-- ============================================================
-- Migration: 2026-05-26 — admin audit, billing, moderation
-- Apply in Supabase SQL editor on existing prod database.
-- Append-only. No drops, no renames.
-- ============================================================

-- USERS — admin-facing columns
alter table public.users
  add column if not exists admin_notes text,
  add column if not exists deleted_at  timestamptz,
  add column if not exists status      text not null default 'active'
    check (status in ('active', 'suspended', 'banned'));

create index if not exists users_status_idx     on public.users (status);
create index if not exists users_deleted_at_idx on public.users (deleted_at);

-- ADMIN LOGS
create table if not exists public.admin_logs (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references public.users(id) on delete set null,
  admin_email text,
  action      text not null,
  target_type text,
  target_id   text,
  details     jsonb,
  ip_address  text,
  created_at  timestamptz not null default now()
);

create index if not exists admin_logs_admin_id_idx    on public.admin_logs (admin_id);
create index if not exists admin_logs_action_idx      on public.admin_logs (action);
create index if not exists admin_logs_target_id_idx   on public.admin_logs (target_id);
create index if not exists admin_logs_created_at_idx  on public.admin_logs (created_at desc);

alter table public.admin_logs enable row level security;

-- EMAIL LOGS
create table if not exists public.email_logs (
  id            uuid primary key default gen_random_uuid(),
  to_email      text not null,
  subject       text not null,
  type          text not null,
  status        text not null check (status in ('sent', 'failed')),
  error_message text,
  metadata      jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists email_logs_status_idx     on public.email_logs (status);
create index if not exists email_logs_type_idx       on public.email_logs (type);
create index if not exists email_logs_created_at_idx on public.email_logs (created_at desc);

alter table public.email_logs enable row level security;

-- REPORTS
create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references public.users(id) on delete cascade,
  target_type   text not null check (target_type in ('user', 'message', 'hire_request', 'freelancer_profile')),
  target_id     uuid not null,
  reason        text not null,
  details       text,
  status        text not null default 'open'
                  check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  resolved_by   uuid references public.users(id) on delete set null,
  resolved_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists reports_status_idx       on public.reports (status);
create index if not exists reports_reporter_id_idx  on public.reports (reporter_id);
create index if not exists reports_target_idx       on public.reports (target_type, target_id);

alter table public.reports enable row level security;

create policy "reports: insert own"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "reports: select own"
  on public.reports for select
  using (auth.uid() = reporter_id);

-- SYSTEM SETTINGS
create table if not exists public.system_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_by  uuid references public.users(id) on delete set null,
  updated_at  timestamptz not null default now()
);

alter table public.system_settings enable row level security;

-- SECURITY EVENTS
create table if not exists public.security_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users(id) on delete set null,
  event_type text not null,
  ip_address text,
  user_agent text,
  metadata   jsonb,
  created_at timestamptz not null default now()
);

create index if not exists security_events_user_id_idx    on public.security_events (user_id);
create index if not exists security_events_type_idx       on public.security_events (event_type);
create index if not exists security_events_created_at_idx on public.security_events (created_at desc);

alter table public.security_events enable row level security;

-- USER SESSIONS
create table if not exists public.user_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  session_token text,
  ip_address    text,
  user_agent    text,
  device_label  text,
  last_seen_at  timestamptz not null default now(),
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists user_sessions_user_id_idx     on public.user_sessions (user_id);
create index if not exists user_sessions_last_seen_idx   on public.user_sessions (last_seen_at desc);

alter table public.user_sessions enable row level security;

create policy "user_sessions: select own"
  on public.user_sessions for select
  using (auth.uid() = user_id);

-- SUBSCRIPTIONS
create table if not exists public.subscriptions (
  user_id                uuid primary key references public.users(id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  plan                   text not null default 'free',
  status                 text not null default 'active',
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists subscriptions_customer_id_idx on public.subscriptions (stripe_customer_id);
create index if not exists subscriptions_status_idx      on public.subscriptions (status);

alter table public.subscriptions enable row level security;

create policy "subscriptions: select own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ACTIVITY LOGS
create table if not exists public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  event_type  text not null,
  description text,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists activity_logs_user_id_idx    on public.activity_logs (user_id);
create index if not exists activity_logs_type_idx       on public.activity_logs (event_type);
create index if not exists activity_logs_created_at_idx on public.activity_logs (created_at desc);

alter table public.activity_logs enable row level security;

create policy "activity_logs: select own"
  on public.activity_logs for select
  using (auth.uid() = user_id);
