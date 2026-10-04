# WebCMan SaaS — Design Spec

**Date:** 2026-10-04
**Status:** Approved for implementation

---

## Goal

A commercial SaaS web app where users sign up, add their website URL, and WebCMan automatically discovers content sources, generates articles, and publishes them directly to their CMS on a schedule. No writing, no maintenance. Set it once, content runs itself.

---

## Overview

- **Product type:** Commercial SaaS web app (not open source, not CLI)
- **Repo:** Separate from ASD Guide — new standalone repo
- **Deploy:** Vercel (free tier) at `webcman.vercel.app` until domain registered
- **Scale target:** 10 users at launch, Vercel serverless for scheduling

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend + API | Next.js 14 App Router, TypeScript |
| UI | Tailwind CSS, shadcn/ui, Framer Motion |
| Colors | Orange-500 / Amber-400 primary, Stone neutrals |
| Auth | Supabase Auth (email/password + Google/GitHub OAuth) |
| Database | Supabase PostgreSQL |
| Hosting | Vercel (free tier) |
| AI | Groq (default, free) — user can add own key |
| Email | Resend (transactional notifications) |
| Content engine | Existing WebCMan engine (reused, adapted for multi-tenant) |

All infrastructure free tier at launch.

---

## Architecture

```
[Next.js Frontend]
  Landing page, dashboard, content editor, AI chat bubble, admin panel

[Next.js API Routes]
  CMS OAuth flow, run trigger, AI regenerate, admin endpoints, Vercel cron handlers

[WebCMan Engine (reused)]
  Trust scoring, safety filter, Groq AI extraction, schema inferrer, history/rollback

[Supabase]
  Auth + PostgreSQL (users, sites, sources, runs, content items)
```

---

## Pages & Routes

### Public
- `/` — Landing page: headline, animated demo, features, pricing, "Get Started"
- `/login` — Login (email or OAuth)
- `/signup` — Signup

### App (authenticated)
- `/dashboard` — Sites overview, content feed, analytics, calendar
- `/sites/new` — Add a new site (AI-assisted setup)
- `/sites/[id]` — Site overview: run history, stats
- `/sites/[id]/sources` — Add/remove sources
- `/sites/[id]/plan` — Content plan: approve/reject AI-generated plan
- `/sites/[id]/content` — Content editor: review queue, edit, regenerate, approve
- `/sites/[id]/settings` — CMS connection, schedule, formats, style, quality threshold, publish delay

### System
- `/admin` — Owner-only: user list, usage stats, disable accounts, platform health

---

## User Flow

### Signup + Onboarding
1. User lands on `/`, clicks "Get Started"
2. Signs up via email or Google/GitHub
3. First login: AI chat bubble appears bottom-right
4. AI asks about their site through conversation, sets up everything automatically
5. AI generates full content plan: discovered sources + topics + sample articles + recommended schedule + estimated articles/week
6. User reviews and approves the plan
7. Automation begins on next scheduled run

### Adding a Site
1. User provides their site URL
2. AI analyzes the site: detects CMS, reads existing content to learn brand voice, discovers topic
3. Live progress shown: "Analyzing your site... Detecting CMS... Discovering sources... Building content plan..."
4. Full content plan presented as cards
5. User approves plan, connects CMS via OAuth, sets schedule and preferences
6. Site is active

### Scheduled Content Run
1. Vercel cron triggers run at scheduled time
2. Engine fetches articles from all sources
3. Trust scoring, deduplication, safety filter, originality check
4. AI rewrites in brand voice using Groq (or user's own key)
5. Quality scoring — articles below threshold go to draft
6. AI picks best N articles (user's max per run)
7. SEO metadata + social captions + newsletter version generated (per formats selected)
8. Autopilot mode: push to CMS immediately
   Manual mode: add to review queue, send in-app notification
9. Run logged to DB

### Content Review (Manual Mode)
1. User sees notification in dashboard bell
2. Opens content editor: preview left, edit right
3. Can edit text directly, or click "Regenerate" (whole article or per section)
4. Approves article → pushed to CMS
5. Rejects article → removed from queue

### Rollback
1. User clicks rollback on any published article
2. Article deleted from CMS via API
3. Marked as rolled_back in DB
4. Source flagged so same content isn't repeated

---

## Database Schema

```sql
-- Managed by Supabase Auth
users (id, email, created_at, is_admin)

sites (
  id, user_id, url, name,
  detected_cms,           -- wordpress | webflow | ghost | null
  topic,                  -- AI-detected
  brand_voice,            -- AI-detected from existing content + user style notes
  schedule_type,          -- frequency | one-time
  schedule_frequency,     -- 6h | 12h | daily
  schedule_date,          -- for one-time runs
  mode,                   -- autopilot | manual
  quality_threshold,      -- 0-100, default 70
  publish_delay_minutes,  -- 0 = immediate
  content_formats,        -- array: blog | social | newsletter
  max_articles_per_run,   -- AI picks best N
  ai_key,                 -- optional user-provided Groq/OpenAI key (encrypted)
  content_archive,        -- boolean: store copies in our DB
  status,                 -- active | paused
  created_at
)

site_sources (
  id, site_id,
  type,           -- rss | url | youtube | newsapi
  url, name,
  trust_tier,     -- 1 | 2 | 3 | 4
  status,         -- active | dead
  last_fetched_at,
  fail_count      -- dead after 3 consecutive failures
)

cms_connections (
  id, site_id,
  cms_type,             -- wordpress | webflow | ghost
  access_token,         -- encrypted
  refresh_token,        -- encrypted
  cms_site_id,
  cms_site_url,
  connected_at
)

content_plans (
  id, site_id,
  plan_json,    -- sources + topics + sample articles + schedule + estimated_articles_per_week
  approved_at,
  created_at
)

content_runs (
  id, site_id,
  started_at, completed_at,
  status,       -- running | completed | failed
  added, updated, flagged, blocked, failed_count,
  error_message
)

content_items (
  id, site_id, run_id,
  title, body,
  seo_title, seo_description, seo_keywords,
  social_caption,
  newsletter_excerpt,
  source_urls,          -- array
  quality_score,        -- 0-100
  originality_score,    -- 0-100
  status,               -- draft | published | rolled_back | rejected
  cms_post_id,          -- ID in their CMS after publishing
  published_at,
  created_at
)
```

All OAuth tokens and AI keys encrypted at rest in Supabase.

---

## Content Engine Pipeline

Per-site run (triggered by Vercel cron or manual trigger):

```
1. Load site + sources from DB
2. Fetch articles from all active sources (RSS, URL scrape, YouTube transcript, NewsAPI)
3. Score by trust tier (existing WebCMan trust-scorer.ts)
4. Deduplicate: merge articles covering the same story, cite all sources
5. Safety filter: block medical/legal/advice language (existing safety-filter.ts)
6. Originality check: detect near-copies of source, flag, rewrite if needed
7. AI extraction + rewrite in brand voice (Groq by default, own key if set)
8. Quality score each article — below threshold goes to draft
9. AI picks best N by quality (max_articles_per_run)
10. Generate SEO metadata (title, description, keywords, internal link suggestions)
11. Generate social caption if formats include social
12. Generate newsletter excerpt if formats include newsletter
13. Save to content_items (status: draft)
14. Autopilot → push to CMS immediately (respect publish_delay)
    Manual → add to review queue, fire in-app notification
15. Log run stats to content_runs
```

**Failure handling:**
- CMS push fails → auto-retry 3x with exponential backoff
- All retries fail → notify user, enable manual re-trigger from dashboard
- Source fails 3 consecutive runs → mark dead, notify user, suggest 3 alternatives

---

## CMS Integrations

**Supported at launch:** WordPress, Webflow, Ghost

**Connection flow:**
1. Auto-detect CMS from site URL (check meta tags, generator tag, response headers)
2. User confirms detected CMS or overrides
3. OAuth authorization flow per CMS
4. Access/refresh tokens stored encrypted in `cms_connections`

**Per CMS:**
- **WordPress:** WordPress.com OAuth or WordPress.org REST API (application password)
- **Webflow:** Webflow OAuth API v2
- **Ghost:** Ghost Admin API key (JWT-based, no OAuth needed)

**Push behavior:**
- Autopilot mode: publish immediately (or after `publish_delay`)
- Manual mode: create as draft, user publishes from their CMS or from WebCMan editor
- On rollback: DELETE via CMS API

---

## Source Types

**Available at launch:** RSS feeds, website URLs, YouTube channels, NewsAPI

**User flow:**
1. First ask: "Do you have sources you want to add?"
2. If yes: user provides URLs/feeds
3. If no: show source type options, user picks

**Trust tiers (inherited from existing engine):**
- Tier 1: peer-reviewed journals, WHO, government health
- Tier 2: NIH, CDC, official government
- Tier 3: science news sites
- Tier 4: community/social (requires tier 1-2 corroboration)

---

## Scheduling

| Type | Options |
|---|---|
| Frequency | Every 6h / every 12h / daily (time auto-assigned) |
| One-time | User picks a specific date + time |

Free tier: daily only.
Paid tiers: based on frequency chosen (see Pricing).

---

## Pricing & Plans

| Plan | Frequency | Sites |
|---|---|---|
| Free | Daily (queued behind paid) | 1 site, max 3 articles/run |
| Starter | Daily (priority) | Unlimited |
| Pro | Every 12h | Unlimited |
| Growth | Every 6h | Unlimited |
| Custom | One-time date | Per-use charge |

**All paid plans include:**
- Priority queue (runs before free users)
- Full analytics
- Content editor + section-level regeneration
- All content formats (blog + social captions + newsletter)
- Bring your own AI key (bypass queue entirely)
- Admin rollback + source flagging

**Billing:** implementation deferred — added after core product ships.

---

## AI & Rate Limiting

- Default: Groq free tier (all users share)
- Paid users: priority queue, run before free users
- Any user can add their own Groq/OpenAI/Anthropic API key → bypasses queue entirely
- If Groq quota hit: queue runs, user notified of delay

---

## UI & Visual Design

**Style:** Friendly, modern, approachable — Notion/Webflow energy.

**Colors:**
- Primary: `orange-500` / `amber-400`
- Neutral: `stone` scale (warm gray)
- Success: `green-500`
- Warning: `amber-500`
- Error: `red-500`
- Typography: Inter

**Modes:** Light mode default, full dark mode toggle (preference saved per user).

**Key UI moments:**
- Landing page: bold orange headline, Framer Motion animated demo of content auto-publishing, feature cards with amber accents, pricing table
- Onboarding AI chat: orange gradient border bubble, types live, shows real-time site analysis progress steps
- Content plan approval: card layout, amber source trust badges, sample article preview, one-click approve
- Content editor: split view (preview left, edit right), per-section Regenerate buttons in orange, quality + originality score badges
- Dashboard: stone backgrounds, orange accent charts (Recharts), amber status badges
- Run status: orange progress bar when active, green = success, amber = warnings, red = failed

---

## Admin Panel (`/admin`, owner only)

- User list with plan, site count, last active
- Usage stats: total runs, articles published, active sites
- Disable/enable user accounts
- Platform health: Groq quota usage, run queue depth, error rate
- Changelog management: publish new changelog entries (shown as in-app popup to users)

---

## Notifications

- In-app only (bell icon, no email digests)
- Triggers:
  - Run completed (summary)
  - Article needs review (manual mode)
  - Run failed after all retries
  - Source went dead (+ 3 alternatives suggested)
  - New feature changelog entry

---

## Support

- In-app chat widget (Crisp or Tawk.to — free tier)
- Docs page (simple Next.js page, manually written)
- Email support address shown on docs page

---

## Multilingual Support

Language is a per-site setting. Users can set their site's output language (e.g. publish in Spanish even if sources are in English). AI translates during the rewrite step. If no language is set, content is published in the source language.

---

## What This Is Not

- Not a social media auto-poster (generates captions only, no auto-posting)
- Not a team collaboration tool (solo accounts at launch, team added later)
- Not open source
- Not a CLI tool
- Not a CMS itself — content lives in the user's CMS, we just push to it
