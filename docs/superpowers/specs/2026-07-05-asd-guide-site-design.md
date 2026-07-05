# ASD Guide Site — Design Spec

Date: 2026-07-05

## Purpose

A website for parents and therapists to discover and stay informed about autism
spectrum therapies and interventions from around the world (functional medicine,
MAPS, stem cell therapy, MERT, speech & language therapy, occupational therapy,
physical therapy, music therapy, sound therapy, brain balance, infrared
light/photobiomodulation, FMT, Lyme-related protocols, and more), as well as
information on common behaviors, their possible triggers, and anecdotal home
remedies. The site is an **aggregation/curation platform**: content is sourced
from public websites, research, and community discussion (e.g. Reddit), and
is always attributed back to its original source — the site does not claim
ownership of aggregated content and does not present itself as a source of
medical advice.

Primary audience: parents. Secondary audience: therapists. One shared
experience for both, no login/accounts.

## Scope

This spec covers Phase 1 (the full website, seeded with curated initial
content) and Phase 2 (a local scraping script that keeps content updated
going forward). Phase 2 is a script, not part of the deployed web app.

## Non-functional requirements

- Industry-standard visual design (reference layout patterns from health-info
  sites like autismspeaks.org/autism.org for inspiration only — no copied
  design assets or content).
- Consistent page template across all pages (shared header/nav, footer,
  breadcrumb, content-card layout).
- Smooth page transitions/animations (Framer Motion).
- Content-rich home page; other content lives under tabs/nav.
- Fully responsive.
- Buildable and runnable locally (`npm install`, `npm run dev`, `npm run build`).
- Git-tracked from the start so it can be pushed to the user's own remote
  (no remote is configured or pushed to by the assistant).

## Architecture & tech stack

- **Framework**: Next.js (App Router), React, TypeScript.
- **Styling**: Tailwind CSS.
- **Animation**: Framer Motion for route/page transitions.
- **Content storage**: JSON files in `content/`, organized by section:
  - `content/therapies/*.json`
  - `content/behaviors/*.json` (home remedies are embedded per-behavior, not
    a separate taxonomy)
  - `content/news/*.json`
  - `content/resources/*.json`
  - `content/credits.json` — maps image filenames to source + license
  - No database. Next.js reads JSON at build/request time.
- **Images**: `public/images/`, sourced only from CC0/open-license sources
  (Unsplash, Pexels, Wikimedia Commons), credited in `content/credits.json`.
  No AI-generated images in Phase 1 (may revisit later if suitable free
  images can't be found for a topic).

## Site structure (IA)

Shared template (header/nav, footer, breadcrumb) across all pages.

- **Home** — hero intro, featured therapies, latest news teaser, quick links
  into each section.
- **Therapies** — directory of ~12+ therapy entries. Each entry has:
  - What it is, claimed benefits, evidence/controversy notes
  - Regions/countries where it's offered
  - Evidence-level tag: "Clinical/peer-reviewed" vs "Emerging/anecdotal"
  - 2–4 attributed source links
  - Representative image
  - Filter/search by category and evidence level
- **Behaviors & Triggers** — ~10–15 common behavior entries (meltdowns,
  stimming, sensory avoidance, elopement, etc.), each with:
  - Possible triggers
  - Anecdotal home remedies / coping strategies
  - Source attribution + evidence tag (per-entry, since these lean anecdotal)
- **Latest News** — reverse-chronological feed of new therapies/research/
  developments worldwide, each attributed with source + date.
- **Resources** — evergreen guides/glossary/reference content (static, not
  time-based like Latest News).
- **About & Disclaimer** — platform purpose, aggregation/attribution model,
  liability disclaimer.

## Attribution & disclaimer model

- Every content entry displays a visible "Source: [name/site], via
  [forum/article]" line with an outbound link to the original.
- Global footer disclaimer + a one-time dismissible banner: this is an
  aggregation platform for informational purposes; it does not own or
  endorse aggregated content; it is not medical advice; consult a
  professional.
- Behavior/remedy entries carry an evidence tag (Clinical vs
  Anecdotal/Community-sourced) so users can calibrate trust per item.

## Phase 1: initial content

Initial content is researched and written by the assistant now (treated as
the "first pass" of curation), summarized in original wording per topic
(not copied from any single source), with proper attribution links. Depth
target: solid overview per therapy (what it is, benefits, evidence notes,
regions, sources, image) and per behavior (triggers, remedies, attribution),
populating the site fully rather than with stub content.

## Phase 2: scraping script

- Standalone script (`scripts/scrape.ts`), run manually (or via cron later)
  — not part of the deployed app.
- **Sources**:
  - Public websites, clinic pages, news articles
  - Research feeds (e.g. PubMed RSS or similar)
  - Reddit, via Reddit's official API (registered app + OAuth, respecting
    rate limits) — for community/anecdotal behavior & remedy content
  - Facebook is explicitly out of scope for automated scraping (no
    practical compliant API for this use case).
- **Output**: writes new/updated JSON files directly into `content/`, using
  the same schema as seed content, tagged `sourceType: "scraped"` with a
  timestamp.
- **Publishing**: auto-published (writes straight into the content the site
  reads), tagged so scraped-but-unreviewed items are distinguishable from
  curated seed content.
- **Dedup**: by source URL, to avoid re-adding items already present on
  repeat runs.
- No UI for this phase — a documented `npm run scrape` command is
  sufficient.

## Out of scope (for this spec)

- User accounts/login, personalized views
- Live deployment/hosting (local + git only for now)
- Automated Facebook scraping
- A review/moderation queue UI for scraped content (auto-publish was chosen
  instead)
- Separate "Home Remedies" tab (folded into Behaviors & Triggers)
