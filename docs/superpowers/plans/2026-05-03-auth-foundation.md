# Auth Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Phase 1 auth + database foundation — Supabase Auth, role-based middleware, register/login/confirm pages, and the full SQL schema.

**Architecture:** Supabase Auth + `@supabase/ssr` with no NextAuth. Role stored in both `app_metadata` (JWT, for zero-DB-query middleware) and `public.users.role` (for RLS and app logic). Three Supabase clients: browser singleton, per-request server client, and service-role admin client used only in the register API route.

**Tech Stack:** Next.js 15 App Router, TypeScript strict mode, Supabase Auth, @supabase/ssr, Zod, react-hook-form, Tailwind (existing design tokens only), Vitest for unit tests.

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/lib/supabase/client.ts` | Browser singleton — used in Client Components |
| Create | `src/lib/supabase/server.ts` | Cookie-aware server factory — used in Server Components, Route Handlers |
| Create | `src/lib/supabase/admin.ts` | Service-role client — register route only, never browser |
| Create | `src/middleware.ts` | Role-based route protection, cookie-safe redirects |
| Create | `src/middleware.utils.ts` | Pure routing logic — extracted for testability |
| Create | `src/middleware.utils.test.ts` | Unit tests for routing logic |
| Create | `src/app/api/auth/register/schema.ts` | Zod discriminatedUnion schema — extracted for testability |
| Create | `src/app/api/auth/register/schema.test.ts` | Unit tests for register schema |
| Create | `src/app/api/auth/register/route.ts` | POST handler — creates Supabase Auth user + DB rows |
| Create | `src/app/auth/confirm/route.ts` | GET handler — exchanges email code for session |
| Create | `src/app/auth/login/page.tsx` | Server Component shell with Suspense boundary |
| Create | `src/app/auth/login/LoginForm.tsx` | "use client" — form, useSearchParams, signInWithPassword |
| Create | `src/app/auth/register/page.tsx` | "use client" — role toggle, two forms, POSTs to register API |
| Create | `src/app/auth/check-email/page.tsx` | Static Server Component — post-freelancer-registration info |
| Create | `src/app/client/dashboard/page.tsx` | Stub — protected by middleware |
| Create | `src/app/freelancer/dashboard/page.tsx` | Stub — protected by middleware |
| Create | `src/app/admin/dashboard/page.tsx` | Stub — protected by middleware |
| Create | `supabase/schema.sql` | Full schema: 8 tables, RLS, triggers, realtime |
| Modify | `.env.example` | Remove NextAuth vars, add Supabase + ADMIN_SEED_SECRET |
| Create | `vitest.config.ts` | Test runner config with path alias |

---

## Task 1: Install packages and update .env.example

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env.example`

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr bcryptjs
```

Expected output: `added N packages` with no errors.

- [ ] **Step 2: Install dev dependencies**

```bash
npm install -D @types/bcryptjs vitest @vitejs/plugin-react jsdom
```

Expected output: `added N packages` with no errors.

- [ ] **Step 3: Replace .env.example contents**

Replace the entire file with:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Site
NEXT_PUBLIC_SITE_URL=

# Admin seed (for creating admin accounts via POST /api/admin/seed)
ADMIN_SEED_SECRET=

# AI
ANTHROPIC_API_KEY=

# Email (Resend — used by existing contact/apply/hire routes)
RESEND_API_KEY=
CONTACT_FROM_EMAIL=
CONTACT_TO_EMAIL=
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: install supabase and vitest packages"
```

---

## Task 2: Set up Vitest

**Files:**
- Create: `vitest.config.ts`

- [ ] **Step 1: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 2: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Run vitest to verify setup**

```bash
npm test
```

Expected: `No test files found` — not an error, just no tests yet. Exit 0.

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: configure vitest for unit testing"
```

---

## Task 3: Create Supabase client utilities

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/admin.ts`

- [ ] **Step 1: Create browser client — `src/lib/supabase/client.ts`**

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Create server client — `src/lib/supabase/server.ts`**

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookie mutations are handled by middleware
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Create admin client — `src/lib/supabase/admin.ts`**

```ts
import { createClient } from '@supabase/supabase-js'

export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/
git commit -m "feat: add supabase client utilities (browser, server, admin)"
```

---

## Task 4: Write SQL schema

**Files:**
- Create: `supabase/schema.sql`

- [ ] **Step 1: Create supabase/schema.sql**

```sql
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
```

- [ ] **Step 2: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add full supabase database schema with RLS and triggers"
```

---

## Task 5: Register schema (TDD)

**Files:**
- Create: `src/app/api/auth/register/schema.ts`
- Create: `src/app/api/auth/register/schema.test.ts`

- [ ] **Step 1: Write failing tests — `src/app/api/auth/register/schema.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { registerSchema } from './schema'

describe('registerSchema', () => {
  it('rejects unknown roles (discriminatedUnion falls through)', () => {
    const result = registerSchema.safeParse({
      role: 'admin',
      full_name: 'Evil Admin',
      email: 'admin@evil.com',
      password: 'password123',
      confirm_password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('validates valid client registration', () => {
    const result = registerSchema.safeParse({
      role: 'client',
      full_name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirm_password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('accepts client with optional company_name', () => {
    const result = registerSchema.safeParse({
      role: 'client',
      full_name: 'John Doe',
      company_name: 'Acme Corp',
      email: 'john@example.com',
      password: 'password123',
      confirm_password: 'password123',
    })
    expect(result.success).toBe(true)
    if (result.success && result.data.role === 'client') {
      expect(result.data.company_name).toBe('Acme Corp')
    }
  })

  it('rejects client with mismatched passwords', () => {
    const result = registerSchema.safeParse({
      role: 'client',
      full_name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirm_password: 'different',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      expect(errors.confirm_password).toContain('Passwords do not match')
    }
  })

  it('validates valid freelancer registration', () => {
    const result = registerSchema.safeParse({
      role: 'freelancer',
      full_name: 'Jane Doe',
      expertise_area: 'Software Development',
      email: 'jane@example.com',
      password: 'password123',
      confirm_password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects freelancer without expertise_area', () => {
    const result = registerSchema.safeParse({
      role: 'freelancer',
      full_name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
      confirm_password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects freelancer with mismatched passwords', () => {
    const result = registerSchema.safeParse({
      role: 'freelancer',
      full_name: 'Jane Doe',
      expertise_area: 'Design',
      email: 'jane@example.com',
      password: 'password123',
      confirm_password: 'mismatch',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      expect(errors.confirm_password).toContain('Passwords do not match')
    }
  })

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      role: 'client',
      full_name: 'John Doe',
      email: 'john@example.com',
      password: 'short',
      confirm_password: 'short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      role: 'client',
      full_name: 'John Doe',
      email: 'not-an-email',
      password: 'password123',
      confirm_password: 'password123',
    })
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests — confirm they all fail**

```bash
npm test
```

Expected: `Cannot find module './schema'` — tests fail because schema.ts doesn't exist yet.

- [ ] **Step 3: Implement schema — `src/app/api/auth/register/schema.ts`**

```ts
import { z } from 'zod'

export const clientSchema = z.object({
  role: z.literal('client'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  company_name: z.string().optional(),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

export const freelancerSchema = z.object({
  role: z.literal('freelancer'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  expertise_area: z.string().min(2, 'Please select your expertise'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

export const registerSchema = z.discriminatedUnion('role', [
  clientSchema,
  freelancerSchema,
])

export type RegisterInput = z.infer<typeof registerSchema>
export type ClientInput = z.infer<typeof clientSchema>
export type FreelancerInput = z.infer<typeof freelancerSchema>
```

- [ ] **Step 4: Run tests — confirm all pass**

```bash
npm test
```

Expected: `9 tests passed`.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/register/schema.ts src/app/api/auth/register/schema.test.ts
git commit -m "feat: add register zod schema with discriminatedUnion (TDD)"
```

---

## Task 6: Middleware routing logic (TDD)

**Files:**
- Create: `src/middleware.utils.ts`
- Create: `src/middleware.utils.test.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: Write failing tests — `src/middleware.utils.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { getRedirectPath } from './middleware.utils'

const makeUser = (role: string) => ({ app_metadata: { role } })

describe('getRedirectPath', () => {
  it('returns /auth/login for unauthenticated user on protected route', () => {
    expect(getRedirectPath(null, '/client/dashboard')).toBe('/auth/login')
    expect(getRedirectPath(null, '/freelancer/dashboard')).toBe('/auth/login')
    expect(getRedirectPath(null, '/admin/dashboard')).toBe('/auth/login')
  })

  it('returns null for unauthenticated user on /auth routes', () => {
    expect(getRedirectPath(null, '/auth/login')).toBeNull()
    expect(getRedirectPath(null, '/auth/register')).toBeNull()
  })

  it('redirects authenticated user away from /auth routes to their dashboard', () => {
    expect(getRedirectPath(makeUser('client'), '/auth/login')).toBe('/client/dashboard')
    expect(getRedirectPath(makeUser('freelancer'), '/auth/register')).toBe('/freelancer/dashboard')
    expect(getRedirectPath(makeUser('admin'), '/auth/login')).toBe('/admin/dashboard')
  })

  it('returns null when role matches route prefix', () => {
    expect(getRedirectPath(makeUser('client'), '/client/dashboard')).toBeNull()
    expect(getRedirectPath(makeUser('freelancer'), '/freelancer/profile')).toBeNull()
    expect(getRedirectPath(makeUser('admin'), '/admin/freelancers')).toBeNull()
  })

  it('redirects wrong-role user to their own dashboard', () => {
    expect(getRedirectPath(makeUser('freelancer'), '/client/dashboard')).toBe('/freelancer/dashboard')
    expect(getRedirectPath(makeUser('client'), '/admin/dashboard')).toBe('/client/dashboard')
    expect(getRedirectPath(makeUser('admin'), '/freelancer/profile')).toBe('/admin/dashboard')
  })

  it('handles deeply nested paths', () => {
    expect(getRedirectPath(null, '/client/settings/billing')).toBe('/auth/login')
    expect(getRedirectPath(makeUser('client'), '/client/settings/billing')).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test
```

Expected: `Cannot find module './middleware.utils'`

- [ ] **Step 3: Implement routing logic — `src/middleware.utils.ts`**

```ts
type PartialUser = { app_metadata?: { role?: string } } | null

export function getRedirectPath(user: PartialUser, pathname: string): string | null {
  const role = user?.app_metadata?.role

  if (!user) {
    return pathname.startsWith('/auth') ? null : '/auth/login'
  }

  if (pathname.startsWith('/auth')) {
    return `/${role}/dashboard`
  }

  if (pathname.startsWith('/client') && role !== 'client') return `/${role}/dashboard`
  if (pathname.startsWith('/freelancer') && role !== 'freelancer') return `/${role}/dashboard`
  if (pathname.startsWith('/admin') && role !== 'admin') return `/${role}/dashboard`

  return null
}
```

- [ ] **Step 4: Run tests — confirm all pass**

```bash
npm test
```

Expected: `15 tests passed` (9 from schema + 6 from middleware utils).

- [ ] **Step 5: Implement middleware — `src/middleware.ts`**

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getRedirectPath } from './middleware.utils'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() validates JWT server-side and refreshes the token.
  // Never use getSession() here — it trusts the client-side cookie without validation.
  const { data: { user } } = await supabase.auth.getUser()

  const redirectPath = getRedirectPath(user, request.nextUrl.pathname)

  if (redirectPath) {
    const url = request.nextUrl.clone()
    url.pathname = redirectPath
    const redirectResponse = NextResponse.redirect(url)
    // Copy refreshed auth cookies to the redirect response
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/client/:path*', '/freelancer/:path*', '/admin/:path*', '/auth/:path*'],
}
```

- [ ] **Step 6: Commit**

```bash
git add src/middleware.ts src/middleware.utils.ts src/middleware.utils.test.ts
git commit -m "feat: add role-based middleware with cookie-safe redirects (TDD)"
```

---

## Task 7: Register API route

**Files:**
- Create: `src/app/api/auth/register/route.ts`

- [ ] **Step 1: Create the route handler**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { registerSchema } from './schema'

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Block admin self-registration.
  // Admin accounts are created via POST /api/admin/seed using ADMIN_SEED_SECRET env var.
  if (body.role === 'admin') {
    return NextResponse.json(
      { error: 'Admin accounts cannot be self-registered.' },
      { status: 403 }
    )
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  // Create Supabase Auth user via admin API.
  // email_confirm: true = skip email confirmation (clients get immediate access)
  // email_confirm: false = send confirmation email (freelancers must confirm first)
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: data.email,
    password: data.password,
    app_metadata: { role: data.role },
    email_confirm: data.role === 'client',
  })

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? 'Registration failed' },
      { status: 409 }
    )
  }

  const userId = authData.user.id

  try {
    const { error: userError } = await adminClient
      .from('users')
      .insert({ id: userId, email: data.email, role: data.role })

    if (userError) throw userError

    if (data.role === 'client') {
      const { error: profileError } = await adminClient
        .from('client_profiles')
        .insert({
          user_id: userId,
          full_name: data.full_name,
          company_name: data.company_name ?? null,
        })
      if (profileError) throw profileError
    } else {
      const { error: profileError } = await adminClient
        .from('freelancer_profiles')
        .insert({
          user_id: userId,
          full_name: data.full_name,
          skills: [data.expertise_area],
          services: [],
          approval_status: 'pending',
          approved: false,
          profile_completed: false,
        })
      if (profileError) throw profileError
    }
  } catch {
    // Clean up orphaned Supabase Auth user if DB inserts fail
    await adminClient.auth.admin.deleteUser(userId)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    role: data.role,
    requiresEmailConfirmation: data.role === 'freelancer',
  })
}
```

- [ ] **Step 2: Run existing tests to verify nothing broke**

```bash
npm test
```

Expected: `15 tests passed` (same as before — route.ts has no unit tests, it's tested manually in Task 13).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/auth/register/route.ts
git commit -m "feat: add POST /api/auth/register with orphan cleanup"
```

---

## Task 8: Auth confirm route handler

**Files:**
- Create: `src/app/auth/confirm/route.ts`

- [ ] **Step 1: Create the route handler**

```ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL('/auth/login?error=confirmation_failed', request.url)
    )
  }

  return NextResponse.redirect(new URL('/freelancer/dashboard', request.url))
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/auth/confirm/route.ts
git commit -m "feat: add GET /auth/confirm email confirmation handler"
```

---

## Task 9: Login page

**Files:**
- Create: `src/app/auth/login/page.tsx`
- Create: `src/app/auth/login/LoginForm.tsx`

- [ ] **Step 1: Create the Server Component shell — `src/app/auth/login/page.tsx`**

```tsx
import { Suspense } from 'react'
import type { Metadata } from 'next'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Sign In',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-neutral-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-neutral-text">
            Welcome back
          </h1>
          <p className="text-neutral-muted mt-2 font-body">
            Sign in to your Purly Remote account
          </p>
        </div>
        {/* Suspense required — LoginForm uses useSearchParams() */}
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
        <p className="text-center text-sm text-neutral-muted mt-6 font-body">
          Don&apos;t have an account?{' '}
          <a
            href="/auth/register"
            className="text-brand-blue font-semibold hover:underline"
          >
            Register
          </a>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create the client form component — `src/app/auth/login/LoginForm.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      setFormError(error?.message ?? 'Invalid email or password')
      setLoading(false)
      return
    }

    const role = data.user.app_metadata?.role as string
    router.push(`/${role}/dashboard`)
  }

  return (
    <div className="card border border-neutral-border">
      {errorParam === 'confirmation_failed' && (
        <div className="bg-red-50 border border-red-200 rounded-input p-3 mb-5">
          <p className="form-error">
            Your confirmation link has expired or already been used. Please
            register again or contact support.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="form-input"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="form-input"
            required
            autoComplete="current-password"
          />
        </div>

        {formError && <p className="form-error">{formError}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/auth/login/
git commit -m "feat: add login page with Suspense boundary and confirmation error handling"
```

---

## Task 10: Register page

**Files:**
- Create: `src/app/auth/register/page.tsx`

- [ ] **Step 1: Create the register page**

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { clientSchema, freelancerSchema, type ClientInput, type FreelancerInput } from '@/app/api/auth/register/schema'
import { createClient } from '@/lib/supabase/client'

const expertiseOptions = [
  'Software Development',
  'UI/UX Design',
  'Digital Marketing',
  'Content Writing & Copywriting',
  'Virtual Assistant',
  'Project Management',
  'Data Analysis',
  'Graphic Design',
  'Video Editing',
  'Customer Support',
  'Accounting & Finance',
  'Other',
]

export default function RegisterPage() {
  const router = useRouter()
  const [activeRole, setActiveRole] = useState<'client' | 'freelancer'>('client')
  const [serverError, setServerError] = useState<string | null>(null)

  const clientForm = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: { role: 'client' },
  })

  const freelancerForm = useForm<FreelancerInput>({
    resolver: zodResolver(freelancerSchema),
    defaultValues: { role: 'freelancer' },
  })

  const handleSubmit = async (data: ClientInput | FreelancerInput) => {
    setServerError(null)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json() as { error?: string; requiresEmailConfirmation?: boolean }

      if (!res.ok) {
        setServerError(typeof json.error === 'string' ? json.error : 'Registration failed. Please try again.')
        return
      }

      if (json.requiresEmailConfirmation) {
        router.push('/auth/check-email')
      } else {
        // Auto sign-in client — adminClient.createUser does not create a session
        const supabase = createClient()
        await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
        router.push('/client/dashboard')
      }
    } catch {
      setServerError('Something went wrong. Please try again.')
    }
  }

  const isClientSubmitting = clientForm.formState.isSubmitting
  const isFreelancerSubmitting = freelancerForm.formState.isSubmitting

  return (
    <div className="min-h-screen bg-neutral-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-neutral-text">
            Create an account
          </h1>
          <p className="text-neutral-muted mt-2 font-body">Join Purly Remote today</p>
        </div>

        {/* Role toggle */}
        <div className="flex rounded-btn border border-neutral-border bg-white p-1 mb-6">
          {(['client', 'freelancer'] as const).map(role => (
            <button
              key={role}
              type="button"
              onClick={() => { setActiveRole(role); setServerError(null) }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-btn transition-all ${
                activeRole === role
                  ? 'bg-brand-blue text-white shadow-btn'
                  : 'text-neutral-muted hover:text-neutral-text'
              }`}
            >
              {role === 'client' ? "I'm a Client" : "I'm a Freelancer"}
            </button>
          ))}
        </div>

        <div className="card border border-neutral-border">
          {/* Client form */}
          {activeRole === 'client' && (
            <form onSubmit={clientForm.handleSubmit(handleSubmit)} className="space-y-5">
              <input type="hidden" {...clientForm.register('role')} />

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    className="form-input"
                    {...clientForm.register('full_name')}
                  />
                  {clientForm.formState.errors.full_name && (
                    <p className="form-error">{clientForm.formState.errors.full_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    className="form-input"
                    {...clientForm.register('company_name')}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  className="form-input"
                  autoComplete="email"
                  {...clientForm.register('email')}
                />
                {clientForm.formState.errors.email && (
                  <p className="form-error">{clientForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    placeholder="Min. 8 characters"
                    className="form-input"
                    autoComplete="new-password"
                    {...clientForm.register('password')}
                  />
                  {clientForm.formState.errors.password && (
                    <p className="form-error">{clientForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div>
                  <label className="form-label">Confirm Password *</label>
                  <input
                    type="password"
                    placeholder="Repeat password"
                    className="form-input"
                    autoComplete="new-password"
                    {...clientForm.register('confirm_password')}
                  />
                  {clientForm.formState.errors.confirm_password && (
                    <p className="form-error">{clientForm.formState.errors.confirm_password.message}</p>
                  )}
                </div>
              </div>

              {serverError && (
                <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-input p-3">
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={isClientSubmitting}
                className="btn-primary w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isClientSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Client Account'
                )}
              </button>
            </form>
          )}

          {/* Freelancer form */}
          {activeRole === 'freelancer' && (
            <form onSubmit={freelancerForm.handleSubmit(handleSubmit)} className="space-y-5">
              <input type="hidden" {...freelancerForm.register('role')} />

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    className="form-input"
                    {...freelancerForm.register('full_name')}
                  />
                  {freelancerForm.formState.errors.full_name && (
                    <p className="form-error">{freelancerForm.formState.errors.full_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    placeholder="you@email.com"
                    className="form-input"
                    autoComplete="email"
                    {...freelancerForm.register('email')}
                  />
                  {freelancerForm.formState.errors.email && (
                    <p className="form-error">{freelancerForm.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="form-label">Primary Expertise *</label>
                <select
                  className="form-input"
                  {...freelancerForm.register('expertise_area')}
                >
                  <option value="">Select your expertise...</option>
                  {expertiseOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {freelancerForm.formState.errors.expertise_area && (
                  <p className="form-error">{freelancerForm.formState.errors.expertise_area.message}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    placeholder="Min. 8 characters"
                    className="form-input"
                    autoComplete="new-password"
                    {...freelancerForm.register('password')}
                  />
                  {freelancerForm.formState.errors.password && (
                    <p className="form-error">{freelancerForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div>
                  <label className="form-label">Confirm Password *</label>
                  <input
                    type="password"
                    placeholder="Repeat password"
                    className="form-input"
                    autoComplete="new-password"
                    {...freelancerForm.register('confirm_password')}
                  />
                  {freelancerForm.formState.errors.confirm_password && (
                    <p className="form-error">{freelancerForm.formState.errors.confirm_password.message}</p>
                  )}
                </div>
              </div>

              {serverError && (
                <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-input p-3">
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={isFreelancerSubmitting}
                className="btn-primary w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isFreelancerSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Apply as Freelancer'
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-neutral-muted mt-6 font-body">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand-blue font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run tests to confirm nothing broke**

```bash
npm test
```

Expected: `15 tests passed`.

- [ ] **Step 4: Commit**

```bash
git add src/app/auth/register/
git commit -m "feat: add register page with role toggle and auto-signin for clients"
```

---

## Task 11: Check-email page

**Files:**
- Create: `src/app/auth/check-email/page.tsx`

- [ ] **Step 1: Create the static page**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Check Your Email',
}

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-neutral-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card border border-neutral-border text-center py-12">
          <div className="w-16 h-16 bg-brand-blue-light rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">📧</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-neutral-text mb-3">
            Check your email
          </h1>
          <p className="text-neutral-muted font-body leading-relaxed mb-2">
            We&apos;ve sent a confirmation link to your email address.
          </p>
          <p className="text-neutral-muted font-body leading-relaxed mb-8">
            Click the link in the email to confirm your account and continue.
          </p>
          <p className="text-xs text-neutral-muted mb-6">
            Didn&apos;t receive it? Check your spam folder or{' '}
            <a
              href="mailto:info@purlyremote.net"
              className="text-brand-blue hover:underline"
            >
              contact support
            </a>
            .
          </p>
          <Link href="/auth/login" className="btn-outline text-sm">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/auth/check-email/page.tsx
git commit -m "feat: add check-email page for post-freelancer-registration flow"
```

---

## Task 12: Stub dashboard pages

**Files:**
- Create: `src/app/client/dashboard/page.tsx`
- Create: `src/app/freelancer/dashboard/page.tsx`
- Create: `src/app/admin/dashboard/page.tsx`

- [ ] **Step 1: Create client dashboard stub**

```tsx
// src/app/client/dashboard/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Client Dashboard' }

export default function ClientDashboard() {
  return (
    <div className="min-h-screen bg-neutral-bg section-padding">
      <div className="container-max">
        <div className="section-tag mb-4">Client</div>
        <h1 className="section-title">Client Dashboard</h1>
        <p className="section-subtitle mt-3">Phase 2 content coming soon.</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create freelancer dashboard stub**

```tsx
// src/app/freelancer/dashboard/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Freelancer Dashboard' }

export default function FreelancerDashboard() {
  return (
    <div className="min-h-screen bg-neutral-bg section-padding">
      <div className="container-max">
        <div className="section-tag mb-4">Freelancer</div>
        <h1 className="section-title">Freelancer Dashboard</h1>
        <p className="section-subtitle mt-3">Phase 2 content coming soon.</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create admin dashboard stub**

```tsx
// src/app/admin/dashboard/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-neutral-bg section-padding">
      <div className="container-max">
        <div className="section-tag mb-4">Admin</div>
        <h1 className="section-title">Admin Dashboard</h1>
        <p className="section-subtitle mt-3">Phase 2 content coming soon.</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/client/ src/app/freelancer/ src/app/admin/
git commit -m "feat: add stub dashboard pages for all three roles"
```

---

## Task 13: Manual end-to-end verification

Before this task, ensure:
- You have run `supabase/schema.sql` in your Supabase project's SQL Editor
- You have created `.env.local` with real values for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`
- In Supabase Dashboard → Authentication → URL Configuration: set **Site URL** to `http://localhost:3000` and add `http://localhost:3000/auth/confirm` to **Redirect URLs**

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Expected: `ready on http://localhost:3000` with no TypeScript errors.

- [ ] **Step 2: Unit tests still pass**

```bash
npm test
```

Expected: `15 tests passed`.

- [ ] **Step 3: Test client registration**

1. Visit `http://localhost:3000/auth/register`
2. Select "I'm a Client"
3. Fill in: Full Name=`Test Client`, Email=`testclient@example.com`, Password=`testpass123`, Confirm=`testpass123`
4. Submit
5. Expected: redirected to `/client/dashboard`
6. In Supabase Dashboard → Authentication → Users: verify the user exists with `app_metadata.role = "client"` and `email_confirmed_at` set
7. In Table Editor → `public.users`: verify row with `role = 'client'`
8. In Table Editor → `public.client_profiles`: verify row with `full_name = 'Test Client'`

- [ ] **Step 4: Test middleware — client visiting freelancer route**

1. While still logged in as `testclient@example.com`, visit `http://localhost:3000/freelancer/dashboard`
2. Expected: redirected to `/client/dashboard`

- [ ] **Step 5: Test client login flow**

1. Sign out: in browser console run `(await import('/src/lib/supabase/client.js')).createClient().auth.signOut()`  
   Or visit `/auth/login` (if session expired) and sign in again
2. Visit `http://localhost:3000/auth/login`
3. Enter `testclient@example.com` / `testpass123`
4. Expected: redirected to `/client/dashboard`

- [ ] **Step 6: Test middleware — unauthenticated user**

1. Clear cookies or open incognito
2. Visit `http://localhost:3000/client/dashboard`
3. Expected: redirected to `/auth/login`

- [ ] **Step 7: Test freelancer registration**

1. Visit `http://localhost:3000/auth/register`
2. Select "I'm a Freelancer"
3. Fill in: Full Name=`Test Freelancer`, Email=`testfreelancer@example.com`, Password=`testpass123`, Confirm=`testpass123`, Expertise=`Software Development`
4. Submit
5. Expected: redirected to `/auth/check-email`
6. Check your real email inbox for the Supabase confirmation link
7. In Supabase → Authentication → Users: verify user exists with `email_confirmed_at = null`
8. In `public.freelancer_profiles`: verify `approval_status = 'pending'`, `approved = false`

- [ ] **Step 8: Test email confirmation**

1. Click the confirmation link in the email
2. Expected: browser hits `/auth/confirm?code=...`, session is set, redirected to `/freelancer/dashboard`
3. In Supabase → Users: verify `email_confirmed_at` is now set

- [ ] **Step 9: Test confirmation_failed error**

1. Visit `/auth/login?error=confirmation_failed`
2. Expected: red error box above the form with the expiry message

- [ ] **Step 10: Test admin self-registration block**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"role":"admin","full_name":"Hacker","email":"hacker@evil.com","password":"password123","confirm_password":"password123"}'
```

Expected: `{"error":"Admin accounts cannot be self-registered."}` with HTTP 403.

- [ ] **Step 11: Final commit**

```bash
git add .
git commit -m "feat: complete phase 1 auth foundation — supabase auth, middleware, register/login flows"
```
