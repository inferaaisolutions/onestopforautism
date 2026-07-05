# ASD Guide Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full Next.js site aggregating autism therapy information, behaviors/triggers, and news for parents and therapists, seeded with curated content, plus a Phase 2 local scraper script.

**Architecture:** Next.js 14 App Router + TypeScript + Tailwind, content stored as JSON files under `content/` validated by Zod schemas, no database. Shared layout (header/nav/footer/disclaimer banner/page transitions) wraps all routes. Phase 2 adds a standalone `scripts/scrape.ts` that writes into the same `content/` JSON files.

**Tech Stack:** Next.js ^14.2.0, React ^18.3.0, TypeScript, Tailwind CSS, Framer Motion, Zod, Vitest + React Testing Library, tsx (for running the scraper script).

## Global Constraints

- No database — all content is JSON files under `content/`, read via `src/lib/content.ts`.
- No user accounts/login.
- One shared page template across all routes (see Task 3).
- Images only from CC0/open-license sources (Unsplash, Pexels, Wikimedia Commons), credited in `content/credits.json`. No AI-generated images in Phase 1.
- Every content entry shows source attribution with an outbound link; behaviors/remedies additionally show an evidence-level tag (`clinical` | `emerging` | `anecdotal`).
- Site must be `npm run build`-able and `npm run dev`-runnable locally at every task boundary.
- Git-tracked; commit after every task. No remote push (user pushes themselves).
- Reddit scraping (Phase 2) uses Reddit's official API only; Facebook scraping is out of scope.
- Scraped content (Phase 2) auto-publishes into `content/` tagged `sourceType: "scraped"`.

---

## Task 1: Project Scaffolding & Tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.js`, `vitest.config.ts`, `vitest.setup.ts`, `.gitignore`, `README.md`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Interfaces:**
- Produces: a working Next.js app skeleton every later task builds on. No app-level types yet.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "asd-guide",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "scrape": "tsx scripts/scrape.ts"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "framer-motion": "^11.11.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.9.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "vitest": "^2.1.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/user-event": "^14.5.0",
    "tsx": "^4.19.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Write `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
```

- [ ] **Step 4: Write `tailwind.config.ts`**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: {} },
  plugins: [],
};
export default config;
```

- [ ] **Step 5: Write `postcss.config.js`**

```js
module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

- [ ] **Step 6: Write `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: Write `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 8: Write `vitest.setup.ts`**

```typescript
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 9: Write `.gitignore`**

```
node_modules/
.next/
out/
.env
.env.local
*.log
.DS_Store
```

- [ ] **Step 10: Write minimal `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASD Guide",
  description: "A parent- and therapist-friendly guide to autism therapies, behaviors, and research from around the world.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 11: Write minimal `src/app/page.tsx`**

```tsx
export default function HomePage() {
  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold">ASD Guide</h1>
    </main>
  );
}
```

- [ ] **Step 12: Write `README.md`**

```markdown
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

## Disclaimer

This is an independent aggregation platform. Content is sourced from public
websites, research, and community discussion, and remains the property of
its original authors. Nothing on this site is medical advice.
```

- [ ] **Step 13: Install dependencies**

Run: `npm install`
Expected: installs without error, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 14: Verify the app builds**

Run: `npm run build`
Expected: build succeeds, prints a route summary including `/`.

- [ ] **Step 15: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs tailwind.config.ts postcss.config.js vitest.config.ts vitest.setup.ts .gitignore README.md src
git commit -m "chore: scaffold Next.js app with Tailwind and Vitest"
```

---

## Task 2: Content Schemas, Loaders & Filter Utilities

**Files:**
- Create: `src/lib/schema.ts`, `src/lib/content.ts`, `src/lib/filter.ts`
- Create: `src/lib/content.test.ts`, `src/lib/filter.test.ts`
- Create: `content/therapies/maps-medical-model.json`, `content/behaviors/meltdowns.json`, `content/news/gut-microbiome-research-trend.json`, `content/resources/glossary-of-terms.json`

**Interfaces:**
- Produces: `EvidenceLevel`, `SourceLink`, `Therapy`, `Behavior`, `NewsItem`, `Resource` types (from `src/lib/schema.ts`); `getTherapies()`, `getTherapyBySlug(slug)`, `getBehaviors()`, `getBehaviorBySlug(slug)`, `getNews()`, `getResources()` (from `src/lib/content.ts`); `filterTherapies(therapies, query, evidenceLevel?)`, `filterBehaviors(behaviors, query)` (from `src/lib/filter.ts`). All later tasks consume these.

- [ ] **Step 1: Write `src/lib/schema.ts`**

```typescript
import { z } from "zod";

export const evidenceLevelSchema = z.enum(["clinical", "emerging", "anecdotal"]);

export const sourceLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export const therapySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().min(1),
  claimedBenefits: z.array(z.string().min(1)).min(1),
  evidenceNotes: z.string().min(1),
  evidenceLevel: evidenceLevelSchema,
  regions: z.array(z.string().min(1)).min(1),
  sources: z.array(sourceLinkSchema).min(1),
  image: z.string().min(1),
  sourceType: z.enum(["seed", "scraped"]),
  updatedAt: z.string().min(1),
});

export const behaviorRemedySchema = z.object({
  text: z.string().min(1),
  evidenceLevel: evidenceLevelSchema,
  source: sourceLinkSchema.optional(),
});

export const behaviorSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(1),
  triggers: z.array(z.string().min(1)).min(1),
  remedies: z.array(behaviorRemedySchema).min(1),
  sources: z.array(sourceLinkSchema).min(1),
  image: z.string().min(1).optional(),
  sourceType: z.enum(["seed", "scraped"]),
  updatedAt: z.string().min(1),
});

export const newsItemSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  date: z.string().min(1),
  region: z.string().min(1).optional(),
  sources: z.array(sourceLinkSchema).min(1),
  sourceType: z.enum(["seed", "scraped"]),
});

export const resourceSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  body: z.string().min(1),
  sources: z.array(sourceLinkSchema).optional(),
});

export type EvidenceLevel = z.infer<typeof evidenceLevelSchema>;
export type SourceLink = z.infer<typeof sourceLinkSchema>;
export type Therapy = z.infer<typeof therapySchema>;
export type Behavior = z.infer<typeof behaviorSchema>;
export type NewsItem = z.infer<typeof newsItemSchema>;
export type Resource = z.infer<typeof resourceSchema>;
```

- [ ] **Step 2: Write the one worked seed entry per content type**

`content/therapies/maps-medical-model.json`:

```json
{
  "slug": "maps-medical-model",
  "name": "MAPS Medical Model (Medical Academy of Pediatric Special Needs)",
  "category": "Biomedical & Medical",
  "summary": "A physician network applying individualized medical workups (nutrition, gut health, metabolic and immune testing) alongside standard autism care.",
  "description": "MAPS refers to a network of physicians, trained through the Medical Academy of Pediatric Special Needs, who treat autism using an individualized 'biomedical' model. Rather than a single therapy, it is a clinical approach: doctors order lab panels (e.g. gut microbiome, nutrient levels, metabolic markers) and build a treatment plan that may include dietary changes, supplements, and management of co-occurring conditions like gastrointestinal issues or sleep problems. Families often pursue MAPS alongside, not instead of, behavioral and developmental therapies.",
  "claimedBenefits": [
    "Identifies and treats co-occurring medical conditions (GI issues, nutrient deficiencies, sleep problems) that may worsen behavior",
    "Individualized plans based on lab testing rather than a one-size-fits-all protocol",
    "Coordinates biomedical and behavioral care under one physician network"
  ],
  "evidenceNotes": "Individual components (treating diagnosed GI disease, correcting a confirmed nutrient deficiency) are standard medicine with real evidence behind them. The broader biomedical/MAPS framework as an autism-specific treatment paradigm is not itself a single validated protocol, and some recommended tests/supplements go beyond what major pediatric bodies endorse. Families are encouraged to discuss any MAPS-recommended workup with their child's regular pediatrician.",
  "evidenceLevel": "emerging",
  "regions": ["United States", "Canada", "United Kingdom"],
  "sources": [
    { "label": "Autism Speaks - Treatments Overview", "url": "https://www.autismspeaks.org/" },
    { "label": "NIH National Center for Complementary and Integrative Health", "url": "https://www.nccih.nih.gov/" }
  ],
  "image": "maps-medical-model.jpg",
  "sourceType": "seed",
  "updatedAt": "2026-07-05"
}
```

`content/behaviors/meltdowns.json`:

```json
{
  "slug": "meltdowns",
  "name": "Meltdowns",
  "summary": "An intense, involuntary response to being overwhelmed — different from a tantrum in that it isn't goal-directed and the child usually can't self-stop it on request.",
  "triggers": [
    "Sensory overload (loud noise, bright light, crowded spaces)",
    "Unexpected changes to routine or transitions",
    "Communication frustration when needs aren't understood",
    "Fatigue, hunger, or illness lowering tolerance"
  ],
  "remedies": [
    {
      "text": "Move to a quieter, dimmer space and reduce sensory input rather than trying to talk the child out of it",
      "evidenceLevel": "anecdotal"
    },
    {
      "text": "Use a visual schedule ahead of transitions so changes are predictable",
      "evidenceLevel": "emerging"
    },
    {
      "text": "Deep pressure (weighted blanket, firm hug if welcomed) to help with sensory regulation",
      "evidenceLevel": "anecdotal"
    }
  ],
  "sources": [
    { "label": "Autism Speaks - Meltdowns vs. Tantrums", "url": "https://www.autismspeaks.org/" },
    { "label": "r/autism community discussion", "url": "https://www.reddit.com/r/autism/" }
  ],
  "image": "meltdowns.jpg",
  "sourceType": "seed",
  "updatedAt": "2026-07-05"
}
```

`content/news/gut-microbiome-research-trend.json`:

```json
{
  "slug": "gut-microbiome-research-trend",
  "title": "Growing research interest in the gut-brain connection in autism",
  "summary": "Research groups worldwide continue to study links between gut microbiome composition and autism traits, fueling interest in approaches like FMT and targeted probiotics — though most studies remain small and early-stage.",
  "date": "2026-06-01",
  "sources": [
    { "label": "NIH National Institute of Mental Health", "url": "https://www.nimh.nih.gov/" }
  ],
  "sourceType": "seed"
}
```

`content/resources/glossary-of-terms.json`:

```json
{
  "slug": "glossary-of-terms",
  "title": "Glossary of Common Terms",
  "category": "Reference",
  "body": "ASD: Autism Spectrum Disorder. OT: Occupational Therapy. PT: Physical Therapy. SLP: Speech-Language Pathologist. MAPS: Medical Academy of Pediatric Special Needs. FMT: Fecal Microbiota Transplant. Evidence levels used on this site: Clinical/Peer-Reviewed (supported by published clinical research), Emerging Evidence (studied but not yet conclusive), Anecdotal/Community-Sourced (reported by parents/community, not formally studied)."
}
```

- [ ] **Step 3: Write `src/lib/content.ts`**

```typescript
import fs from "fs";
import path from "path";
import { z } from "zod";
import {
  therapySchema,
  behaviorSchema,
  newsItemSchema,
  resourceSchema,
  Therapy,
  Behavior,
  NewsItem,
  Resource,
} from "./schema";

const CONTENT_DIR = path.join(process.cwd(), "content");

function readJsonDir<T>(subdir: string, schema: z.ZodType<T>): T[] {
  const dir = path.join(CONTENT_DIR, subdir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
      const result = schema.safeParse(raw);
      if (!result.success) {
        throw new Error(`Invalid content file ${subdir}/${f}: ${result.error.message}`);
      }
      return result.data;
    });
}

export function getTherapies(): Therapy[] {
  return readJsonDir("therapies", therapySchema);
}

export function getTherapyBySlug(slug: string): Therapy | undefined {
  return getTherapies().find((t) => t.slug === slug);
}

export function getBehaviors(): Behavior[] {
  return readJsonDir("behaviors", behaviorSchema);
}

export function getBehaviorBySlug(slug: string): Behavior | undefined {
  return getBehaviors().find((b) => b.slug === slug);
}

export function getNews(): NewsItem[] {
  return readJsonDir("news", newsItemSchema).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getResources(): Resource[] {
  return readJsonDir("resources", resourceSchema);
}
```

- [ ] **Step 4: Write `src/lib/content.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { getTherapies, getTherapyBySlug, getBehaviors, getNews, getResources } from "./content";

describe("content loaders", () => {
  it("loads at least one therapy and every entry matches the schema", () => {
    const therapies = getTherapies();
    expect(therapies.length).toBeGreaterThan(0);
    for (const t of therapies) {
      expect(t.slug).toBeTruthy();
      expect(["clinical", "emerging", "anecdotal"]).toContain(t.evidenceLevel);
      expect(t.sources.length).toBeGreaterThan(0);
    }
  });

  it("finds a therapy by slug", () => {
    const first = getTherapies()[0];
    expect(getTherapyBySlug(first.slug)?.name).toBe(first.name);
  });

  it("returns undefined for an unknown slug", () => {
    expect(getTherapyBySlug("does-not-exist")).toBeUndefined();
  });

  it("loads behaviors, news, and resources", () => {
    expect(getBehaviors().length).toBeGreaterThan(0);
    expect(getNews().length).toBeGreaterThan(0);
    expect(getResources().length).toBeGreaterThan(0);
  });

  it("sorts news newest first", () => {
    const news = getNews();
    for (let i = 1; i < news.length; i++) {
      expect(news[i - 1].date >= news[i].date).toBe(true);
    }
  });
});
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- content.test.ts`
Expected: all tests PASS.

- [ ] **Step 6: Write `src/lib/filter.ts`**

```typescript
import { Therapy, Behavior, EvidenceLevel } from "./schema";

export function filterTherapies(
  therapies: Therapy[],
  query: string,
  evidenceLevel?: EvidenceLevel
): Therapy[] {
  const q = query.trim().toLowerCase();
  return therapies.filter((t) => {
    const matchesQuery = q === "" || t.name.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q);
    const matchesEvidence = !evidenceLevel || t.evidenceLevel === evidenceLevel;
    return matchesQuery && matchesEvidence;
  });
}

export function filterBehaviors(behaviors: Behavior[], query: string): Behavior[] {
  const q = query.trim().toLowerCase();
  return behaviors.filter(
    (b) => q === "" || b.name.toLowerCase().includes(q) || b.summary.toLowerCase().includes(q)
  );
}
```

- [ ] **Step 7: Write `src/lib/filter.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { filterTherapies, filterBehaviors } from "./filter";
import { Therapy, Behavior } from "./schema";

const therapy = (overrides: Partial<Therapy>): Therapy => ({
  slug: "t",
  name: "Speech Therapy",
  category: "Communication",
  summary: "Helps with communication",
  description: "desc",
  claimedBenefits: ["benefit"],
  evidenceNotes: "notes",
  evidenceLevel: "clinical",
  regions: ["Global"],
  sources: [{ label: "Source", url: "https://example.org" }],
  image: "img.jpg",
  sourceType: "seed",
  updatedAt: "2026-01-01",
  ...overrides,
});

describe("filterTherapies", () => {
  it("matches by name substring, case-insensitive", () => {
    const therapies = [therapy({ name: "Speech Therapy" }), therapy({ slug: "b", name: "Music Therapy" })];
    expect(filterTherapies(therapies, "speech")).toHaveLength(1);
  });

  it("filters by evidence level", () => {
    const therapies = [
      therapy({ slug: "a", evidenceLevel: "clinical" }),
      therapy({ slug: "b", evidenceLevel: "anecdotal" }),
    ];
    expect(filterTherapies(therapies, "", "anecdotal")).toHaveLength(1);
  });

  it("returns all therapies for an empty query and no evidence filter", () => {
    const therapies = [therapy({ slug: "a" }), therapy({ slug: "b" })];
    expect(filterTherapies(therapies, "")).toHaveLength(2);
  });
});

describe("filterBehaviors", () => {
  const behavior = (overrides: Partial<Behavior>): Behavior => ({
    slug: "meltdowns",
    name: "Meltdowns",
    summary: "Overwhelm response",
    triggers: ["noise"],
    remedies: [{ text: "quiet space", evidenceLevel: "anecdotal" }],
    sources: [{ label: "Source", url: "https://example.org" }],
    sourceType: "seed",
    updatedAt: "2026-01-01",
    ...overrides,
  });

  it("matches by name or summary substring", () => {
    const behaviors = [behavior({ slug: "a", name: "Meltdowns" }), behavior({ slug: "b", name: "Stimming" })];
    expect(filterBehaviors(behaviors, "melt")).toHaveLength(1);
  });
});
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npm test -- filter.test.ts`
Expected: all tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib content
git commit -m "feat: add content schemas, loaders, and filter utilities"
```

---

## Task 3: Shared Layout — Header, Footer, Disclaimer Banner, Page Transition

**Files:**
- Create: `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/DisclaimerBanner.tsx`, `src/components/Transition.tsx`
- Create: `src/components/DisclaimerBanner.test.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: none new.
- Produces: `<Header />`, `<Footer />`, `<DisclaimerBanner />`, `<Transition>{children}</Transition>` — used by `src/app/layout.tsx` and available to every page.

- [ ] **Step 1: Write `src/components/Header.tsx`**

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/therapies", label: "Therapies" },
  { href: "/behaviors", label: "Behaviors & Triggers" },
  { href: "/news", label: "Latest News" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-teal-700">
          ASD Guide
        </Link>
        <ul className="flex flex-wrap gap-4 text-sm font-medium">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  pathname === item.href
                    ? "text-teal-700 underline underline-offset-4"
                    : "text-slate-600 hover:text-teal-700"
                }
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Write `src/components/Footer.tsx`**

```tsx
export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-2 px-4 py-8 text-sm text-slate-500">
        <p>
          ASD Guide is an independent aggregation platform. Content is sourced
          from public websites, research, and community discussion, and
          remains the property of its original authors or publishers. We do
          not verify, endorse, or take responsibility for the accuracy of
          aggregated content.
        </p>
        <p>
          Nothing on this site is medical advice. Always consult a qualified
          healthcare professional before starting or changing any therapy.
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Write the failing test for `DisclaimerBanner`**

`src/components/DisclaimerBanner.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import DisclaimerBanner from "./DisclaimerBanner";

describe("DisclaimerBanner", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the banner on first visit", () => {
    render(<DisclaimerBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("hides the banner after dismiss is clicked and remembers it", async () => {
    const user = userEvent.setup();
    render(<DisclaimerBanner />);
    await user.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(localStorage.getItem("asd-guide-disclaimer-dismissed")).toBe("true");
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- DisclaimerBanner.test.tsx`
Expected: FAIL — `DisclaimerBanner` module not found.

- [ ] **Step 5: Write `src/components/DisclaimerBanner.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "asd-guide-disclaimer-dismissed";

export default function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  if (dismissed) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-4 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900"
    >
      <span>
        This site aggregates publicly available information for general
        awareness only. It is not medical advice — always consult a
        qualified professional.
      </span>
      <button
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, "true");
          setDismissed(true);
        }}
        className="shrink-0 font-semibold underline"
        aria-label="Dismiss disclaimer"
      >
        Dismiss
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- DisclaimerBanner.test.tsx`
Expected: both tests PASS.

- [ ] **Step 7: Write `src/components/Transition.tsx`**

```tsx
"use client";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Transition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 8: Wire it all into `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import Transition from "@/components/Transition";

export const metadata: Metadata = {
  title: "ASD Guide",
  description: "A parent- and therapist-friendly guide to autism therapies, behaviors, and research from around the world.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <DisclaimerBanner />
        <Header />
        <Transition>{children}</Transition>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 9: Verify the app builds and runs**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 10: Commit**

```bash
git add src/components src/app/layout.tsx
git commit -m "feat: add shared header, footer, disclaimer banner, and page transitions"
```

---

## Task 4: Shared Content-Display Components

**Files:**
- Create: `src/components/EvidenceTag.tsx`, `src/components/SourceAttribution.tsx`, `src/components/TherapyCard.tsx`, `src/components/BehaviorCard.tsx`, `src/components/NewsItemCard.tsx`, `src/components/SearchFilterBar.tsx`
- Create: `src/components/EvidenceTag.test.tsx`, `src/components/SourceAttribution.test.tsx`

**Interfaces:**
- Consumes: `Therapy`, `Behavior`, `NewsItem`, `EvidenceLevel`, `SourceLink` from `src/lib/schema.ts`.
- Produces: `<EvidenceTag level={...} />`, `<SourceAttribution sources={...} />`, `<TherapyCard therapy={...} />`, `<BehaviorCard behavior={...} />`, `<NewsItemCard item={...} />`, `<SearchFilterBar query onQueryChange evidenceLevel onEvidenceLevelChange />` — consumed by Tasks 5–9.

- [ ] **Step 1: Write the failing test for `EvidenceTag`**

`src/components/EvidenceTag.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import EvidenceTag from "./EvidenceTag";

describe("EvidenceTag", () => {
  it.each([
    ["clinical", "Clinical / Peer-Reviewed"],
    ["emerging", "Emerging Evidence"],
    ["anecdotal", "Anecdotal / Community-Sourced"],
  ] as const)("renders the label for %s", (level, label) => {
    render(<EvidenceTag level={level} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- EvidenceTag.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/components/EvidenceTag.tsx`**

```tsx
import { EvidenceLevel } from "@/lib/schema";

const STYLES: Record<EvidenceLevel, string> = {
  clinical: "bg-emerald-100 text-emerald-800",
  emerging: "bg-sky-100 text-sky-800",
  anecdotal: "bg-amber-100 text-amber-800",
};

const LABELS: Record<EvidenceLevel, string> = {
  clinical: "Clinical / Peer-Reviewed",
  emerging: "Emerging Evidence",
  anecdotal: "Anecdotal / Community-Sourced",
};

export default function EvidenceTag({ level }: { level: EvidenceLevel }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STYLES[level]}`}>
      {LABELS[level]}
    </span>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- EvidenceTag.test.tsx`
Expected: all 3 cases PASS.

- [ ] **Step 5: Write the failing test for `SourceAttribution`**

`src/components/SourceAttribution.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import SourceAttribution from "./SourceAttribution";

describe("SourceAttribution", () => {
  it("renders a link per source with the correct href", () => {
    render(
      <SourceAttribution
        sources={[
          { label: "Source A", url: "https://a.example.org" },
          { label: "Source B", url: "https://b.example.org" },
        ]}
      />
    );
    expect(screen.getByRole("link", { name: "Source A" })).toHaveAttribute("href", "https://a.example.org");
    expect(screen.getByRole("link", { name: "Source B" })).toHaveAttribute("href", "https://b.example.org");
  });

  it("renders nothing for an empty source list", () => {
    const { container } = render(<SourceAttribution sources={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- SourceAttribution.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 7: Write `src/components/SourceAttribution.tsx`**

```tsx
import { SourceLink } from "@/lib/schema";

export default function SourceAttribution({ sources }: { sources: SourceLink[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="text-sm text-slate-500">
      <span className="font-medium">Sources: </span>
      {sources.map((s, i) => (
        <span key={s.url}>
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-teal-700">
            {s.label}
          </a>
          {i < sources.length - 1 ? ", " : ""}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- SourceAttribution.test.tsx`
Expected: both tests PASS.

- [ ] **Step 9: Write `src/components/TherapyCard.tsx`**

```tsx
import Link from "next/link";
import Image from "next/image";
import { Therapy } from "@/lib/schema";
import EvidenceTag from "./EvidenceTag";

export default function TherapyCard({ therapy }: { therapy: Therapy }) {
  return (
    <Link
      href={`/therapies/${therapy.slug}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative mb-3 h-36 w-full overflow-hidden rounded-lg bg-slate-100">
        <Image src={`/images/${therapy.image}`} alt={therapy.name} fill className="object-cover" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800">{therapy.name}</h3>
      <p className="mt-1 text-sm text-slate-600">{therapy.summary}</p>
      <div className="mt-3">
        <EvidenceTag level={therapy.evidenceLevel} />
      </div>
    </Link>
  );
}
```

- [ ] **Step 10: Write `src/components/BehaviorCard.tsx`**

```tsx
import Link from "next/link";
import { Behavior } from "@/lib/schema";

export default function BehaviorCard({ behavior }: { behavior: Behavior }) {
  return (
    <Link
      href={`/behaviors/${behavior.slug}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <h3 className="text-lg font-semibold text-slate-800">{behavior.name}</h3>
      <p className="mt-1 text-sm text-slate-600">{behavior.summary}</p>
      <p className="mt-3 text-xs text-slate-400">{behavior.triggers.length} known triggers</p>
    </Link>
  );
}
```

- [ ] **Step 11: Write `src/components/NewsItemCard.tsx`**

```tsx
import { NewsItem } from "@/lib/schema";
import SourceAttribution from "./SourceAttribution";

export default function NewsItemCard({ item }: { item: NewsItem }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-400">
        {new Date(item.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
        {item.region ? ` · ${item.region}` : ""}
      </p>
      <h3 className="mt-1 text-lg font-semibold text-slate-800">{item.title}</h3>
      <p className="mt-2 text-sm text-slate-600">{item.summary}</p>
      <div className="mt-3">
        <SourceAttribution sources={item.sources} />
      </div>
    </article>
  );
}
```

- [ ] **Step 12: Write `src/components/SearchFilterBar.tsx`**

```tsx
"use client";

interface Props {
  query: string;
  onQueryChange: (value: string) => void;
  evidenceLevel?: string;
  onEvidenceLevelChange?: (value: string) => void;
}

export default function SearchFilterBar({ query, onQueryChange, evidenceLevel, onEvidenceLevelChange }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search..."
        aria-label="Search"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:w-64"
      />
      {onEvidenceLevelChange && (
        <select
          value={evidenceLevel}
          onChange={(e) => onEvidenceLevelChange(e.target.value)}
          aria-label="Filter by evidence level"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All evidence levels</option>
          <option value="clinical">Clinical / Peer-Reviewed</option>
          <option value="emerging">Emerging Evidence</option>
          <option value="anecdotal">Anecdotal / Community-Sourced</option>
        </select>
      )}
    </div>
  );
}
```

- [ ] **Step 13: Verify the app builds**

Run: `npm run build`
Expected: build succeeds (these components aren't wired into any page yet, so this just checks for syntax/type errors).

- [ ] **Step 14: Commit**

```bash
git add src/components
git commit -m "feat: add evidence tag, source attribution, and content card components"
```

---

## Task 5: Home Page

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `getTherapies()`, `getNews()` from `src/lib/content.ts`; `<TherapyCard>`, `<NewsItemCard>` from Task 4.

- [ ] **Step 1: Write `src/app/page.tsx`**

```tsx
import Link from "next/link";
import { getTherapies, getNews } from "@/lib/content";
import TherapyCard from "@/components/TherapyCard";
import NewsItemCard from "@/components/NewsItemCard";

export default function HomePage() {
  const featuredTherapies = getTherapies().slice(0, 3);
  const latestNews = getNews().slice(0, 2);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <section className="text-center">
        <h1 className="text-4xl font-extrabold text-slate-800 sm:text-5xl">
          One place to explore autism therapies from around the world
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          ASD Guide gathers therapies, behavior insights, and the latest
          research into one searchable resource for parents and therapists —
          always linked back to where it came from.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link href="/therapies" className="rounded-lg bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-700">
            Browse Therapies
          </Link>
          <Link href="/behaviors" className="rounded-lg border border-teal-600 px-5 py-2.5 font-semibold text-teal-700 hover:bg-teal-50">
            Behaviors & Triggers
          </Link>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Featured Therapies</h2>
          <Link href="/therapies" className="text-sm font-medium text-teal-700 hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {featuredTherapies.map((t) => (
            <TherapyCard key={t.slug} therapy={t} />
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Latest News</h2>
          <Link href="/news" className="text-sm font-medium text-teal-700 hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-6 space-y-6">
          {latestNews.map((n) => (
            <NewsItemCard key={n.slug} item={n} />
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Verify the app builds**

Run: `npm run build`
Expected: build succeeds; the `maps-medical-model.jpg` image referenced won't exist yet (that's Task 12) — `next/image` will 404 the image at runtime but the build itself must still succeed. Confirm with `npm run build` exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: build home page with featured therapies and latest news"
```

---

## Task 6: Therapies Content Data (remaining entries)

**Files:**
- Create 12 more files under `content/therapies/`: `functional-medicine.json`, `stem-cell-therapy.json`, `mert.json`, `speech-language-therapy.json`, `occupational-therapy.json`, `physical-therapy.json`, `music-therapy.json`, `sound-therapy.json`, `brain-balance.json`, `photobiomodulation.json`, `fmt.json`, `lyme-protocols.json`
- Modify: `content/credits.json` is NOT touched here (images are Task 12) — reference `image` filenames now so Task 12 knows what to fetch.
- Create: `src/lib/content-therapies.test.ts`

**Interfaces:**
- Consumes: `therapySchema` from `src/lib/schema.ts`.
- Produces: 13 total therapy entries (12 new + the 1 from Task 2), each satisfying `therapySchema`. Task 8 (therapy pages) and Task 12 (images) depend on this full set existing with correct `image` filenames.

- [ ] **Step 1: For each topic below, write one JSON file following the exact structure and depth of `content/therapies/maps-medical-model.json`** (what it is, claimed benefits, evidence notes stated cautiously, regions, 2–4 real attributed sources, `image` filename, `sourceType: "seed"`, `updatedAt: "2026-07-05"`). Use WebSearch to find 2–4 current, reputable sources per topic (major health orgs, hospital/clinic pages, PubMed/NIH, or well-known autism advocacy sites) — do not invent URLs. Phrase claims cautiously ("proponents report...", "evidence is limited/mixed...") given several of these are unproven or controversial:

  - `functional-medicine.json` (slug `functional-medicine`) — category "Biomedical & Medical", `image: "functional-medicine.jpg"`, `evidenceLevel: "anecdotal"`
  - `stem-cell-therapy.json` (slug `stem-cell-therapy`) — category "Biomedical & Medical", `image: "stem-cell-therapy.jpg"`, `evidenceLevel: "anecdotal"` — evidence notes must clearly flag this as unproven/experimental for autism and note real safety risks of unregulated clinics
  - `mert.json` (slug `mert`, name "MERT (Magnetic e-Resonance Therapy)") — category "Biomedical & Medical", `image: "mert.jpg"`, `evidenceLevel: "anecdotal"`
  - `speech-language-therapy.json` (slug `speech-language-therapy`) — category "Communication & Behavioral", `image: "speech-language-therapy.jpg"`, `evidenceLevel: "clinical"`
  - `occupational-therapy.json` (slug `occupational-therapy`) — category "Sensory & Movement", `image: "occupational-therapy.jpg"`, `evidenceLevel: "clinical"`
  - `physical-therapy.json` (slug `physical-therapy`) — category "Sensory & Movement", `image: "physical-therapy.jpg"`, `evidenceLevel: "clinical"`
  - `music-therapy.json` (slug `music-therapy`) — category "Sensory & Movement", `image: "music-therapy.jpg"`, `evidenceLevel: "emerging"`
  - `sound-therapy.json` (slug `sound-therapy`, e.g. Tomatis/Auditory Integration Training) — category "Sensory & Movement", `image: "sound-therapy.jpg"`, `evidenceLevel: "anecdotal"`
  - `brain-balance.json` (slug `brain-balance`) — category "Alternative & Emerging", `image: "brain-balance.jpg"`, `evidenceLevel: "anecdotal"`
  - `photobiomodulation.json` (slug `photobiomodulation`, name "Infrared Light / Photobiomodulation Therapy") — category "Alternative & Emerging", `image: "photobiomodulation.jpg"`, `evidenceLevel: "emerging"`
  - `fmt.json` (slug `fmt`, name "Fecal Microbiota Transplant (FMT)") — category "Biomedical & Medical", `image: "fmt.jpg"`, `evidenceLevel: "emerging"` — note this is experimental/investigational for autism and not FDA-approved for this use
  - `lyme-protocols.json` (slug `lyme-protocols`, name "Lyme & Co-Infection Protocols") — category "Biomedical & Medical", `image: "lyme-protocols.jpg"`, `evidenceLevel: "anecdotal"` — note controversy around "chronic Lyme" diagnoses in children without confirmed infection

- [ ] **Step 2: Verify each source URL is real**

For every source URL added, run: `curl -sI -o /dev/null -w "%{http_code}\n" "<url>"` and confirm it returns `200`, `301`, or `302`. Replace any URL that fails with a real alternative found via WebSearch.

- [ ] **Step 3: Write `src/lib/content-therapies.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { getTherapies } from "./content";

describe("therapies content", () => {
  it("has at least 12 therapy entries", () => {
    expect(getTherapies().length).toBeGreaterThanOrEqual(12);
  });

  it("has unique slugs", () => {
    const slugs = getTherapies().map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every entry has at least 2 sources", () => {
    for (const t of getTherapies()) {
      expect(t.sources.length).toBeGreaterThanOrEqual(2);
    }
  });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- content-therapies.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add content/therapies src/lib/content-therapies.test.ts
git commit -m "content: add remaining therapy entries"
```

---

## Task 7: Therapies Pages (list + detail)

**Files:**
- Create: `src/app/therapies/page.tsx`, `src/app/therapies/TherapiesExplorer.tsx`, `src/app/therapies/[slug]/page.tsx`
- Create: `src/app/therapies/TherapiesExplorer.test.tsx`

**Interfaces:**
- Consumes: `getTherapies()`, `getTherapyBySlug()` from `src/lib/content.ts`; `filterTherapies()` from `src/lib/filter.ts`; `<TherapyCard>`, `<SearchFilterBar>`, `<EvidenceTag>`, `<SourceAttribution>` from Task 4.

- [ ] **Step 1: Write the failing test for `TherapiesExplorer`**

`src/app/therapies/TherapiesExplorer.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import TherapiesExplorer from "./TherapiesExplorer";
import { Therapy } from "@/lib/schema";

const makeTherapy = (overrides: Partial<Therapy>): Therapy => ({
  slug: "t",
  name: "Speech Therapy",
  category: "Communication",
  summary: "Helps with communication",
  description: "desc",
  claimedBenefits: ["benefit"],
  evidenceNotes: "notes",
  evidenceLevel: "clinical",
  regions: ["Global"],
  sources: [{ label: "Source", url: "https://example.org" }],
  image: "img.jpg",
  sourceType: "seed",
  updatedAt: "2026-01-01",
  ...overrides,
});

describe("TherapiesExplorer", () => {
  it("filters visible cards as the user types", async () => {
    const user = userEvent.setup();
    const therapies = [
      makeTherapy({ slug: "speech", name: "Speech Therapy" }),
      makeTherapy({ slug: "music", name: "Music Therapy" }),
    ];
    render(<TherapiesExplorer therapies={therapies} />);
    expect(screen.getAllByRole("link")).toHaveLength(2);

    await user.type(screen.getByLabelText("Search"), "speech");
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByText("Speech Therapy")).toBeInTheDocument();
  });

  it("shows a no-results message when nothing matches", async () => {
    const user = userEvent.setup();
    render(<TherapiesExplorer therapies={[makeTherapy({})]} />);
    await user.type(screen.getByLabelText("Search"), "nonexistent");
    expect(screen.getByText(/no therapies match/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- TherapiesExplorer.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/app/therapies/TherapiesExplorer.tsx`**

```tsx
"use client";
import { useMemo, useState } from "react";
import { Therapy, EvidenceLevel } from "@/lib/schema";
import { filterTherapies } from "@/lib/filter";
import SearchFilterBar from "@/components/SearchFilterBar";
import TherapyCard from "@/components/TherapyCard";

export default function TherapiesExplorer({ therapies }: { therapies: Therapy[] }) {
  const [query, setQuery] = useState("");
  const [evidenceLevel, setEvidenceLevel] = useState("");

  const filtered = useMemo(
    () =>
      filterTherapies(
        therapies,
        query,
        evidenceLevel === "" ? undefined : (evidenceLevel as EvidenceLevel)
      ),
    [therapies, query, evidenceLevel]
  );

  return (
    <div className="mt-8">
      <SearchFilterBar
        query={query}
        onQueryChange={setQuery}
        evidenceLevel={evidenceLevel}
        onEvidenceLevelChange={setEvidenceLevel}
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <TherapyCard key={t.slug} therapy={t} />
        ))}
      </div>
      {filtered.length === 0 && <p className="text-slate-500">No therapies match your search.</p>}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- TherapiesExplorer.test.tsx`
Expected: both tests PASS.

- [ ] **Step 5: Write `src/app/therapies/page.tsx`**

```tsx
import { getTherapies } from "@/lib/content";
import TherapiesExplorer from "./TherapiesExplorer";

export default function TherapiesPage() {
  const therapies = getTherapies();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800">Therapies & Interventions</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        A directory of therapies and interventions used around the world,
        aggregated from public sources with links back to the originals.
      </p>
      <TherapiesExplorer therapies={therapies} />
    </main>
  );
}
```

- [ ] **Step 6: Write `src/app/therapies/[slug]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTherapies, getTherapyBySlug } from "@/lib/content";
import EvidenceTag from "@/components/EvidenceTag";
import SourceAttribution from "@/components/SourceAttribution";

export function generateStaticParams() {
  return getTherapies().map((t) => ({ slug: t.slug }));
}

export default function TherapyDetailPage({ params }: { params: { slug: string } }) {
  const therapy = getTherapyBySlug(params.slug);
  if (!therapy) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="relative mb-6 h-64 w-full overflow-hidden rounded-xl bg-slate-100">
        <Image src={`/images/${therapy.image}`} alt={therapy.name} fill className="object-cover" />
      </div>
      <div className="mb-2 flex items-center gap-3">
        <h1 className="text-3xl font-bold text-slate-800">{therapy.name}</h1>
        <EvidenceTag level={therapy.evidenceLevel} />
      </div>
      <p className="text-slate-600">{therapy.summary}</p>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-slate-800">Overview</h2>
        <p className="mt-2 whitespace-pre-line text-slate-700">{therapy.description}</p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-slate-800">Claimed Benefits</h2>
        <ul className="mt-2 list-disc pl-5 text-slate-700">
          {therapy.claimedBenefits.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-slate-800">Evidence Notes</h2>
        <p className="mt-2 text-slate-700">{therapy.evidenceNotes}</p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-slate-800">Where It's Offered</h2>
        <p className="mt-2 text-slate-700">{therapy.regions.join(", ")}</p>
      </section>

      <section className="mt-8 border-t border-slate-200 pt-4">
        <SourceAttribution sources={therapy.sources} />
      </section>
    </main>
  );
}
```

- [ ] **Step 7: Verify the app builds**

Run: `npm run build`
Expected: build succeeds and prints a static path per therapy slug under `/therapies/[slug]`.

- [ ] **Step 8: Commit**

```bash
git add src/app/therapies
git commit -m "feat: add therapies list and detail pages with search/filter"
```

---

## Task 8: Behaviors & Triggers Content Data (remaining entries)

**Files:**
- Create 11 more files under `content/behaviors/`: `stimming.json`, `sensory-overload.json`, `elopement.json`, `food-selectivity.json`, `sleep-disturbances.json`, `aggression.json`, `self-injurious-behavior.json`, `echolalia.json`, `social-withdrawal.json`, `transition-difficulty.json`, `restricted-interests.json`
- Create: `src/lib/content-behaviors.test.ts`

**Interfaces:**
- Consumes: `behaviorSchema` from `src/lib/schema.ts`.
- Produces: 12 total behavior entries (11 new + the 1 from Task 2). Task 9 (behavior pages) depends on this set.

- [ ] **Step 1: For each topic below, write one JSON file following the exact structure and depth of `content/behaviors/meltdowns.json`** (summary, 3–5 triggers, 2–4 remedies each tagged with its own `evidenceLevel`, 2+ attributed sources, `sourceType: "seed"`, `updatedAt: "2026-07-05"`). Use WebSearch for real sources (autism advocacy orgs, OT/SLP clinical resources, or clearly-labeled community discussion like r/autism, r/Autism_Parenting). Frame all remedies as things some families/professionals report, not guarantees:

  - `stimming.json` (slug `stimming`)
  - `sensory-overload.json` (slug `sensory-overload`)
  - `elopement.json` (slug `elopement`, i.e. wandering/running off)
  - `food-selectivity.json` (slug `food-selectivity`, i.e. picky eating)
  - `sleep-disturbances.json` (slug `sleep-disturbances`)
  - `aggression.json` (slug `aggression`)
  - `self-injurious-behavior.json` (slug `self-injurious-behavior`)
  - `echolalia.json` (slug `echolalia`)
  - `social-withdrawal.json` (slug `social-withdrawal`)
  - `transition-difficulty.json` (slug `transition-difficulty`)
  - `restricted-interests.json` (slug `restricted-interests`, i.e. intense/narrow interests)

- [ ] **Step 2: Verify each source URL is real**

Same as Task 6 Step 2 — `curl -sI` each URL, confirm `200`/`301`/`302`, replace failures.

- [ ] **Step 3: Write `src/lib/content-behaviors.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { getBehaviors } from "./content";

describe("behaviors content", () => {
  it("has at least 10 behavior entries", () => {
    expect(getBehaviors().length).toBeGreaterThanOrEqual(10);
  });

  it("has unique slugs", () => {
    const slugs = getBehaviors().map((b) => b.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every entry has at least 3 triggers and 2 remedies", () => {
    for (const b of getBehaviors()) {
      expect(b.triggers.length).toBeGreaterThanOrEqual(3);
      expect(b.remedies.length).toBeGreaterThanOrEqual(2);
    }
  });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- content-behaviors.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add content/behaviors src/lib/content-behaviors.test.ts
git commit -m "content: add remaining behavior entries"
```

---

## Task 9: Behaviors & Triggers Pages (list + detail)

**Files:**
- Create: `src/app/behaviors/page.tsx`, `src/app/behaviors/BehaviorsExplorer.tsx`, `src/app/behaviors/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getBehaviors()`, `getBehaviorBySlug()` from `src/lib/content.ts`; `filterBehaviors()` from `src/lib/filter.ts`; `<BehaviorCard>`, `<SearchFilterBar>`, `<EvidenceTag>`, `<SourceAttribution>` from Task 4.

- [ ] **Step 1: Write `src/app/behaviors/BehaviorsExplorer.tsx`**

```tsx
"use client";
import { useMemo, useState } from "react";
import { Behavior } from "@/lib/schema";
import { filterBehaviors } from "@/lib/filter";
import SearchFilterBar from "@/components/SearchFilterBar";
import BehaviorCard from "@/components/BehaviorCard";

export default function BehaviorsExplorer({ behaviors }: { behaviors: Behavior[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => filterBehaviors(behaviors, query), [behaviors, query]);

  return (
    <div className="mt-8">
      <SearchFilterBar query={query} onQueryChange={setQuery} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((b) => (
          <BehaviorCard key={b.slug} behavior={b} />
        ))}
      </div>
      {filtered.length === 0 && <p className="text-slate-500">No behaviors match your search.</p>}
    </div>
  );
}
```

- [ ] **Step 2: Write `src/app/behaviors/page.tsx`**

```tsx
import { getBehaviors } from "@/lib/content";
import BehaviorsExplorer from "./BehaviorsExplorer";

export default function BehaviorsPage() {
  const behaviors = getBehaviors();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800">Behaviors & Triggers</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        Common behaviors, their possible triggers, and home remedies/coping
        strategies reported by parents and professionals. This information is
        sourced from multiple channels and is not a substitute for
        professional guidance.
      </p>
      <BehaviorsExplorer behaviors={behaviors} />
    </main>
  );
}
```

- [ ] **Step 3: Write `src/app/behaviors/[slug]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getBehaviors, getBehaviorBySlug } from "@/lib/content";
import EvidenceTag from "@/components/EvidenceTag";
import SourceAttribution from "@/components/SourceAttribution";

export function generateStaticParams() {
  return getBehaviors().map((b) => ({ slug: b.slug }));
}

export default function BehaviorDetailPage({ params }: { params: { slug: string } }) {
  const behavior = getBehaviorBySlug(params.slug);
  if (!behavior) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800">{behavior.name}</h1>
      <p className="mt-2 text-slate-600">{behavior.summary}</p>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-slate-800">Possible Triggers</h2>
        <ul className="mt-2 list-disc pl-5 text-slate-700">
          {behavior.triggers.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-slate-800">Home Remedies & Coping Strategies</h2>
        <ul className="mt-3 space-y-3">
          {behavior.remedies.map((r) => (
            <li key={r.text} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3">
              <span className="text-slate-700">{r.text}</span>
              <EvidenceTag level={r.evidenceLevel} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 border-t border-slate-200 pt-4">
        <SourceAttribution sources={behavior.sources} />
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Verify the app builds**

Run: `npm run build`
Expected: build succeeds and prints a static path per behavior slug under `/behaviors/[slug]`.

- [ ] **Step 5: Commit**

```bash
git add src/app/behaviors
git commit -m "feat: add behaviors & triggers list and detail pages"
```

---

## Task 10: Latest News (remaining content + page)

**Files:**
- Create 7 more files under `content/news/`: `mert-clinic-expansion.json`, `photobiomodulation-research.json`, `telehealth-speech-therapy-access.json`, `early-screening-tools.json`, `sensory-friendly-spaces-initiative.json`, `music-therapy-school-programs.json`, `autism-research-funding-update.json`
- Create: `src/app/news/page.tsx`
- Create: `src/lib/content-news.test.ts`

**Interfaces:**
- Consumes: `getNews()` from `src/lib/content.ts`; `<NewsItemCard>` from Task 4.

- [ ] **Step 1: For each topic below, write one JSON file following the exact structure of `content/news/gut-microbiome-research-trend.json`** (title, summary framed as a general/ongoing trend rather than a specific unverifiable claim, `date` between 2026-01-01 and 2026-07-01, 1–2 real attributed sources from major, well-known institutions, `sourceType: "seed"`). Use WebSearch to ground each item in a real, verifiable trend — do not fabricate specific studies, statistics, or events:

  - `mert-clinic-expansion.json` — general trend of MERT clinics expanding availability internationally
  - `photobiomodulation-research.json` — growing academic interest in light-based/photobiomodulation therapy research
  - `telehealth-speech-therapy-access.json` — expansion of telehealth options for speech-language therapy access
  - `early-screening-tools.json` — ongoing development of earlier autism screening tools/guidelines
  - `sensory-friendly-spaces-initiative.json` — growth of sensory-friendly public spaces/events initiatives
  - `music-therapy-school-programs.json` — adoption of music therapy programs in schools
  - `autism-research-funding-update.json` — general autism research funding landscape update

- [ ] **Step 2: Verify each source URL is real**

Same as Task 6 Step 2.

- [ ] **Step 3: Write `src/app/news/page.tsx`**

```tsx
import { getNews } from "@/lib/content";
import NewsItemCard from "@/components/NewsItemCard";

export default function NewsPage() {
  const news = getNews();
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800">Latest News</h1>
      <p className="mt-2 text-slate-600">
        Recent developments in autism therapies and research from around the world.
      </p>
      <div className="mt-8 space-y-6">
        {news.map((item) => (
          <NewsItemCard key={item.slug} item={item} />
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Write `src/lib/content-news.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { getNews } from "./content";

describe("news content", () => {
  it("has at least 5 news entries", () => {
    expect(getNews().length).toBeGreaterThanOrEqual(5);
  });

  it("has unique slugs", () => {
    const slugs = getNews().map((n) => n.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- content-news.test.ts`
Expected: all tests PASS.

- [ ] **Step 6: Verify the app builds**

Run: `npm run build`
Expected: build succeeds, `/news` route present.

- [ ] **Step 7: Commit**

```bash
git add content/news src/app/news src/lib/content-news.test.ts
git commit -m "feat: add latest news content and page"
```

---

## Task 11: Resources (remaining content + page)

**Files:**
- Create 5 more files under `content/resources/`: `understanding-evidence-levels.json`, `talking-to-your-pediatrician.json`, `sensory-friendly-home-tips.json`, `navigating-early-intervention.json`, `finding-a-qualified-therapist.json`
- Create: `src/app/resources/page.tsx`

**Interfaces:**
- Consumes: `getResources()` from `src/lib/content.ts`.

- [ ] **Step 1: For each topic below, write one JSON file following the exact structure of `content/resources/glossary-of-terms.json`** (title, category, a body of 150–300 words in plain, parent-friendly language):

  - `understanding-evidence-levels.json` — explains what "Clinical", "Emerging", and "Anecdotal" mean on this site and how to weigh them
  - `talking-to-your-pediatrician.json` — practical tips for discussing therapies (especially biomedical ones) with a child's regular doctor
  - `sensory-friendly-home-tips.json` — general tips for making a home environment more sensory-friendly
  - `navigating-early-intervention.json` — overview of how early intervention systems generally work
  - `finding-a-qualified-therapist.json` — what credentials/questions to look for when choosing an OT/SLP/PT

- [ ] **Step 2: Write `src/app/resources/page.tsx`**

```tsx
import { getResources } from "@/lib/content";

export default function ResourcesPage() {
  const resources = getResources();
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800">Resources</h1>
      <p className="mt-2 text-slate-600">
        Evergreen guides and reference material to help you navigate autism therapies.
      </p>
      <div className="mt-8 space-y-8">
        {resources.map((r) => (
          <article key={r.slug} id={r.slug}>
            <p className="text-xs uppercase tracking-wide text-slate-400">{r.category}</p>
            <h2 className="text-xl font-semibold text-slate-800">{r.title}</h2>
            <p className="mt-2 whitespace-pre-line text-slate-700">{r.body}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify the app builds**

Run: `npm run build`
Expected: build succeeds, `/resources` route present.

- [ ] **Step 4: Commit**

```bash
git add content/resources src/app/resources
git commit -m "feat: add resources content and page"
```

---

## Task 12: About & Disclaimer Page

**Files:**
- Create: `src/app/about/page.tsx`

**Interfaces:**
- Consumes: none (static content).

- [ ] **Step 1: Write `src/app/about/page.tsx`**

```tsx
export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 text-slate-700">
      <h1 className="text-3xl font-bold text-slate-800">About ASD Guide</h1>
      <p>
        ASD Guide is an independent, informational platform built to help
        parents and therapists discover the wide range of therapies and
        approaches used for autism spectrum disorder around the world — from
        long-established interventions like speech and occupational therapy
        to emerging and controversial approaches like stem cell therapy or
        MERT. It also collects common behaviors, their possible triggers, and
        home remedies or coping strategies reported by parents and
        professionals.
      </p>
      <div>
        <h2 className="text-xl font-semibold text-slate-800">What this site is</h2>
        <p className="mt-2">
          A single place to see what's out there — organized, searchable,
          and always linked back to where the information originally came
          from, so you can dig deeper or verify it yourself.
        </p>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-slate-800">What this site is not</h2>
        <p className="mt-2">
          This site is not a medical provider and does not offer medical
          advice, diagnosis, or treatment. Content is aggregated from public
          sources — websites, published research, and online community
          discussion — and remains the property of its original authors or
          publishers. Inclusion of a therapy or remedy here is not an
          endorsement of its safety or effectiveness. Some content
          (particularly behaviors and home remedies) is anecdotal, sourced
          from parent/community discussion, and has not been clinically
          studied.
        </p>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Disclaimer</h2>
        <p className="mt-2">
          We do not own, verify, or take responsibility for the accuracy of
          aggregated content. Always consult a qualified healthcare
          professional before starting, stopping, or changing any therapy —
          especially biomedical or experimental approaches.
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify the app builds**

Run: `npm run build`
Expected: build succeeds, `/about` route present.

- [ ] **Step 3: Commit**

```bash
git add src/app/about
git commit -m "feat: add about & disclaimer page"
```

---

## Task 13: Images & Credits

**Files:**
- Create: `public/images/*.jpg` (13 files, one per therapy slug from Tasks 2 & 6)
- Create: `content/credits.json`
- Create: `src/lib/images.test.ts`

**Interfaces:**
- Consumes: `getTherapies()` from `src/lib/content.ts`.
- Produces: every `image` filename referenced by a therapy entry exists on disk and has a matching credit.

- [ ] **Step 1: Source one CC0/open-license image per therapy**

For each of the 13 therapy slugs, use WebSearch to find a relevant, freely-licensed image on Wikimedia Commons, Unsplash, or Pexels (CC0 or CC-BY). Download it:

```bash
curl -L "<direct-image-url>" -o "public/images/<slug>.jpg"
```

Verify each download succeeded and is a valid image:

```bash
file public/images/<slug>.jpg
```

Expected: output identifies it as a JPEG/PNG image, not an HTML error page.

- [ ] **Step 2: Write `content/credits.json`**

```json
[
  { "filename": "maps-medical-model.jpg", "source": "Wikimedia Commons", "author": "AUTHOR", "license": "CC BY-SA 4.0", "url": "SOURCE_URL" }
]
```

Add one entry per image, filling in the real author/license/URL recorded while sourcing it in Step 1.

- [ ] **Step 3: Write `src/lib/images.test.ts`**

```typescript
import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { getTherapies } from "./content";

describe("images", () => {
  it("every therapy image file exists in public/images", () => {
    for (const t of getTherapies()) {
      const imgPath = path.join(process.cwd(), "public", "images", t.image);
      expect(fs.existsSync(imgPath)).toBe(true);
    }
  });

  it("every therapy image has a matching credits.json entry", () => {
    const credits: { filename: string }[] = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "content", "credits.json"), "utf-8")
    );
    const creditedFiles = new Set(credits.map((c) => c.filename));
    for (const t of getTherapies()) {
      expect(creditedFiles.has(t.image)).toBe(true);
    }
  });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- images.test.ts`
Expected: both tests PASS.

- [ ] **Step 5: Verify the app builds and images render**

Run: `npm run build && npm run dev`, then visit `http://localhost:3000/therapies` in a browser and confirm images load (not broken-image icons).

- [ ] **Step 6: Commit**

```bash
git add public/images content/credits.json src/lib/images.test.ts
git commit -m "feat: add licensed images and credits for all therapies"
```

---

## Task 14: Phase 2 Scraper Script

**Files:**
- Create: `scripts/dedupe.ts`, `scripts/dedupe.test.ts`, `scripts/writeContent.ts`, `scripts/scrapers/reddit.ts`, `scripts/scrapers/websites.ts`, `scripts/scrape.ts`
- Create: `.env.example`
- Modify: `README.md` (document required env vars)

**Interfaces:**
- Produces: `dedupe(existingUrls: Set<string>, items: T[]): T[]` (pure, tested); `writeScrapedNewsItem(item: NewsItem): void` (writes to `content/news/`); a runnable `npm run scrape` entry point.

- [ ] **Step 1: Write the failing test for dedupe**

`scripts/dedupe.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { dedupe } from "./dedupe";

interface Item {
  sourceUrl: string;
  title: string;
}

describe("dedupe", () => {
  it("removes items whose sourceUrl already exists", () => {
    const existing = new Set(["https://a.com/1"]);
    const items: Item[] = [
      { sourceUrl: "https://a.com/1", title: "old" },
      { sourceUrl: "https://a.com/2", title: "new" },
    ];
    expect(dedupe(existing, items)).toEqual([{ sourceUrl: "https://a.com/2", title: "new" }]);
  });

  it("removes duplicates within the same batch, keeping the first", () => {
    const items: Item[] = [
      { sourceUrl: "https://a.com/2", title: "first" },
      { sourceUrl: "https://a.com/2", title: "duplicate" },
    ];
    expect(dedupe(new Set(), items)).toEqual([{ sourceUrl: "https://a.com/2", title: "first" }]);
  });

  it("returns an empty array when everything is a duplicate", () => {
    const existing = new Set(["https://a.com/1"]);
    expect(dedupe(existing, [{ sourceUrl: "https://a.com/1", title: "x" }])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scripts/dedupe.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `scripts/dedupe.ts`**

```typescript
export interface HasSourceUrl {
  sourceUrl: string;
}

export function dedupe<T extends HasSourceUrl>(existingUrls: Set<string>, items: T[]): T[] {
  const seen = new Set(existingUrls);
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.sourceUrl)) continue;
    seen.add(item.sourceUrl);
    result.push(item);
  }
  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- scripts/dedupe.test.ts`
Expected: all 3 tests PASS.

- [ ] **Step 5: Write `scripts/writeContent.ts`**

```typescript
import fs from "fs";
import path from "path";
import { NewsItem } from "../src/lib/schema";

const CONTENT_DIR = path.join(process.cwd(), "content");

export function getExistingNewsUrls(): Set<string> {
  const dir = path.join(CONTENT_DIR, "news");
  if (!fs.existsSync(dir)) return new Set();
  const urls = new Set<string>();
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const item: NewsItem = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
    for (const s of item.sources) urls.add(s.url);
  }
  return urls;
}

export function writeScrapedNewsItem(item: NewsItem): void {
  const dir = path.join(CONTENT_DIR, "news");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${item.slug}.json`), JSON.stringify(item, null, 2));
}
```

- [ ] **Step 6: Write `scripts/scrapers/websites.ts`**

```typescript
import { NewsItem } from "../../src/lib/schema";

interface FeedEntry {
  title: string;
  summary: string;
  link: string;
  isoDate?: string;
}

export function mapFeedEntryToNewsItem(entry: FeedEntry, region?: string): NewsItem {
  const slug = entry.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  return {
    slug,
    title: entry.title,
    summary: entry.summary,
    date: (entry.isoDate ?? new Date().toISOString()).slice(0, 10),
    region,
    sources: [{ label: "Source article", url: entry.link }],
    sourceType: "scraped",
  };
}

export async function fetchWebsiteFeedItems(feedUrl: string): Promise<FeedEntry[]> {
  const res = await fetch(feedUrl);
  if (!res.ok) return [];
  const xml = await res.text();
  const items: FeedEntry[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml))) {
    const block = match[1];
    const title = /<title>([\s\S]*?)<\/title>/.exec(block)?.[1]?.trim() ?? "";
    const link = /<link>([\s\S]*?)<\/link>/.exec(block)?.[1]?.trim() ?? "";
    const summary = /<description>([\s\S]*?)<\/description>/.exec(block)?.[1]?.trim() ?? "";
    const isoDate = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(block)?.[1]?.trim();
    if (title && link) items.push({ title, link, summary, isoDate });
  }
  return items;
}
```

- [ ] **Step 7: Write `scripts/scrapers/reddit.ts`**

```typescript
import { Behavior } from "../../src/lib/schema";

interface RedditPost {
  data: {
    title: string;
    selftext: string;
    permalink: string;
  };
}

interface RedditListing {
  data: { children: RedditPost[] };
}

async function getRedditAccessToken(): Promise<string | null> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "asd-guide-scraper/0.1",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

export async function fetchSubredditTopPosts(subreddit: string, limit = 10): Promise<RedditPost[]> {
  const token = await getRedditAccessToken();
  if (!token) return [];

  const res = await fetch(`https://oauth.reddit.com/r/${subreddit}/top?limit=${limit}&t=month`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "asd-guide-scraper/0.1",
    },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as RedditListing;
  return json.data.children;
}

export function mapRedditPostToRemedyCandidate(post: RedditPost): { text: string; sourceUrl: string } {
  return {
    text: post.data.title,
    sourceUrl: `https://www.reddit.com${post.data.permalink}`,
  };
}
```

- [ ] **Step 8: Write `scripts/scrape.ts`**

```typescript
import { fetchWebsiteFeedItems, mapFeedEntryToNewsItem } from "./scrapers/websites";
import { getExistingNewsUrls, writeScrapedNewsItem } from "./writeContent";
import { dedupe } from "./dedupe";

// Populate with real, verified RSS feed URLs (see Step 8a below) before running.
const NEWS_FEEDS: string[] = [];

async function main() {
  const existingUrls = getExistingNewsUrls();
  let written = 0;

  for (const feedUrl of NEWS_FEEDS) {
    try {
      const entries = await fetchWebsiteFeedItems(feedUrl);
      const asNewsItems = entries.map((e) => mapFeedEntryToNewsItem(e));
      const fresh = dedupe(
        existingUrls,
        asNewsItems.map((n) => ({ ...n, sourceUrl: n.sources[0].url }))
      );
      for (const item of fresh) {
        writeScrapedNewsItem(item);
        written++;
      }
    } catch (err) {
      console.error(`Failed to fetch feed ${feedUrl}:`, err);
    }
  }

  console.log(`Scrape complete: ${written} new item(s) written.`);
}

main();
```

- [ ] **Step 8a: Find and verify real RSS feed URLs, then populate `NEWS_FEEDS`**

Use WebSearch to find 1-3 real, currently-live RSS feeds relevant to autism therapy/research news (e.g. a PubMed saved-search RSS feed created at https://pubmed.ncbi.nlm.nih.gov/, or a major autism research organization's news feed). For each candidate, verify it's a live, well-formed RSS feed before adding it:

```bash
curl -sI -o /dev/null -w "%{http_code}\n" "<feed-url>"
curl -s "<feed-url>" | head -c 500
```

Expected: HTTP `200`, and the body starts with `<?xml` and contains `<rss` or `<feed`. Only add URLs that pass both checks to the `NEWS_FEEDS` array in `scrape.ts`. If none can be verified in this environment (e.g. no network access), leave `NEWS_FEEDS` empty — the script must still run without error and simply write 0 items, per Step 11's test.

- [ ] **Step 9: Write `.env.example`**

```
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
```

- [ ] **Step 10: Add scraper env var docs to `README.md`**

Append this section to `README.md`:

```markdown
## Phase 2 scraper

`npm run scrape` fetches new content and writes it into `content/`, tagged
`sourceType: "scraped"`. Reddit sourcing requires a registered Reddit app:
copy `.env.example` to `.env.local` and fill in `REDDIT_CLIENT_ID` /
`REDDIT_CLIENT_SECRET`. Without them, Reddit sourcing is skipped gracefully.
```

- [ ] **Step 11: Run the full test suite**

Run: `npm test`
Expected: all tests across the project PASS.

- [ ] **Step 12: Commit**

```bash
git add scripts .env.example README.md
git commit -m "feat: add phase 2 scraping script for news and reddit content"
```

---

## Task 15: Final Integration Check

**Files:**
- No new files — verification only.

**Interfaces:**
- Consumes: the full app built across Tasks 1–14.

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests PASS, zero failures.

- [ ] **Step 2: Run a production build**

Run: `npm run build`
Expected: build succeeds; route summary lists `/`, `/therapies`, `/therapies/[slug]`, `/behaviors`, `/behaviors/[slug]`, `/news`, `/resources`, `/about`.

- [ ] **Step 3: Smoke-test navigation locally**

Run: `npm run dev`, then in a browser visit `/`, `/therapies`, click into one therapy detail page, `/behaviors`, click into one behavior detail page, `/news`, `/resources`, `/about`. Confirm: nav highlights the active tab, page transition animates, images load on therapy pages, the disclaimer banner appears once and stays dismissed after clicking Dismiss and reloading.

- [ ] **Step 4: Confirm git state is clean**

Run: `git status`
Expected: working tree clean, all task commits present in `git log --oneline`.

- [ ] **Step 5: Final commit (only if Step 3 required fixes)**

If any fixes were needed during the smoke test, stage and commit them:

```bash
git add -A
git commit -m "fix: address issues found in final integration smoke test"
```
