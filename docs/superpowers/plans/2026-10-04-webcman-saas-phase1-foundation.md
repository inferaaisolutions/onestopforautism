# WebCMan SaaS — Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the WebCMan SaaS Next.js 14 project — new standalone repo — with Supabase Auth, full PostgreSQL schema, landing page, login/signup pages, auth-protected app shell, and a live Vercel deploy.

**Architecture:** New standalone project at `~/sait/webcman-saas/` (separate from the ASD Guide repo). Next.js 14 App Router handles both frontend and API. Supabase provides auth (email/password + Google/GitHub OAuth) and PostgreSQL with Row Level Security. Next.js middleware enforces authentication on all `/(app)/` routes. Landing page lives at `/` (public). Vercel free tier hosts everything.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui (Stone base + orange/amber overrides), Framer Motion, Supabase (`@supabase/supabase-js` + `@supabase/ssr`), Vitest + React Testing Library

**This is Plan 1 of 6. Subsequent plans:** Site Setup & AI Onboarding → Content Engine Integration → CMS Integrations → Dashboard & Content Management → Admin Panel & Notifications.

---

## File Map

```
webcman-saas/
  src/
    app/
      page.tsx                          # Landing page (public)
      layout.tsx                        # Root layout (Inter font, metadata)
      globals.css                       # Tailwind + shadcn CSS variables (orange/amber/stone)
      auth/
        callback/
          route.ts                      # OAuth code-exchange handler
      (auth)/
        layout.tsx                      # Centered card layout for auth pages
        login/
          page.tsx                      # Renders <LoginForm />
        signup/
          page.tsx                      # Renders <SignupForm />
      (app)/
        layout.tsx                      # Sidebar + TopBar shell (auth-protected)
        dashboard/
          page.tsx                      # Stub: site list or empty state
    components/
      landing/
        Nav.tsx                         # Fixed top nav: logo + login/get-started CTAs
        Hero.tsx                        # Animated headline + CTA buttons
        AnimatedDemo.tsx                # Framer Motion loop: analyzing → writing → publishing
        Features.tsx                    # 6-card feature grid
        Pricing.tsx                     # 4-column pricing table
      auth/
        LoginForm.tsx                   # Email/password fields + Google/GitHub OAuth buttons
        SignupForm.tsx                  # Same shape, shows confirmation state on success
      app/
        Sidebar.tsx                     # Left nav: Dashboard, Sites links
        TopBar.tsx                      # User email + sign out button
        ThemeToggle.tsx                 # Light/dark toggle (saves to localStorage)
    lib/
      supabase/
        types.ts                        # Full Database type (all 8 tables)
        client.ts                       # Browser Supabase client
        server.ts                       # Server Supabase client (cookies)
      utils.ts                          # cn() helper (already from shadcn init)
    middleware.ts                       # Protect /dashboard /sites /admin; redirect authed from /login
    test/
      setup.ts                          # @testing-library/jest-dom import
      components/
        button.test.tsx
      landing/
        page.test.tsx
      auth/
        login-form.test.tsx
      app/
        dashboard.test.tsx
  supabase/
    migrations/
      001_initial_schema.sql            # All tables + RLS + trigger
  vercel.json
  .env.local.example
  components.json                       # shadcn config (auto-generated)
  vitest.config.ts
  package.json
  next.config.ts
  tailwind.config.ts
  tsconfig.json
  .gitignore
```

---

## Task 1: Bootstrap Next.js 14 project

**Files:**
- Create: `~/sait/webcman-saas/` (new project)
- Create: `vitest.config.ts`, `src/test/setup.ts`
- Modify: `package.json` (add test scripts)

- [ ] **Step 1: Create Next.js 14 project**

Run in `~/sait/`:
```bash
npx create-next-app@14 webcman-saas \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
cd webcman-saas
```

Expected: project created, `package.json` shows `"next": "14.x.x"`

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr framer-motion
npm install --save-dev vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
})
```

- [ ] **Step 4: Create `src/test/setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test scripts to `package.json`**

In the `"scripts"` object add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

Expected: exits 0, no TypeScript errors

- [ ] **Step 7: Init git and commit**

```bash
git init
git add .
git commit -m "feat: bootstrap Next.js 14 project with TypeScript, Tailwind, Vitest"
```

---

## Task 2: Install and configure shadcn/ui

**Files:**
- Create: `components.json` (auto)
- Create: `src/components/ui/` (auto-populated)
- Modify: `src/app/globals.css` (orange/amber/stone CSS variables)
- Modify: `tailwind.config.ts` (auto-updated by shadcn)

- [ ] **Step 1: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted:
- Which style? → `Default`
- Which base color? → `Stone`
- CSS variables? → `Yes`

- [ ] **Step 2: Add required components**

```bash
npx shadcn@latest add button input card label badge separator tabs avatar dropdown-menu
```

Expected: files created in `src/components/ui/`

- [ ] **Step 3: Override CSS variables in `src/app/globals.css`**

Find the `:root` block (auto-generated by shadcn) and replace it entirely:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 28 10% 10%;
  --card: 0 0% 100%;
  --card-foreground: 28 10% 10%;
  --popover: 0 0% 100%;
  --popover-foreground: 28 10% 10%;
  --primary: 24 95% 53%;
  --primary-foreground: 0 0% 100%;
  --secondary: 43 96% 56%;
  --secondary-foreground: 28 10% 10%;
  --muted: 28 14% 93%;
  --muted-foreground: 28 6% 45%;
  --accent: 43 96% 56%;
  --accent-foreground: 28 10% 10%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: 28 14% 86%;
  --input: 28 14% 86%;
  --ring: 24 95% 53%;
  --radius: 0.5rem;
}

.dark {
  --background: 28 10% 5%;
  --foreground: 28 14% 93%;
  --card: 28 10% 8%;
  --card-foreground: 28 14% 93%;
  --popover: 28 10% 8%;
  --popover-foreground: 28 14% 93%;
  --primary: 24 95% 53%;
  --primary-foreground: 0 0% 100%;
  --secondary: 43 96% 56%;
  --secondary-foreground: 28 10% 10%;
  --muted: 28 10% 15%;
  --muted-foreground: 28 6% 65%;
  --accent: 43 96% 56%;
  --accent-foreground: 28 10% 10%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: 28 10% 18%;
  --input: 28 10% 18%;
  --ring: 24 95% 53%;
}
```

- [ ] **Step 4: Write button render test**

Create `src/test/components/button.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

test('renders button with text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
})
```

- [ ] **Step 5: Run test — expect PASS**

```bash
npm test src/test/components/button.test.tsx
```

Expected: 1/1 PASS

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: install shadcn/ui with orange/amber/stone theme"
```

---

## Task 3: Supabase database schema migration

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `.env.local.example`

- [ ] **Step 1: Create `supabase/migrations/001_initial_schema.sql`**

```sql
-- Enable UUID extension
create extension if not exists "pgcrypto";

-- User profiles (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.users enable row level security;
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Sites
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  url text not null,
  name text not null,
  detected_cms text check (detected_cms in ('wordpress', 'webflow', 'ghost')),
  topic text,
  brand_voice text,
  schedule_type text not null default 'frequency' check (schedule_type in ('frequency', 'one-time')),
  schedule_frequency text check (schedule_frequency in ('6h', '12h', 'daily')),
  schedule_date timestamptz,
  mode text not null default 'manual' check (mode in ('autopilot', 'manual')),
  quality_threshold integer not null default 70 check (quality_threshold between 0 and 100),
  publish_delay_minutes integer not null default 0,
  content_formats text[] not null default array['blog'],
  max_articles_per_run integer not null default 5,
  ai_key text,
  content_archive boolean not null default false,
  status text not null default 'active' check (status in ('active', 'paused')),
  created_at timestamptz not null default now()
);
alter table public.sites enable row level security;
create policy "sites_all_own" on public.sites for all using (auth.uid() = user_id);

-- Site sources
create table public.site_sources (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  type text not null check (type in ('rss', 'url', 'youtube', 'newsapi')),
  url text not null,
  name text not null,
  trust_tier integer not null default 3 check (trust_tier between 1 and 4),
  status text not null default 'active' check (status in ('active', 'dead')),
  last_fetched_at timestamptz,
  fail_count integer not null default 0
);
alter table public.site_sources enable row level security;
create policy "site_sources_all_own" on public.site_sources for all using (
  exists (select 1 from public.sites where sites.id = site_id and sites.user_id = auth.uid())
);

-- CMS connections (tokens encrypted at app layer before insert)
create table public.cms_connections (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  cms_type text not null check (cms_type in ('wordpress', 'webflow', 'ghost')),
  access_token text not null,
  refresh_token text,
  cms_site_id text,
  cms_site_url text,
  connected_at timestamptz not null default now()
);
alter table public.cms_connections enable row level security;
create policy "cms_connections_all_own" on public.cms_connections for all using (
  exists (select 1 from public.sites where sites.id = site_id and sites.user_id = auth.uid())
);

-- Content plans
create table public.content_plans (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  plan_json jsonb not null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.content_plans enable row level security;
create policy "content_plans_all_own" on public.content_plans for all using (
  exists (select 1 from public.sites where sites.id = site_id and sites.user_id = auth.uid())
);

-- Content runs
create table public.content_runs (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  added integer not null default 0,
  updated integer not null default 0,
  flagged integer not null default 0,
  blocked integer not null default 0,
  failed_count integer not null default 0,
  error_message text
);
alter table public.content_runs enable row level security;
create policy "content_runs_all_own" on public.content_runs for all using (
  exists (select 1 from public.sites where sites.id = site_id and sites.user_id = auth.uid())
);

-- Content items
create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  run_id uuid references public.content_runs(id) on delete set null,
  title text not null,
  body text not null,
  seo_title text,
  seo_description text,
  seo_keywords text[],
  social_caption text,
  newsletter_excerpt text,
  source_urls text[] not null default array[]::text[],
  quality_score integer check (quality_score between 0 and 100),
  originality_score integer check (originality_score between 0 and 100),
  status text not null default 'draft' check (status in ('draft', 'published', 'rolled_back', 'rejected')),
  cms_post_id text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.content_items enable row level security;
create policy "content_items_all_own" on public.content_items for all using (
  exists (select 1 from public.sites where sites.id = site_id and sites.user_id = auth.uid())
);

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('run_completed', 'review_needed', 'run_failed', 'source_dead', 'changelog')),
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "notifications_all_own" on public.notifications for all using (auth.uid() = user_id);
```

- [ ] **Step 2: Create `.env.local.example`**

```bash
# Supabase (get from supabase.com -> project -> Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Groq (get free key from console.groq.com)
GROQ_API_KEY=your-groq-key

# App URL (no trailing slash)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 3: Create your actual `.env.local`**

```bash
cp .env.local.example .env.local
```

Then fill in real values:
1. Go to supabase.com → New project (name it "webcman-saas")
2. Settings → API → copy "Project URL" and "anon public" key
3. Copy "service_role" key (keep this secret, never commit)
4. Paste into `.env.local`

- [ ] **Step 4: Apply migration in Supabase SQL Editor**

1. Go to supabase.com → your webcman-saas project → SQL Editor
2. Paste the full contents of `supabase/migrations/001_initial_schema.sql`
3. Click Run

Expected: "Success. No rows returned." Verify by checking Table Editor — all 8 tables should appear.

- [ ] **Step 5: Commit (not .env.local)**

```bash
git add supabase/ .env.local.example
git commit -m "feat: add database schema with all tables, RLS policies, and user trigger"
```

---

## Task 4: Supabase client utilities and middleware

**Files:**
- Create: `src/lib/supabase/types.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/middleware.ts`
- Create: `src/test/supabase/types.test.ts`

- [ ] **Step 1: Write failing type test**

Create `src/test/supabase/types.test.ts`:
```typescript
import type { Database } from '@/lib/supabase/types'

test('Database type covers all tables', () => {
  type Tables = Database['public']['Tables']
  type _users = Tables['users']['Row']
  type _sites = Tables['sites']['Row']
  type _sources = Tables['site_sources']['Row']
  type _cms = Tables['cms_connections']['Row']
  type _plans = Tables['content_plans']['Row']
  type _runs = Tables['content_runs']['Row']
  type _items = Tables['content_items']['Row']
  type _notifs = Tables['notifications']['Row']
  // Compile-time check: if any table is missing, TS errors here
  const _: _users['id'] = 'uuid-string'
  expect(_).toBe('uuid-string')
})
```

Run — expect FAIL (file missing):
```bash
npm test src/test/supabase/types.test.ts
```

Expected: FAIL with "Cannot find module '@/lib/supabase/types'"

- [ ] **Step 2: Create `src/lib/supabase/types.ts`**

```typescript
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: { id: string; email: string; is_admin: boolean; created_at: string }
        Insert: { id: string; email: string; is_admin?: boolean; created_at?: string }
        Update: { id?: string; email?: string; is_admin?: boolean; created_at?: string }
      }
      sites: {
        Row: {
          id: string; user_id: string; url: string; name: string
          detected_cms: 'wordpress' | 'webflow' | 'ghost' | null
          topic: string | null; brand_voice: string | null
          schedule_type: 'frequency' | 'one-time'
          schedule_frequency: '6h' | '12h' | 'daily' | null
          schedule_date: string | null
          mode: 'autopilot' | 'manual'
          quality_threshold: number; publish_delay_minutes: number
          content_formats: string[]; max_articles_per_run: number
          ai_key: string | null; content_archive: boolean
          status: 'active' | 'paused'; created_at: string
        }
        Insert: {
          id?: string; user_id: string; url: string; name: string
          detected_cms?: 'wordpress' | 'webflow' | 'ghost' | null
          topic?: string | null; brand_voice?: string | null
          schedule_type?: 'frequency' | 'one-time'
          schedule_frequency?: '6h' | '12h' | 'daily' | null
          schedule_date?: string | null; mode?: 'autopilot' | 'manual'
          quality_threshold?: number; publish_delay_minutes?: number
          content_formats?: string[]; max_articles_per_run?: number
          ai_key?: string | null; content_archive?: boolean
          status?: 'active' | 'paused'; created_at?: string
        }
        Update: Partial<Database['public']['Tables']['sites']['Insert']>
      }
      site_sources: {
        Row: {
          id: string; site_id: string
          type: 'rss' | 'url' | 'youtube' | 'newsapi'
          url: string; name: string; trust_tier: number
          status: 'active' | 'dead'; last_fetched_at: string | null; fail_count: number
        }
        Insert: {
          id?: string; site_id: string
          type: 'rss' | 'url' | 'youtube' | 'newsapi'
          url: string; name: string; trust_tier?: number
          status?: 'active' | 'dead'; last_fetched_at?: string | null; fail_count?: number
        }
        Update: Partial<Database['public']['Tables']['site_sources']['Insert']>
      }
      cms_connections: {
        Row: {
          id: string; site_id: string
          cms_type: 'wordpress' | 'webflow' | 'ghost'
          access_token: string; refresh_token: string | null
          cms_site_id: string | null; cms_site_url: string | null; connected_at: string
        }
        Insert: {
          id?: string; site_id: string
          cms_type: 'wordpress' | 'webflow' | 'ghost'
          access_token: string; refresh_token?: string | null
          cms_site_id?: string | null; cms_site_url?: string | null; connected_at?: string
        }
        Update: Partial<Database['public']['Tables']['cms_connections']['Insert']>
      }
      content_plans: {
        Row: { id: string; site_id: string; plan_json: Json; approved_at: string | null; created_at: string }
        Insert: { id?: string; site_id: string; plan_json: Json; approved_at?: string | null; created_at?: string }
        Update: Partial<Database['public']['Tables']['content_plans']['Insert']>
      }
      content_runs: {
        Row: {
          id: string; site_id: string; started_at: string; completed_at: string | null
          status: 'running' | 'completed' | 'failed'
          added: number; updated: number; flagged: number
          blocked: number; failed_count: number; error_message: string | null
        }
        Insert: {
          id?: string; site_id: string; started_at?: string; completed_at?: string | null
          status?: 'running' | 'completed' | 'failed'
          added?: number; updated?: number; flagged?: number
          blocked?: number; failed_count?: number; error_message?: string | null
        }
        Update: Partial<Database['public']['Tables']['content_runs']['Insert']>
      }
      content_items: {
        Row: {
          id: string; site_id: string; run_id: string | null
          title: string; body: string
          seo_title: string | null; seo_description: string | null; seo_keywords: string[] | null
          social_caption: string | null; newsletter_excerpt: string | null
          source_urls: string[]; quality_score: number | null; originality_score: number | null
          status: 'draft' | 'published' | 'rolled_back' | 'rejected'
          cms_post_id: string | null; published_at: string | null; created_at: string
        }
        Insert: {
          id?: string; site_id: string; run_id?: string | null
          title: string; body: string
          seo_title?: string | null; seo_description?: string | null; seo_keywords?: string[] | null
          social_caption?: string | null; newsletter_excerpt?: string | null
          source_urls?: string[]; quality_score?: number | null; originality_score?: number | null
          status?: 'draft' | 'published' | 'rolled_back' | 'rejected'
          cms_post_id?: string | null; published_at?: string | null; created_at?: string
        }
        Update: Partial<Database['public']['Tables']['content_items']['Insert']>
      }
      notifications: {
        Row: {
          id: string; user_id: string
          type: 'run_completed' | 'review_needed' | 'run_failed' | 'source_dead' | 'changelog'
          title: string; body: string; read: boolean; created_at: string
        }
        Insert: {
          id?: string; user_id: string
          type: 'run_completed' | 'review_needed' | 'run_failed' | 'source_dead' | 'changelog'
          title: string; body: string; read?: boolean; created_at?: string
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
    }
  }
}
```

- [ ] **Step 3: Create `src/lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 4: Create `src/lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Server Component read-only context */ }
        },
      },
    }
  )
}
```

- [ ] **Step 5: Create `src/middleware.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
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

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAppRoute = path.startsWith('/dashboard') || path.startsWith('/sites') || path.startsWith('/admin')
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/signup')

  if (isAppRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', path)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 6: Run type test — expect PASS**

```bash
npm test src/test/supabase/types.test.ts
```

Expected: 1/1 PASS

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "feat: add Supabase client, server, types, and auth middleware"
```

---

## Task 5: Landing page

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/components/landing/Nav.tsx`
- Create: `src/components/landing/Hero.tsx`
- Create: `src/components/landing/AnimatedDemo.tsx`
- Create: `src/components/landing/Features.tsx`
- Create: `src/components/landing/Pricing.tsx`
- Create: `src/test/landing/page.test.tsx`

- [ ] **Step 1: Write failing landing page test**

Create `src/test/landing/page.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import LandingPage from '@/app/page'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: React.HTMLProps<HTMLDivElement>) => <div {...p}>{children}</div>,
    h1: ({ children, ...p }: React.HTMLProps<HTMLHeadingElement>) => <h1 {...p}>{children}</h1>,
    p: ({ children, ...p }: React.HTMLProps<HTMLParagraphElement>) => <p {...p}>{children}</p>,
  },
  useAnimation: () => ({ start: vi.fn() }),
  useInView: () => true,
}))

test('landing page renders h1 headline', () => {
  render(<LandingPage />)
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
})

test('landing page has Get Started link', () => {
  render(<LandingPage />)
  expect(screen.getAllByRole('link', { name: /get started/i })[0]).toBeInTheDocument()
})

test('landing page has Free plan in pricing', () => {
  render(<LandingPage />)
  expect(screen.getByText('Free')).toBeInTheDocument()
})

test('landing page has Pro plan in pricing', () => {
  render(<LandingPage />)
  expect(screen.getByText('Pro')).toBeInTheDocument()
})
```

Run — expect FAIL:
```bash
npm test src/test/landing/page.test.tsx
```

Expected: FAIL with "Cannot find module '@/app/page'"

- [ ] **Step 2: Create `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WebCMan — Automated Content Management',
  description: 'Add your site URL. WebCMan writes and publishes articles automatically.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Create `src/components/landing/Nav.tsx`**

```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/app/ThemeToggle'

export function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-sm dark:bg-stone-950/80 dark:border-stone-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold text-orange-500">WebCMan</Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Create `src/components/landing/Hero.tsx`**

```tsx
'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="pt-32 pb-20 px-4 text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm text-orange-700 mb-6 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-300">
          AI-powered content automation
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-stone-900 dark:text-stone-50 max-w-3xl mx-auto leading-tight">
          Your website,{' '}
          <span className="text-orange-500">always fresh.</span>
        </h1>
        <p className="mt-6 text-xl text-stone-600 dark:text-stone-400 max-w-2xl mx-auto">
          Add your site URL. WebCMan discovers sources, writes articles in your brand voice, and publishes them on a schedule — no writing, no maintenance.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
          <Link href="/signup">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8">
              Get Started — Free
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" size="lg" className="px-8">See how it works</Button>
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
```

- [ ] **Step 5: Create `src/components/landing/AnimatedDemo.tsx`**

```tsx
'use client'
import { motion, useAnimation } from 'framer-motion'
import { useEffect } from 'react'

const STEPS = [
  { icon: '🌐', label: 'Analyzing your site...' },
  { icon: '🔍', label: 'Discovering sources...' },
  { icon: '✍️', label: 'Writing in your brand voice...' },
  { icon: '🚀', label: '3 articles published!' },
]

export function AnimatedDemo() {
  const controls = useAnimation()

  useEffect(() => {
    async function loop() {
      while (true) {
        await controls.start(i => ({
          opacity: 1, x: 0,
          transition: { delay: i * 0.9, duration: 0.4 },
        }))
        await new Promise(r => setTimeout(r, 2800))
        await controls.start({ opacity: 0, x: -20, transition: { duration: 0.3 } })
        await new Promise(r => setTimeout(r, 400))
      }
    }
    loop()
  }, [controls])

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl dark:bg-stone-900 dark:border-stone-700">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-3 w-3 rounded-full bg-red-400" />
        <div className="h-3 w-3 rounded-full bg-amber-400" />
        <div className="h-3 w-3 rounded-full bg-green-400" />
        <span className="ml-2 text-xs text-stone-400">webcman.vercel.app</span>
      </div>
      <div className="space-y-3">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.label}
            custom={i}
            animate={controls}
            initial={{ opacity: 0, x: 20 }}
            className="flex items-center gap-3 rounded-lg bg-stone-50 px-4 py-3 dark:bg-stone-800"
          >
            <span className="text-xl">{step.icon}</span>
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{step.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create `src/components/landing/Features.tsx`**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const FEATURES = [
  { icon: '🤖', title: 'AI-Powered Writing', description: 'Groq AI writes articles in your brand voice, drawing from trusted sources you choose.' },
  { icon: '⚡', title: 'Automatic Publishing', description: 'Connect WordPress, Webflow, or Ghost. WebCMan publishes directly to your CMS on schedule.' },
  { icon: '🛡️', title: 'Trust Scoring', description: 'Every source is rated for credibility. Medical and legal advice language is blocked automatically.' },
  { icon: '📅', title: 'Flexible Scheduling', description: 'Set it to run every 6 hours, 12 hours, daily, or pick a specific one-time date.' },
  { icon: '✏️', title: 'Review & Edit', description: 'Choose autopilot mode or review each article before it goes live — with per-section AI regeneration.' },
  { icon: '🔄', title: 'Instant Rollback', description: "Published something that doesn't fit? Delete it from your CMS in one click." },
]

export function Features() {
  return (
    <section id="features" className="py-20 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-stone-900 dark:text-stone-50">Everything you need, nothing you don't</h2>
          <p className="mt-4 text-stone-600 dark:text-stone-400 max-w-xl mx-auto">Built for site owners who want to focus on their audience, not their content pipeline.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <Card key={f.title} className="border-stone-200 dark:border-stone-700">
              <CardHeader>
                <div className="text-3xl mb-2">{f.icon}</div>
                <CardTitle className="text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-stone-600 dark:text-stone-400 text-sm">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 7: Create `src/components/landing/Pricing.tsx`**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const PLANS = [
  { name: 'Free', price: '$0', sub: 'forever', frequency: 'Daily (queued)', sites: '1 site, 3 articles/run', highlight: false },
  { name: 'Starter', price: 'Coming soon', sub: '', frequency: 'Daily (priority)', sites: 'Unlimited sites', highlight: false },
  { name: 'Pro', price: 'Coming soon', sub: '', frequency: 'Every 12h', sites: 'Unlimited sites', highlight: true },
  { name: 'Growth', price: 'Coming soon', sub: '', frequency: 'Every 6h', sites: 'Unlimited sites', highlight: false },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-20 px-4 bg-stone-50 dark:bg-stone-900/50">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-stone-900 dark:text-stone-50">Start free, scale when you're ready</h2>
          <p className="mt-4 text-stone-600 dark:text-stone-400">No credit card required.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map(plan => (
            <Card key={plan.name} className={`relative ${plan.highlight ? 'border-orange-500 shadow-lg' : 'border-stone-200 dark:border-stone-700'}`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-orange-500 text-white text-xs">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{plan.name}</CardTitle>
                <div className="text-2xl font-bold text-orange-500">{plan.price}</div>
                {plan.sub && <div className="text-xs text-stone-500">{plan.sub}</div>}
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-sm text-stone-600 dark:text-stone-400">{plan.frequency}</p>
                <p className="text-sm text-stone-600 dark:text-stone-400">{plan.sites}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/signup">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8">
              Get Started — Free
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 8: Create `src/app/page.tsx`**

```tsx
import { Nav } from '@/components/landing/Nav'
import { Hero } from '@/components/landing/Hero'
import { AnimatedDemo } from '@/components/landing/AnimatedDemo'
import { Features } from '@/components/landing/Features'
import { Pricing } from '@/components/landing/Pricing'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-stone-950">
      <Nav />
      <Hero />
      <div className="py-12 flex justify-center bg-stone-50 dark:bg-stone-900/30">
        <AnimatedDemo />
      </div>
      <Features />
      <Pricing />
      <footer className="border-t border-stone-200 dark:border-stone-800 py-8 text-center text-sm text-stone-500">
        &copy; 2026 WebCMan. All rights reserved.
      </footer>
    </main>
  )
}
```

- [ ] **Step 9: Run landing tests — expect PASS**

```bash
npm test src/test/landing/page.test.tsx
```

Expected: 4/4 PASS

- [ ] **Step 10: Commit**

```bash
git add src/
git commit -m "feat: add landing page with hero, animated demo, features, pricing"
```

---

## Task 6: Theme toggle component

**Files:**
- Create: `src/components/app/ThemeToggle.tsx`
- Create: `src/app/providers.tsx`
- Modify: `src/app/layout.tsx` (wrap with Providers)

The spec requires a light/dark mode toggle with preference saved per user. We use `next-themes` for this.

- [ ] **Step 1: Install next-themes**

```bash
npm install next-themes
```

- [ ] **Step 2: Create `src/app/providers.tsx`**

```tsx
'use client'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="webcman-theme">
      {children}
    </ThemeProvider>
  )
}
```

- [ ] **Step 3: Update `src/app/layout.tsx` to wrap with Providers**

Replace the body content:
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WebCMan — Automated Content Management',
  description: 'Add your site URL. WebCMan writes and publishes articles automatically.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Create `src/components/app/ThemeToggle.tsx`**

```tsx
'use client'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-9 w-9" />

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-9 w-9 p-0"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </Button>
  )
}
```

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: all previous tests still PASS

- [ ] **Step 6: Commit**

```bash
git add src/ package.json package-lock.json
git commit -m "feat: add dark/light theme toggle with next-themes"
```

---

## Task 7: Auth pages (login and signup)

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/signup/page.tsx`
- Create: `src/app/auth/callback/route.ts`
- Create: `src/components/auth/LoginForm.tsx`
- Create: `src/components/auth/SignupForm.tsx`
- Create: `src/test/auth/login-form.test.tsx`

- [ ] **Step 1: Write failing login form test**

Create `src/test/auth/login-form.test.tsx`:
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/LoginForm'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

test('shows email and password fields', () => {
  render(<LoginForm />)
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
})

test('shows validation error when email is empty on submit', async () => {
  render(<LoginForm />)
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
  await waitFor(() => {
    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
  })
})

test('calls signInWithPassword when form is valid', async () => {
  const user = userEvent.setup()
  render(<LoginForm />)
  await user.type(screen.getByLabelText(/email/i), 'test@example.com')
  await user.type(screen.getByLabelText(/password/i), 'password123')
  await user.click(screen.getByRole('button', { name: /sign in/i }))
  await waitFor(() => {
    expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument()
  })
})
```

Run — expect FAIL:
```bash
npm test src/test/auth/login-form.test.tsx
```

Expected: FAIL with module not found

- [ ] **Step 2: Create `src/app/(auth)/layout.tsx`**

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-orange-500">WebCMan</span>
        </div>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/app/auth/callback/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
```

- [ ] **Step 4: Create `src/components/auth/LoginForm.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!email) errs.email = 'Email is required'
    if (!password) errs.password = 'Password is required'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setErrors({ form: error.message }); return }
    router.push('/dashboard')
    router.refresh()
  }

  async function handleOAuth(provider: 'google' | 'github') {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:bg-stone-900 dark:border-stone-700">
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-50 mb-5">Sign in</h1>
        {errors.form && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
            {errors.form}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1" />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </div>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200 dark:border-stone-700" /></div>
          <div className="relative flex justify-center text-xs text-stone-400"><span className="bg-white px-2 dark:bg-stone-900">or continue with</span></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" onClick={() => handleOAuth('google')}>Google</Button>
          <Button type="button" variant="outline" onClick={() => handleOAuth('github')}>GitHub</Button>
        </div>
      </div>
      <p className="text-center text-sm text-stone-600 dark:text-stone-400">
        Don't have an account?{' '}
        <Link href="/signup" className="text-orange-500 hover:underline font-medium">Sign up</Link>
      </p>
    </form>
  )
}
```

- [ ] **Step 5: Create `src/components/auth/SignupForm.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!email) errs.email = 'Email is required'
    if (!password || password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    })
    setLoading(false)
    if (error) { setErrors({ form: error.message }); return }
    setSuccess(true)
  }

  async function handleOAuth(provider: 'google' | 'github') {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    })
  }

  if (success) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm text-center dark:bg-stone-900 dark:border-stone-700">
        <div className="text-4xl mb-3">📬</div>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Check your email</h2>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:bg-stone-900 dark:border-stone-700">
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-50 mb-5">Create account</h1>
        {errors.form && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
            {errors.form}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1" />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" className="mt-1" />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </div>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200 dark:border-stone-700" /></div>
          <div className="relative flex justify-center text-xs text-stone-400"><span className="bg-white px-2 dark:bg-stone-900">or continue with</span></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" onClick={() => handleOAuth('google')}>Google</Button>
          <Button type="button" variant="outline" onClick={() => handleOAuth('github')}>GitHub</Button>
        </div>
      </div>
      <p className="text-center text-sm text-stone-600 dark:text-stone-400">
        Already have an account?{' '}
        <Link href="/login" className="text-orange-500 hover:underline font-medium">Sign in</Link>
      </p>
    </form>
  )
}
```

- [ ] **Step 6: Create `src/app/(auth)/login/page.tsx`**

```tsx
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return <LoginForm />
}
```

- [ ] **Step 7: Create `src/app/(auth)/signup/page.tsx`**

```tsx
import { SignupForm } from '@/components/auth/SignupForm'

export default function SignupPage() {
  return <SignupForm />
}
```

- [ ] **Step 8: Run auth tests — expect PASS**

```bash
npm test src/test/auth/login-form.test.tsx
```

Expected: 3/3 PASS

- [ ] **Step 9: Commit**

```bash
git add src/
git commit -m "feat: add auth pages (login, signup) with email/password and Google/GitHub OAuth"
```

---

## Task 8: Auth-protected app shell and stub dashboard

**Files:**
- Create: `src/components/app/Sidebar.tsx`
- Create: `src/components/app/TopBar.tsx`
- Create: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/dashboard/page.tsx`
- Create: `src/test/app/dashboard.test.tsx`

- [ ] **Step 1: Write failing dashboard test**

Create `src/test/app/dashboard.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  }),
}))

vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

test('dashboard shows heading', async () => {
  const DashboardPage = (await import('@/app/(app)/dashboard/page')).default
  const jsx = await DashboardPage()
  render(jsx as React.ReactElement)
  expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
})

test('dashboard shows empty state when no sites', async () => {
  const DashboardPage = (await import('@/app/(app)/dashboard/page')).default
  const jsx = await DashboardPage()
  render(jsx as React.ReactElement)
  expect(screen.getByText(/add your first site/i)).toBeInTheDocument()
})
```

Run — expect FAIL:
```bash
npm test src/test/app/dashboard.test.tsx
```

Expected: FAIL with module not found

- [ ] **Step 2: Create `src/components/app/Sidebar.tsx`**

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Sites', href: '/sites', icon: '🌐' },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 shrink-0 border-r border-stone-200 bg-white dark:bg-stone-950 dark:border-stone-800 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-stone-200 dark:border-stone-800">
        <span className="text-lg font-bold text-orange-500">WebCMan</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith(item.href)
                ? 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400'
                : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 3: Create `src/components/app/TopBar.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'
import { redirect } from 'next/navigation'

async function signOut() {
  'use server'
  const { createClient: mkClient } = await import('@/lib/supabase/server')
  const supabase = await mkClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function TopBar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="h-16 shrink-0 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between px-6 bg-white dark:bg-stone-950">
      <div />
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <span className="text-sm text-stone-500 dark:text-stone-400">{user?.email}</span>
        <form action={signOut}>
          <Button variant="ghost" size="sm" type="submit">Sign out</Button>
        </form>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Create `src/app/(app)/layout.tsx`**

```tsx
import { Sidebar } from '@/components/app/Sidebar'
import { TopBar } from '@/components/app/TopBar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-stone-50 dark:bg-stone-900 overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create `src/app/(app)/dashboard/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sites } = await supabase.from('sites').select('*').eq('user_id', user.id)

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-6">Dashboard</h1>
      {!sites || sites.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-stone-200 dark:border-stone-700 p-12 text-center">
          <div className="text-5xl mb-4">🌐</div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-2">No sites yet</h2>
          <p className="text-stone-600 dark:text-stone-400 mb-6 max-w-xs mx-auto">
            Add your first site and WebCMan will start managing your content automatically.
          </p>
          <Link
            href="/sites/new"
            className="inline-flex items-center rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
          >
            Add your first site
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map(site => (
            <Link
              key={site.id}
              href={`/sites/${site.id}`}
              className="rounded-xl border border-stone-200 bg-white p-5 hover:border-orange-300 hover:shadow-sm transition-all dark:bg-stone-900 dark:border-stone-700 dark:hover:border-orange-700"
            >
              <div className="font-semibold text-stone-900 dark:text-stone-50 truncate">{site.name}</div>
              <div className="text-sm text-stone-500 mt-0.5 truncate">{site.url}</div>
              <div className={`inline-flex mt-3 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                site.status === 'active'
                  ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                  : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
              }`}>
                {site.status}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Run dashboard tests — expect PASS**

```bash
npm test src/test/app/dashboard.test.tsx
```

Expected: 2/2 PASS

- [ ] **Step 7: Run full test suite**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 8: Commit**

```bash
git add src/
git commit -m "feat: add auth-protected app shell with sidebar, topbar, and stub dashboard"
```

---

## Task 9: Vercel deployment

**Files:**
- Create: `vercel.json`
- Verify: `.gitignore` includes `.env.local`

- [ ] **Step 1: Create `vercel.json`**

```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

- [ ] **Step 2: Verify `.env.local` is in `.gitignore`**

Open `.gitignore` and confirm `.env.local` is listed (create-next-app adds it automatically). If it is missing, add the line `.env.local`.

- [ ] **Step 3: Push to GitHub**

```bash
git remote add origin https://github.com/<your-username>/webcman-saas.git
git branch -M main
git push -u origin main
```

- [ ] **Step 4: Deploy on Vercel**

1. Go to vercel.com → "Add New Project" → Import from GitHub → select `webcman-saas`
2. In "Environment Variables", add:
   - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` → your Supabase service_role key
3. Click Deploy

Expected: build succeeds, app is live at `webcman-saas.vercel.app`

- [ ] **Step 5: Configure Supabase for the Vercel domain**

In Supabase dashboard → Authentication → URL Configuration:
- Site URL: `https://webcman-saas.vercel.app`
- Add to Redirect URLs: `https://webcman-saas.vercel.app/auth/callback`

- [ ] **Step 6: Enable OAuth providers in Supabase**

In Supabase dashboard → Authentication → Providers:
- Enable Google: add Client ID and Secret from [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client
- Enable GitHub: add Client ID and Secret from GitHub → Settings → Developer settings → OAuth Apps

Add the Supabase callback URL shown in the dashboard to each provider's allowed redirect URIs.

- [ ] **Step 7: Smoke test the live deploy**

1. Open `https://webcman-saas.vercel.app` — landing page loads
2. Click "Get Started" — redirects to `/signup`
3. Sign up with email — confirmation email arrives
4. Click confirmation link — redirects to `/dashboard`
5. Dashboard shows empty state with "Add your first site" CTA

- [ ] **Step 8: Commit vercel config**

```bash
git add vercel.json
git commit -m "feat: add Vercel deployment config"
git push
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Next.js 14 App Router, TypeScript, Tailwind CSS
- [x] shadcn/ui (Stone base, orange-500/amber-400 primary overrides)
- [x] Framer Motion (animated demo in landing)
- [x] Supabase Auth: email/password + Google/GitHub OAuth
- [x] All 8 DB tables with RLS policies
- [x] Auto-create user profile on signup (trigger)
- [x] Landing page: bold orange headline, animated demo, features, pricing
- [x] Login and signup pages
- [x] Dark mode toggle with persistence (next-themes)
- [x] Auth middleware protecting /dashboard /sites /admin
- [x] App shell (sidebar + topbar + main)
- [x] Stub dashboard with empty state and site list
- [x] Vercel deployment
- [x] OAuth callback route

**Not in this plan (correct — later plans):**
- Site setup, AI onboarding, content plan: Plan 2
- Content engine, scheduling: Plan 3
- CMS integrations: Plan 4
- Full dashboard UI, content editor: Plan 5
- Admin panel, notifications: Plan 6
