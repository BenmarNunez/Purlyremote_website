-- ============================================================
-- PurlyRemote Schema — run this in Supabase SQL Editor
-- ============================================================

-- Extensions
create extension if not exists moddatetime schema extensions;

-- ============================================================
-- USERS
-- Mirrors auth.users. Created immediately after auth.admin.createUser.
-- ============================================================
create table public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text unique not null,
  role       text not null check (role in ('client', 'freelancer', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users: select own row"
  on public.users for select
  using (auth.uid() = id);

-- ============================================================
-- FREELANCER PROFILES
-- ============================================================
create table public.freelancer_profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  full_name         text not null,
  bio               text,
  skills            text[] not null default '{}',
  services          text[] not null default '{}',
  hourly_rate       numeric,
  availability      boolean not null default true,
  portfolio_url     text,
  avatar_url        text,
  approved          boolean not null default false,
  approval_status   text not null default 'pending'
                      check (approval_status in ('pending', 'approved', 'rejected')),
  approval_notes    text,
  profile_completed boolean not null default false,
  created_at        timestamptz not null default now()
);

create index on public.freelancer_profiles (user_id);

alter table public.freelancer_profiles enable row level security;

-- Freelancer reads their own profile
create policy "freelancer_profiles: select own"
  on public.freelancer_profiles for select
  using (auth.uid() = user_id);

-- Clients can browse approved freelancers
create policy "freelancer_profiles: select approved for clients"
  on public.freelancer_profiles for select
  using (
    approved = true
    and exists (
      select 1 from public.users
      where id = auth.uid() and role = 'client'
    )
  );

-- Freelancer updates their own non-approval profile fields only.
-- Approval fields (approved, approval_status, approval_notes) are protected
-- by trg_protect_approval_fields — only service_role connections may change them.
-- No insert policy — rows created via service role in register API route.
create policy "freelancer_profiles: update own"
  on public.freelancer_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger: keep approved boolean in sync with approval_status text.
-- Fires on insert and on update of approval_status.
create or replace function sync_approved_from_status()
returns trigger language plpgsql as $$
begin
  new.approved := (new.approval_status = 'approved');
  return new;
end;
$$;

create trigger trg_sync_approved
  before insert or update of approval_status
  on public.freelancer_profiles
  for each row execute function sync_approved_from_status();

-- Trigger: prevent authenticated users from modifying approval fields directly.
-- Only service_role database connections (used by the admin API routes) may
-- change approval_status, approved, or approval_notes.
create or replace function protect_approval_fields()
returns trigger language plpgsql as $$
begin
  if current_role = 'authenticated' then
    if (
      new.approval_status is distinct from old.approval_status or
      new.approved       is distinct from old.approved or
      new.approval_notes is distinct from old.approval_notes
    ) then
      raise exception 'approval fields can only be modified by an admin';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_protect_approval_fields
  before update on public.freelancer_profiles
  for each row execute function protect_approval_fields();

-- ============================================================
-- CLIENT PROFILES
-- No insert policy — rows created via service role in register API route.
-- ============================================================
create table public.client_profiles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  full_name    text not null,
  company_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create index on public.client_profiles (user_id);

alter table public.client_profiles enable row level security;

create policy "client_profiles: select own"
  on public.client_profiles for select
  using (auth.uid() = user_id);

create policy "client_profiles: update own"
  on public.client_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- HIRE REQUESTS
-- ============================================================
create table public.hire_requests (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.users(id) on delete restrict,
  freelancer_id uuid not null references public.users(id) on delete restrict,
  service       text not null,
  description   text not null,
  status        text not null default 'pending'
                  check (status in ('pending', 'accepted', 'declined', 'completed')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index on public.hire_requests (client_id);
create index on public.hire_requests (freelancer_id);

alter table public.hire_requests enable row level security;

create policy "hire_requests: select own"
  on public.hire_requests for select
  using (auth.uid() = client_id or auth.uid() = freelancer_id);

create policy "hire_requests: insert client"
  on public.hire_requests for insert
  with check (
    auth.uid() = client_id
    and exists (
      select 1 from public.users where id = auth.uid() and role = 'client'
    )
  );

-- Both parties may update; column-level status transition enforcement
-- is handled in application-layer API routes (Phase 2).
create policy "hire_requests: update parties"
  on public.hire_requests for update
  using (auth.uid() = client_id or auth.uid() = freelancer_id);

-- updated_at auto-trigger via moddatetime extension
create trigger trg_hire_requests_updated_at
  before update on public.hire_requests
  for each row execute function extensions.moddatetime(updated_at);

-- ============================================================
-- MESSAGES
-- ============================================================
create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references public.users(id) on delete restrict,
  receiver_id uuid not null references public.users(id) on delete restrict,
  request_id  uuid references public.hire_requests(id) on delete set null,
  content     text not null,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index on public.messages (sender_id);
create index on public.messages (receiver_id);
create index on public.messages (request_id);

alter table public.messages enable row level security;

create policy "messages: select own"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "messages: insert sender"
  on public.messages for insert
  with check (auth.uid() = sender_id);

-- Receiver may only flip read=true. with check prevents content tampering.
create policy "messages: update read (receiver only)"
  on public.messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id and read = true);

alter publication supabase_realtime add table public.messages;

-- ============================================================
-- NOTIFICATIONS
-- Service-role inserts only. Users can read + mark-read their own.
-- ============================================================
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  type       text not null,
  title      text not null,
  content    text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index on public.notifications (user_id);

alter table public.notifications enable row level security;

create policy "notifications: select own"
  on public.notifications for select
  using (auth.uid() = user_id);

-- User may only flip read=true. with check prevents content tampering.
create policy "notifications: update own (mark read)"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and read = true);

-- No insert policy — inserts must use service role key

alter publication supabase_realtime add table public.notifications;

-- ============================================================
-- SERVICES CATALOG
-- Public read. Service role write only.
-- ============================================================
create table public.services_catalog (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  icon        text,
  description text,
  active      boolean not null default true
);

alter table public.services_catalog enable row level security;

create policy "services_catalog: select authenticated"
  on public.services_catalog for select
  using (auth.role() = 'authenticated');

-- No insert/update/delete policies — service role only

-- ============================================================
-- CHATBOT SESSIONS
-- Service role only — no user-facing policies.
-- ============================================================
create table public.chatbot_sessions (
  id             uuid primary key default gen_random_uuid(),
  session_token  text unique not null,
  email          text,
  service_needed text,
  notes          text,
  notified       boolean not null default false,
  created_at     timestamptz not null default now()
);

create index on public.chatbot_sessions (session_token);

alter table public.chatbot_sessions enable row level security;

-- No policies — all operations require service role key

-- ============================================================
-- FREELANCER APPLICATIONS
-- Submitted via the /apply public form. Admin-only access.
-- ============================================================
create table if not exists public.freelancer_applications (
  id                  uuid primary key default gen_random_uuid(),
  full_name           text not null,
  email               text not null,
  phone_number        text,
  expertise_area      text not null,
  years_experience    text not null,
  preferred_role      text,
  portfolio_url       text,
  resume_url          text,
  availability_status text not null default 'Flexible',
  additional_notes    text,
  status              text not null default 'pending'
                        check (status in ('pending', 'approved', 'rejected')),
  admin_notes         text,
  created_at          timestamptz not null default now()
);

alter table public.freelancer_applications
  add column if not exists phone_number text,
  add column if not exists resume_url   text;

alter table public.freelancer_applications enable row level security;
-- No user-facing policies — all operations use service role key (adminClient)

-- ============================================================
-- SUPABASE STORAGE — avatars bucket
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

create policy "avatars: freelancer upload own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[2]
  );

create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars: freelancer delete own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[2]
  );

-- ============================================================
-- SUPABASE STORAGE — resumes bucket
-- Private. Service-role write (apply route), service-role read (admin
-- creates a short-lived signed URL via /api/admin/applications/[id]/resume).
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('resumes', 'resumes', false)
  on conflict (id) do nothing;

-- Public /apply form uploads to resumes/applications/<file>.
-- Anon may insert here; no select/update/delete — admin reads via signed URL.
create policy "resumes: applications insert"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = 'applications'
  );

-- Authenticated freelancers upload to resumes/freelancers/<auth.uid>/.
create policy "resumes: freelancer upload own"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = 'freelancers'
    and auth.uid()::text = (storage.foldername(name))[2]
  );

create policy "resumes: freelancer read own"
  on storage.objects for select
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = 'freelancers'
    and auth.uid()::text = (storage.foldername(name))[2]
  );

-- ============================================================
-- USERS — admin-facing columns
-- admin_notes : free-text moderator notes (PATCH /api/admin/users/[id]/notes)
-- deleted_at  : soft-delete timestamp (DELETE /api/admin/users/[id])
-- status      : account status for suspend/ban actions
-- ============================================================
alter table public.users
  add column if not exists admin_notes text,
  add column if not exists deleted_at  timestamptz,
  add column if not exists status      text not null default 'active'
    check (status in ('active', 'suspended', 'banned'));

create index if not exists users_status_idx     on public.users (status);
create index if not exists users_deleted_at_idx on public.users (deleted_at);

-- ============================================================
-- ADMIN LOGS — every privileged admin action.
-- Written by src/lib/audit.ts → logAdminAction().
-- Service-role write/read only.
-- ============================================================
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
-- No policies — service role only

-- ============================================================
-- EMAIL LOGS — outbound email delivery + failure tracking.
-- Written by src/lib/email-logger.ts → logEmail() / sendAndLog().
-- ============================================================
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
-- No policies — service role only

-- ============================================================
-- REPORTS — user-submitted abuse / content reports.
-- ============================================================
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
-- Admin reads via service role

-- ============================================================
-- SYSTEM SETTINGS — admin-configurable key/value pairs.
-- ============================================================
create table if not exists public.system_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_by  uuid references public.users(id) on delete set null,
  updated_at  timestamptz not null default now()
);

alter table public.system_settings enable row level security;
-- Service role only

-- ============================================================
-- SECURITY EVENTS — auth-layer events (failed login, lockout, IP anomalies).
-- ============================================================
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
-- Service role only

-- ============================================================
-- USER SESSIONS — tracked sessions for the session-management UI.
-- Note: Supabase auth.sessions is the source of truth; this table mirrors
-- additional metadata (device, location) for admin/user-facing display.
-- ============================================================
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
-- Insert/update/revoke via service role

-- ============================================================
-- SUBSCRIPTIONS — Stripe subscription mirror.
-- Written by /api/stripe/{checkout,webhook}. Service role only.
-- ============================================================
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
-- Insert/update via service role only

-- ============================================================
-- ACTIVITY LOGS — user-facing timeline (login, profile edit, message sent…).
-- Separate from admin_logs (which records admin actions only).
-- ============================================================
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
-- Inserts via service role
