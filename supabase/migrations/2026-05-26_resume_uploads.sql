-- ============================================================
-- Migration: 2026-05-26 — resume uploads on freelancer applications
-- Append-only. Idempotent.
-- ============================================================

-- Add columns to freelancer_applications
alter table public.freelancer_applications
  add column if not exists phone_number text,
  add column if not exists resume_url   text;

-- Create private resumes bucket
insert into storage.buckets (id, name, public)
  values ('resumes', 'resumes', false)
  on conflict (id) do nothing;

-- Anonymous (public /apply form) inserts into resumes/applications/*
drop policy if exists "resumes: applications insert" on storage.objects;
create policy "resumes: applications insert"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = 'applications'
  );

-- Authenticated freelancers upload to resumes/freelancers/<auth.uid>/
drop policy if exists "resumes: freelancer upload own" on storage.objects;
create policy "resumes: freelancer upload own"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = 'freelancers'
    and auth.uid()::text = (storage.foldername(name))[2]
  );

drop policy if exists "resumes: freelancer read own" on storage.objects;
create policy "resumes: freelancer read own"
  on storage.objects for select
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = 'freelancers'
    and auth.uid()::text = (storage.foldername(name))[2]
  );
-- No public read; admin reads via service-role signed URL
