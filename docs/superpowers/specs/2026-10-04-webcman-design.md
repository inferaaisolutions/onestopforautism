# WebCMan — AI Web Content Manager Design

**Date:** 2026-10-04
**Status:** Approved for implementation

---

## Goal

WebCMan is a framework-agnostic, serverless AI content manager that automatically keeps any website's content up to date from trusted sources — with no human review step, no server to manage, and a single config file to get started.

Validated first on the ASD Guide site, then open-sourced for others. Goal: 10 active sites in 6 months.

---

## Architecture Overview

WebCMan runs as a GitHub Actions workflow (serverless cron). On each run it:

1. Reads `webcman.config.json` from the site repo to understand the site topic and content directory
2. Scans existing content files to infer the JSON schema automatically — no schema definition needed
3. Uses Claude API to identify the right trusted sources for the site topic
4. Fetches content from those sources: RSS feeds, web scraping, PDFs, academic APIs (PubMed, Cochrane, etc.)
5. Ranks sources by trust tier: peer-reviewed journal > health/government org > news outlet > community post
6. Extracts plain-language summaries — no jargon, no medical/legal/financial advice language
7. Detects conflicts between sources and flags them rather than hiding them
8. Writes new and updated JSON files to the content directory
9. Commits changes to the repo (Git integration)
10. Logs all activity for the dashboard
11. On every run, checks existing content for staleness and updates if newer evidence exists

---

## Config File

Each site has one file: `webcman.config.json` at the repo root.

```json
{
  "topic": "autism therapies and research",
  "contentDir": "./content",
  "schedule": "0 10 * * *",
  "trustTiers": {
    "tier1": ["pubmed.ncbi.nlm.nih.gov", "cochranelibrary.com", "who.int"],
    "tier2": ["nih.gov", "autismspeaks.org", "cdc.gov"],
    "tier3": ["sciencedaily.com", "thetransmitter.org"],
    "tier4": ["reddit.com"]
  },
  "blockedPhrases": ["consult your doctor", "medical advice", "consult a physician"],
  "rollbackDepth": 5
}
```

- `topic` — plain English description of the site's subject matter. WebCMan uses this to auto-discover additional trusted sources beyond the defaults.
- `contentDir` — where JSON content files live.
- `schedule` — cron expression for GitHub Actions.
- `trustTiers` — optional override of default trusted domains per tier. If omitted, WebCMan infers appropriate sources from the topic.
- `blockedPhrases` — phrases that cause a content item to be hard-blocked before publishing.
- `rollbackDepth` — how many previous versions to keep per file for rollback.

---

## Schema Inference

WebCMan scans all JSON files in `contentDir` subdirectories and infers the schema per content type:

- Detects required fields (present in >80% of files) vs optional fields
- Detects field types (string, array, object, enum-like strings)
- Uses this inferred schema as the target structure for all new and updated content

No manual schema definition needed. Works for any content shape.

---

## Source Discovery & Fetching

**Auto-discovery:** Claude API receives the site topic and returns a ranked list of trusted domains and feed URLs appropriate for that topic. This runs once at setup and is cached in the repo.

**Fetch methods (all supported):**
- RSS/Atom feeds — parsed with `fast-xml-parser`
- Web page scraping — fetch HTML, extract main content
- PDF documents — fetch and extract text
- Academic APIs — PubMed eUtils, Cochrane REST API, others as needed

**Trust scoring:** Each source item carries a trust score (1–4) based on its domain tier. Items from tier 1 sources are published with full confidence. Items from tier 4 require corroboration from a tier 1 or 2 source to be published.

---

## Content Extraction & Safety

Claude API processes each raw source item with a strict prompt:

- Write in plain language a general reader can understand
- No medical, legal, or financial advice language
- No jargon — if a technical term is needed, briefly define it
- Always include the source URL
- If two sources conflict on the same topic, include both perspectives and add `"conflictFlag": true` to the JSON
- Hard-blocked phrases: if detected in output, the item is discarded entirely and logged as blocked

Output is validated against the inferred schema with Zod before writing.

---

## Update Logic

**New content:** If a source item's URL is not already in any existing file, it is a candidate for a new page. A new JSON file is created if the source passes trust and safety checks.

**Existing content updates:** On each run, WebCMan checks every existing content file against recent source data. If newer evidence from a higher-trust source contradicts or supplements the existing content, the file is updated. The old version is saved to `.webcman/history/<slug>/<timestamp>.json` for rollback.

**Staleness detection:** Files older than 90 days are re-evaluated against current sources on each weekly run (separate from the daily new-content run).

---

## Git Integration

WebCMan commits all changes to the repo with structured commit messages:

```
webcman: add 3 items, update 2, flag 1 conflict, block 1
```

Each changed file is staged individually so rollback is per-file, not per-run. The GitHub Actions bot account makes the commits.

---

## Dashboard

A lightweight static dashboard served at `/webcman` (or a standalone page) reads from `.webcman/logs/` and displays:

- **Added** — new content pages created in the last 7 days
- **Updated** — existing pages updated with new evidence
- **Flagged** — items with conflicting sources, shown with both perspectives
- **Blocked** — items rejected due to blocked phrases or insufficient trust
- **Rollback** — per-file button to restore the previous version

The dashboard is a single static HTML file generated by WebCMan after each run — no server required.

---

## Rollback

Every file write saves the previous version to `.webcman/history/<slug>/<iso-timestamp>.json`. The dashboard surfaces a rollback button per file. Triggering rollback:

1. Restores the selected version to the content directory
2. Commits the restoration with message `webcman: rollback <slug> to <timestamp>`
3. Updates the log

Up to `rollbackDepth` (default 5) historical versions are kept per file. Older versions are pruned automatically.

---

## GitHub Actions Setup

WebCMan ships as a reusable GitHub Actions workflow. Adding it to any repo:

```yaml
# .github/workflows/webcman.yml
name: WebCMan Content Update
on:
  schedule:
    - cron: '0 10 * * *'
  workflow_dispatch:

jobs:
  update:
    uses: webcman/webcman/.github/workflows/run.yml@main
    with:
      content-dir: ./content
    secrets:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

That's the entire integration for any repo. One file, one secret.

---

## Error Handling & Notifications

- Source fetch failures are logged and skipped — one bad source never blocks the run
- Claude API failures retry once, then log and skip
- Zod validation failures log the item and skip
- If the entire run produces zero new/updated items (possible legitimate outcome), it logs "no changes" — not an error
- GitHub Actions natively sends email on workflow failure — no extra notification setup needed

---

## Framework Compatibility

WebCMan writes JSON files to a directory. It has no dependency on any frontend framework. It works with:

- Next.js (this ASD site)
- Astro, Nuxt, SvelteKit (any framework that reads JSON at build or request time)
- Plain HTML sites (with a small JS snippet to load JSON)
- Hugo, Jekyll (via data files)
- Any system where content = files on disk

---

## Phased Rollout

**Phase 1 — ASD site (now):** Validate the full pipeline on the ASD Guide. Automate all content types: news, therapies, behaviors, resources.

**Phase 2 — Open source:** Extract WebCMan into its own repo. Write README and setup docs. Make the GitHub Actions workflow publishable.

**Phase 3 — Commercial:** Add a hosted dashboard, multi-site management, and usage-based billing on top of the open-source core.

---

## What WebCMan Is Not

- Not a CMS with a UI for manually editing content
- Not a chatbot or Q&A system
- Not a replacement for human editorial judgment on high-stakes content
- Not a crawler that indexes the entire web — only fetches from explicitly trusted or AI-discovered trusted sources
