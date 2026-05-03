-- ============================================================
-- PurlyRemote Schema — run this in Supabase SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
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

-- Freelancer updates their own profile
create policy "freelancer_profiles: update own"
  on public.freelancer_profiles for update
  using (auth.uid() = user_id);

-- Trigger: keep approved boolean in sync with approval_status text
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

-- ============================================================
-- CLIENT PROFILES
-- ============================================================
create table public.client_profiles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  full_name    text not null,
  company_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

alter table public.client_profiles enable row level security;

create policy "client_profiles: select own"
  on public.client_profiles for select
  using (auth.uid() = user_id);

create policy "client_profiles: update own"
  on public.client_profiles for update
  using (auth.uid() = user_id);

-- ============================================================
-- HIRE REQUESTS
-- ============================================================
create table public.hire_requests (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.users(id),
  freelancer_id uuid not null references public.users(id),
  service       text not null,
  description   text not null,
  status        text not null default 'pending'
                  check (status in ('pending', 'accepted', 'declined', 'completed')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

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
  sender_id   uuid not null references public.users(id),
  receiver_id uuid not null references public.users(id),
  request_id  uuid references public.hire_requests(id) on delete set null,
  content     text not null,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "messages: select own"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "messages: insert sender"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "messages: update read (receiver only)"
  on public.messages for update
  using (auth.uid() = receiver_id);

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

alter table public.notifications enable row level security;

create policy "notifications: select own"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications: update own (mark read)"
  on public.notifications for update
  using (auth.uid() = user_id);

-- No insert policy — inserts must use service role key

alter publication supabase_realtime add table public.notifications;

-- ============================================================
-- SERVICES CATALOG
-- Public read. Service role write only.
-- ============================================================
create table public.services_catalog (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
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
  session_token  text not null,
  email          text,
  service_needed text,
  notes          text,
  notified       boolean not null default false,
  created_at     timestamptz not null default now()
);

alter table public.chatbot_sessions enable row level security;

-- No policies — all operations require service role key
