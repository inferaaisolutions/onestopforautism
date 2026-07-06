# ASD Guide

An aggregation platform for autism spectrum therapies, behaviors & triggers,
and the latest research/news from around the world — built for parents and
therapists.

## Getting started

    npm install
    npm run dev

Open http://localhost:3000.

## Scripts

- `npm run dev` — start the local dev server
- `npm run build` — production build
- `npm start` — run the production build
- `npm test` — run the test suite (Vitest)
- `npm run scrape` — run the Phase 2 content scraper (writes into `content/`)

## Content

All content lives as JSON files under `content/` (`therapies/`, `behaviors/`,
`news/`, `resources/`), validated against schemas in `src/lib/schema.ts`.
Images live under `public/images/`, credited in `content/credits.json`.

## Phase 2 scraper

`npm run scrape` fetches new content and writes it into `content/`, tagged
`sourceType: "scraped"`. Reddit sourcing requires a registered Reddit app:
copy `.env.example` to `.env.local` and fill in `REDDIT_CLIENT_ID` /
`REDDIT_CLIENT_SECRET`. Without them, Reddit sourcing is skipped gracefully.

## Disclaimer

This is an independent aggregation platform. Content is sourced from public
websites, research, and community discussion, and remains the property of
its original authors. Nothing on this site is medical advice.
