-- ============================================================
-- Migration: 2026-05-26 — portfolio image gallery
-- Append-only. Idempotent.
-- ============================================================

alter table public.freelancer_profiles
  add column if not exists portfolio_images text[] not null default '{}';

insert into storage.buckets (id, name, public)
  values ('portfolios', 'portfolios', true)
  on conflict (id) do nothing;

drop policy if exists "portfolios: freelancer upload own" on storage.objects;
create policy "portfolios: freelancer upload own"
  on storage.objects for insert
  with check (
    bucket_id = 'portfolios'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "portfolios: public read" on storage.objects;
create policy "portfolios: public read"
  on storage.objects for select
  using (bucket_id = 'portfolios');

drop policy if exists "portfolios: freelancer delete own" on storage.objects;
create policy "portfolios: freelancer delete own"
  on storage.objects for delete
  using (
    bucket_id = 'portfolios'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
