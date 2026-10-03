# ASD Guide — AI Content Updater Design

**Date:** 2026-10-03
**Project:** asd_site (Next.js 14, content/*.json)

---

## Overview

An automated daily pipeline that uses the Claude API to fetch autism-related research from trusted sources, extract structured content, validate it against existing Zod schemas, and write new or updated JSON files into the `content/` folder — with no human intervention required.

---

## Constraints

- Content must **never** sound like medical advice or doctor recommendations
- All claims must use informational language: "research suggests", "a 2025 study found", "evidence indicates"
- Every content item must include at least one source reference with label + URL
- Nothing that fails Zod schema validation is ever written to disk
- The site disclaimer already present covers all AI-generated content

---

## Architecture

```
scripts/
  ai-update.ts              <- main entry point, orchestrates the daily run
  setup-scheduler.ts        <- one-time Windows Task Scheduler registration
  lib/
    sources.ts              <- trusted source definitions + fetch logic per source
    ai-extractor.ts         <- Claude API calls, prompt construction, JSON parsing
    content-writer.ts       <- reads existing JSON, merges updates, writes files
    dedup.ts                <- fingerprinting to prevent duplicate entries
    logger.ts               <- structured daily log writer

content/                    <- existing folder, written to by the pipeline
  therapies/
  behaviors/
  news/
  resources/

logs/
  ai-update-YYYY-MM-DD.json <- audit trail per run
```

---

## Trusted Sources

| Source | Method |
|---|---|
| PubMed / NCBI | Free API (`eutils.ncbi.nlm.nih.gov`) — query "autism" filtered by date |
| Cochrane Library | RSS feed + article page fetch |
| NIH | RSS feed (`news.nih.gov`) filtered for autism keywords |
| Autism Speaks | RSS feed |
| ABAI | Web fetch of recent publications page |
| WHO | RSS feed |
| Reddit (r/autism, r/Autism_Parenting) | Reddit API (credentials in `.env.local`) |

---

## Claude API — Content Extraction

`ai-extractor.ts` constructs a prompt per article:

```
You are a research assistant for an autism information platform.
Extract structured information from the following article.

Rules:
- Never make medical recommendations or use prescriptive language
- Never say "you should", "this treats", "this cures", "clinically proven"
- Use phrases like "research suggests", "a study found", "evidence indicates"
- Always include the original source with label and URL
- evidenceLevel must be exactly one of: "clinical", "emerging", "anecdotal"
- Output valid JSON matching the provided schema

Schema: [Zod schema injected at runtime]

Article: [fetched content]
```

Claude returns structured JSON -> Zod validates -> written or rejected.

---

## Deduplication

- News items: fingerprint = slug derived from `title + date`
- Therapies/behaviors: check if slug file already exists
- If existing file found: only overwrite if new source has a newer date than `updatedAt`
- If new: create new JSON file
- Prevents re-adding the same article across daily runs

---

## Daily Log Format

`logs/ai-update-YYYY-MM-DD.json`:
```json
{
  "date": "2026-10-03",
  "added": ["news/gut-study-2026.json"],
  "updated": ["therapies/music-therapy.json"],
  "skipped": 4,
  "failed": 1,
  "failureReasons": ["Zod validation failed: missing sources field"]
}
```

---

## Error Handling

| Situation | Behaviour |
|---|---|
| Source fetch fails | Skip that source, log, continue with others |
| Claude returns invalid JSON | Retry once, then skip + log |
| Zod validation fails | Discard, log reason |
| File write fails | Log error, continue run |
| `ANTHROPIC_API_KEY` missing | Exit early with clear message |
| Duplicate detected | Skip silently, count in log |

The pipeline never writes invalid content and never crashes the site.

---

## Scheduling

One-time setup:
```bash
npm run setup-scheduler
```

Registers a Windows Task Scheduler task:
- **Name:** ASD-Guide-Daily-Update
- **Trigger:** Daily at 3:00 AM
- **Action:** `node scripts/ai-update.ts`
- **Working dir:** project root

Manual trigger anytime:
```bash
npm run ai-update
```

---

## Environment Variables

Add to `.env.local`:
```
ANTHROPIC_API_KEY=your_key_here
REDDIT_CLIENT_ID=...        # already present
REDDIT_CLIENT_SECRET=...    # already present
```

---

## npm Scripts to Add

```json
"ai-update": "tsx scripts/ai-update.ts",
"setup-scheduler": "tsx scripts/setup-scheduler.ts"
```

---

## Files Changed / Created

| File | Action |
|---|---|
| `scripts/ai-update.ts` | New — main entry point |
| `scripts/setup-scheduler.ts` | New — Task Scheduler registration |
| `scripts/lib/sources.ts` | New — source definitions |
| `scripts/lib/ai-extractor.ts` | New — Claude API integration |
| `scripts/lib/content-writer.ts` | New — file read/write/merge |
| `scripts/lib/dedup.ts` | New — deduplication logic |
| `scripts/lib/logger.ts` | New — log writer |
| `package.json` | Updated — add `ai-update` + `setup-scheduler` scripts |
| `.env.example` | Updated — add `ANTHROPIC_API_KEY` |
| `logs/` | New directory — daily audit logs |
