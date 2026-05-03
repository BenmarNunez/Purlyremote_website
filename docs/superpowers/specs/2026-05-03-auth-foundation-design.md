# Phase 1: Auth + Database Foundation Design
**Date:** 2026-05-03  
**Project:** PurlyRemote — Multi-Role Freelance Hiring Platform  
**Scope:** Authentication system, database schema, middleware, auth pages, register API

---

## 1. Architecture Overview

**Auth system:** Supabase Auth + `@supabase/ssr`. NextAuth is not used.

**Role storage strategy (Approach C):**  
Role is written to two places at registration time:
- `app_metadata.role` on the Supabase Auth user — read by middleware from the JWT (zero DB queries on protected routes)
- `public.users.role` column — used by application logic, RLS policies, joins, and admin tooling

These stay in sync. `app_metadata` is the middleware source of truth; the DB column is the application source of truth.

**Three Supabase clients:**

| Client | File | Key Used | Purpose |
|--------|------|----------|---------|
| Browser | `src/lib/supabase/client.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client Components (auth UI calls) |
| Server | `src/lib/supabase/server.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Server Components, Route Handlers, middleware |
| Admin | `src/lib/supabase/admin.ts` | `SUPABASE_SERVICE_ROLE_KEY` | Registration route only — bypasses RLS, writes app_metadata |

The admin client is never imported in browser code. The server client is created fresh per-request using `@supabase/ssr`'s `createServerClient` with cookie helpers.

**Packages to install:**
```
@supabase/supabase-js  @supabase/ssr  bcryptjs  @types/bcryptjs
```
Note: `bcryptjs` is installed but not used — Supabase Auth handles password hashing. It remains available for future use cases.

---

## 2. Database Schema

### `public.users`
Mirrors the Supabase Auth user. Created immediately after `auth.admin.createUser` succeeds.

```sql
id         uuid primary key references auth.users(id) on delete cascade
email      text unique not null
role       text not null check (role in ('client', 'freelancer', 'admin'))
created_at timestamptz not null default now()
```

### `public.freelancer_profiles`

```sql
id               uuid primary key default gen_random_uuid()
user_id          uuid not null references public.users(id) on delete cascade
full_name        text not null
bio              text
skills           text[] default '{}'
services         text[] default '{}'
hourly_rate      numeric
availability     boolean not null default true
portfolio_url    text
avatar_url       text
approved         boolean not null default false        -- fast RLS filter
approval_status  text not null default 'pending'
                   check (approval_status in ('pending', 'approved', 'rejected'))
approval_notes   text
profile_completed boolean not null default false
created_at       timestamptz not null default now()
```

`approved` and `approval_status` are kept in sync by a trigger: when `approval_status` is set to `'approved'`, `approved` flips to `true`; any other status sets it to `false`.

### `public.client_profiles`

```sql
id           uuid primary key default gen_random_uuid()
user_id      uuid not null references public.users(id) on delete cascade
full_name    text not null
company_name text
avatar_url   text
created_at   timestamptz not null default now()
```

### `public.hire_requests`

```sql
id            uuid primary key default gen_random_uuid()
client_id     uuid not null references public.users(id)
freelancer_id uuid not null references public.users(id)
service       text not null
description   text not null
status        text not null default 'pending'
                check (status in ('pending', 'accepted', 'declined', 'completed'))
created_at    timestamptz not null default now()
updated_at    timestamptz not null default now()
```

`updated_at` is maintained by a `moddatetime` trigger (requires `moddatetime` extension).

### `public.messages`

```sql
id          uuid primary key default gen_random_uuid()
sender_id   uuid not null references public.users(id)
receiver_id uuid not null references public.users(id)
request_id  uuid references public.hire_requests(id) on delete set null
content     text not null
read        boolean not null default false
created_at  timestamptz not null default now()
```

Added to `supabase_realtime` publication for live message delivery.

### `public.notifications`

```sql
id         uuid primary key default gen_random_uuid()
user_id    uuid not null references public.users(id) on delete cascade
type       text not null
title      text not null
content    text not null
read       boolean not null default false
created_at timestamptz not null default now()
```

Added to `supabase_realtime` publication. Inserts are service-role-only — no user-facing insert policy. RLS allows users to read and update (mark read) their own rows only.

### `public.services_catalog`

```sql
id          uuid primary key default gen_random_uuid()
name        text not null
icon        text
description text
active      boolean not null default true
```

Public read. Admin write only (service role).

### `public.chatbot_sessions`

```sql
id            uuid primary key default gen_random_uuid()
session_token text not null
email         text
service_needed text
notes         text
notified      boolean not null default false
created_at    timestamptz not null default now()
```

No user-facing RLS — service role only for all operations.

### RLS Summary

| Table | Select | Insert | Update | Delete |
|-------|--------|--------|--------|--------|
| `users` | own row | service role | service role | service role |
| `freelancer_profiles` | own row + clients see approved rows | service role | own row | service role |
| `client_profiles` | own row | service role | own row | service role |
| `hire_requests` | client_id or freelancer_id match | client only | parties involved | service role |
| `messages` | sender or receiver | authenticated (sender = auth.uid()) | receiver (mark read) | service role |
| `notifications` | own user_id | service role | own user_id (mark read) | service role |
| `services_catalog` | all authenticated | service role | service role | service role |
| `chatbot_sessions` | service role | service role | service role | service role |

---

## 3. Auth Flows

### Client Registration

```
POST /api/auth/register { role: 'client', full_name, company_name?, email, password, confirm_password }
  → adminClient.auth.admin.createUser({ email, password, app_metadata: { role: 'client' }, email_confirm: true })
  → insert public.users(id, email, role: 'client')
  → insert public.client_profiles(user_id, full_name, company_name)
  → return { success: true, role: 'client', requiresEmailConfirmation: false }
  → frontend redirects to /client/dashboard
```

Email confirmation is skipped for clients (`email_confirm: true` in Supabase means the user is created as already confirmed).

### Freelancer Registration

```
POST /api/auth/register { role: 'freelancer', full_name, email, password, confirm_password, expertise_area }
  → adminClient.auth.admin.createUser({ email, password, app_metadata: { role: 'freelancer' }, email_confirm: false })
  → insert public.users(id, email, role: 'freelancer')
  → insert public.freelancer_profiles(user_id, full_name, skills: [expertise_area], approval_status: 'pending', approved: false, profile_completed: false)
  → return { success: true, role: 'freelancer', requiresEmailConfirmation: true }
  → frontend redirects to /auth/check-email
```

On DB insert failure after auth user created: `adminClient.auth.admin.deleteUser(newUser.id)` is called to clean up the orphaned auth user before returning 500.

### Email Confirmation (Freelancer)

```
User clicks email link
  → GET /auth/confirm?code=...
  → server: supabase.auth.exchangeCodeForSession(code)
  → on error → redirect /auth/login?error=confirmation_failed
  → on success → session cookies set server-side → redirect /freelancer/dashboard
  → dashboard reads approval_status from DB → shows "Pending Approval" banner
```

The `/auth/confirm` handler is a **Route Handler** (`src/app/auth/confirm/route.ts`), not a page. No client-side auth state is involved.

### Admin Approval

```
Admin navigates to /admin/freelancers
  → PATCH /api/admin/freelancers/[id]
  → service role updates freelancer_profiles:
      approval_status = 'approved'
      approved = true  (also flipped by trigger)
  → trigger fires on approved column
  → Resend email sent to freelancer notifying approval
  → no app_metadata update required
```

### Login

```
/auth/login form submit
  → client-side: supabase.auth.signInWithPassword({ email, password })
  → read session.user.app_metadata.role
  → redirect to /{role}/dashboard
  → middleware confirms role matches route prefix
  → dashboard reads approval_status from DB if needed
```

### Logout

```
supabase.auth.signOut()  ← client-side
→ redirect to /
```

---

## 4. Middleware

**File:** `src/middleware.ts`

**Matcher:**
```ts
export const config = {
  matcher: ['/client/:path*', '/freelancer/:path*', '/admin/:path*', '/auth/:path*']
}
```

**Flow (critical: cookies must be copied to every response including redirects):**

```
Request comes in
  ↓
Create Supabase server client (cookie-aware, produces supabaseResponse)
  ↓
supabase.auth.getUser()  ← validates JWT, refreshes token if needed, writes to supabaseResponse cookies
  ↓
  ├── No user
  │     └── redirect /auth/login (copy cookies from supabaseResponse)
  │
  ├── User visits /auth/*
  │     └── already logged in → redirect /{role}/dashboard (copy cookies)
  │
  ├── /client/* and role !== 'client'
  │     └── redirect /{role}/dashboard (copy cookies)
  │
  ├── /freelancer/* and role !== 'freelancer'
  │     └── redirect /{role}/dashboard (copy cookies)
  │
  ├── /admin/* and role !== 'admin'
  │     └── redirect /{role}/dashboard (copy cookies)
  │
  └── All checks pass
        └── return supabaseResponse (refreshed cookies intact)
```

Middleware never queries the database. Role is read from `user.app_metadata.role` (JWT). Approval state is not checked at middleware level — dashboard UI handles it.

---

## 5. Pages

### `/auth/login` — `src/app/auth/login/page.tsx`
- **Two-file pattern required by Next.js 15:** `page.tsx` is a Server Component that wraps `<LoginForm>` in `<Suspense fallback={null}>`. `LoginForm` is a separate `"use client"` component in the same directory.
- Reads `?error` query param via `useSearchParams()` inside `LoginForm` only
- If `error === 'confirmation_failed'`: shows error box above form using `.form-error` class inside `bg-red-50 border border-red-200 rounded-input p-3`
  - Message: "Your confirmation link has expired or already been used. Please register again or contact support."
- Fields: Email (`.form-input`), Password (`.form-input`)
- Labels with `.form-label`
- Submit: `.btn-primary` full-width — calls `supabase.auth.signInWithPassword()` client-side
- On success: reads `session.user.app_metadata.role`, uses `router.push('/{role}/dashboard')`
- On failure: inline `.form-error` message below submit button
- Link to `/auth/register` below form
- Fonts: `font-heading` (Syne) for heading, `font-body` (DM Sans) for body

### `/auth/register` — `src/app/auth/register/page.tsx`
- `"use client"`
- Toggle at top: "I'm a Client" / "I'm a Freelancer" — switches form fields below
- **Client fields:** full_name, company_name (optional), email, password, confirm_password
- **Freelancer fields:** full_name, email, password, confirm_password, expertise_area (select — same 12 options as existing `FreelancerApplicationForm`)
- Validation: `react-hook-form` + `zodResolver` with `discriminatedUnion` schema
- POST to `/api/auth/register`
- Client success → `router.push('/client/dashboard')`
- Freelancer success → `router.push('/auth/check-email')`
- All inputs use `.form-input`, `.form-label`, `.form-error` classes

### `/auth/check-email` — `src/app/auth/check-email/page.tsx`
- Server Component (no auth required, no `"use client"`)
- Static informational page
- Centered card telling user to check their inbox and confirm their email
- Link back to `/auth/login`

### `/auth/confirm` — `src/app/auth/confirm/route.ts`
- **Route Handler (GET)**, not a page
- Reads `code` from `searchParams`
- If no `code` → `redirect('/auth/login')`
- Calls `supabase.auth.exchangeCodeForSession(code)` server-side
- If error → `redirect('/auth/login?error=confirmation_failed')`
- If success → session cookies set before redirect → `redirect('/freelancer/dashboard')`

---

## 6. API Routes

### `POST /api/auth/register` — `src/app/api/auth/register/route.ts`

```
1. Read body as JSON
2. If body.role === 'admin' → 403 { error: 'Admin accounts cannot be self-registered.' }
   // Admin accounts are created via POST /api/admin/seed using ADMIN_SEED_SECRET env var
3. Zod discriminatedUnion parse → 400 on failure
4. adminClient.auth.admin.createUser({
     email, password,
     app_metadata: { role },
     email_confirm: role === 'client'
   })
5. On Supabase auth error → 409 { error: message }
6. Insert public.users(id: newUser.id, email, role) via service role client
7a. If client → insert public.client_profiles(user_id, full_name, company_name)
7b. If freelancer → insert public.freelancer_profiles(
      user_id, full_name,
      skills: [expertise_area], services: [],
      approval_status: 'pending', approved: false, profile_completed: false
    )
8. On any DB insert failure:
   - adminClient.auth.admin.deleteUser(newUser.id)
   - return 500 { error: 'Registration failed. Please try again.' }
9. Return 200 { success: true, role, requiresEmailConfirmation: role === 'freelancer' }
```

**Zod schema:**
```ts
z.discriminatedUnion('role', [
  z.object({
    role: z.literal('client'),
    full_name: z.string().min(2),
    company_name: z.string().optional(),
    email: z.string().email(),
    password: z.string().min(8),
    confirm_password: z.string()
  }).refine(d => d.password === d.confirm_password, {
    message: 'Passwords do not match', path: ['confirm_password']
  }),
  z.object({
    role: z.literal('freelancer'),
    full_name: z.string().min(2),
    expertise_area: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    confirm_password: z.string()
  }).refine(d => d.password === d.confirm_password, {
    message: 'Passwords do not match', path: ['confirm_password']
  })
])
```

All DB writes use service-role client. Anon client is never used server-side in this route. No `any` types.

---

## 7. Environment Variables

**`.env.example` (final):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
ANTHROPIC_API_KEY=
ADMIN_SEED_SECRET=
```

Removed: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`  
`RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL` remain (used by existing contact/apply/hire routes).

---

## 8. Files to Create / Modify

| Action | File |
|--------|------|
| Create | `src/lib/supabase/client.ts` |
| Create | `src/lib/supabase/server.ts` |
| Create | `src/lib/supabase/admin.ts` |
| Create | `src/middleware.ts` |
| Create | `src/app/auth/login/page.tsx` (Server Component shell + Suspense wrapper) |
| Create | `src/app/auth/login/LoginForm.tsx` (Client Component with useSearchParams) |
| Create | `src/app/auth/register/page.tsx` |
| Create | `src/app/auth/check-email/page.tsx` |
| Create | `src/app/auth/confirm/route.ts` |
| Create | `src/app/api/auth/register/route.ts` |
| Create | `supabase/schema.sql` |
| Modify | `.env.example` |

Stub placeholder pages (Server Components, no logic):
| Create | `src/app/client/dashboard/page.tsx` |
| Create | `src/app/freelancer/dashboard/page.tsx` |
| Create | `src/app/freelancer/pending/page.tsx` (optional — middleware sends here if needed) |
| Create | `src/app/admin/dashboard/page.tsx` |
