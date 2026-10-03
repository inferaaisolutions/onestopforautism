# ASD Guide — AI Content Updater Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a daily AI-powered pipeline that fetches autism research from 7 trusted sources, extracts structured content via Claude API, validates against Zod schemas, and writes/updates JSON files in `content/` automatically.

**Architecture:** New modules in `scripts/` follow the existing pattern (alongside `scrape.ts`, `dedupe.ts`, `writeContent.ts`). A `sources.ts` fetches raw articles from trusted feeds/APIs, `ai-extractor.ts` calls Claude to structure them, `logger.ts` records each run, and `ai-update.ts` orchestrates the whole flow. Windows Task Scheduler triggers it daily at 3 AM via `setup-scheduler.ts`.

**Tech Stack:** TypeScript (tsx), `@anthropic-ai/sdk` (Claude Haiku), `fast-xml-parser` (RSS), Zod (already installed), Node.js fs/fetch, Vitest (globals: true — no describe/it/expect imports needed in tests)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `scripts/sources.ts` | Create | Fetch raw articles from all 7 trusted sources |
| `scripts/ai-extractor.ts` | Create | Send articles to Claude, return structured JSON |
| `scripts/logger.ts` | Create | Write daily run log to `logs/` |
| `scripts/writeContent.ts` | Extend | Add `updateNewsItem` + `getExistingNewsSlugs` |
| `scripts/ai-update.ts` | Create | Main orchestrator — ties everything together |
| `scripts/setup-scheduler.ts` | Create | One-time Windows Task Scheduler registration |
| `package.json` | Modify | Add `ai-update` + `setup-scheduler` scripts |
| `.env.example` | Modify | Add `ANTHROPIC_API_KEY=` |
| `logs/.gitkeep` | Create | Track logs directory in git |

---

### Task 1: Install dependencies and scaffold

**Files:**
- Modify: `package.json`
- Modify: `.env.example`
- Create: `logs/.gitkeep`

- [ ] **Step 1: Install new npm packages**

```bash
cd "C:/Users/sait9/sait/asd_site_extracted/asd_site"
npm install @anthropic-ai/sdk fast-xml-parser
```

Expected: `added 2 packages`

- [ ] **Step 2: Add ANTHROPIC_API_KEY to .env.example**

Open `.env.example` and make it look like this:

```
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
ANTHROPIC_API_KEY=
```

- [ ] **Step 3: Create logs directory**

```bash
mkdir -p "C:/Users/sait9/sait/asd_site_extracted/asd_site/logs"
touch "C:/Users/sait9/sait/asd_site_extracted/asd_site/logs/.gitkeep"
```

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/sait9/sait/asd_site_extracted/asd_site"
git add package.json package-lock.json .env.example logs/.gitkeep
git commit -m "chore: add anthropic sdk and fast-xml-parser, scaffold logs dir"
```

---

### Task 2: Logger module

**Files:**
- Create: `scripts/logger.ts`
- Create: `scripts/logger.test.ts`

- [ ] **Step 1: Write failing test**

Create `scripts/logger.test.ts`:

```typescript
import fs from "fs";
import path from "path";
import { createLogger } from "./logger";

const TEST_LOGS_DIR = path.join(process.cwd(), "logs-test-tmp");

beforeEach(() => fs.mkdirSync(TEST_LOGS_DIR, { recursive: true }));
afterEach(() => fs.rmSync(TEST_LOGS_DIR, { recursive: true, force: true }));

it("saves a log file with correct structure", () => {
  const logger = createLogger(TEST_LOGS_DIR);
  logger.logAdded("news/test.json");
  logger.logUpdated("therapies/aba.json");
  logger.logSkipped();
  logger.logSkipped();
  logger.logFailed("Zod validation failed");
  logger.save();

  const files = fs.readdirSync(TEST_LOGS_DIR);
  expect(files).toHaveLength(1);
  expect(files[0]).toMatch(/^ai-update-\d{4}-\d{2}-\d{2}\.json$/);

  const log = JSON.parse(fs.readFileSync(path.join(TEST_LOGS_DIR, files[0]), "utf-8"));
  expect(log.added).toEqual(["news/test.json"]);
  expect(log.updated).toEqual(["therapies/aba.json"]);
  expect(log.skipped).toBe(2);
  expect(log.failed).toBe(1);
  expect(log.failureReasons).toEqual(["Zod validation failed"]);
});

it("appends to the same log file if called twice in one day", () => {
  const logger = createLogger(TEST_LOGS_DIR);
  logger.logAdded("news/a.json");
  logger.save();

  const logger2 = createLogger(TEST_LOGS_DIR);
  logger2.logAdded("news/b.json");
  logger2.save();

  expect(fs.readdirSync(TEST_LOGS_DIR)).toHaveLength(1);
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd "C:/Users/sait9/sait/asd_site_extracted/asd_site"
npx vitest run scripts/logger.test.ts
```

Expected: FAIL — `Cannot find module './logger'`

- [ ] **Step 3: Implement logger**

Create `scripts/logger.ts`:

```typescript
import fs from "fs";
import path from "path";

interface LogEntry {
  date: string;
  added: string[];
  updated: string[];
  skipped: number;
  failed: number;
  failureReasons: string[];
}

interface Logger {
  logAdded(file: string): void;
  logUpdated(file: string): void;
  logSkipped(): void;
  logFailed(reason: string): void;
  save(): void;
}

export function createLogger(logsDir = path.join(process.cwd(), "logs")): Logger {
  const today = new Date().toISOString().split("T")[0];
  const logPath = path.join(logsDir, `ai-update-${today}.json`);

  const entry: LogEntry = fs.existsSync(logPath)
    ? JSON.parse(fs.readFileSync(logPath, "utf-8"))
    : { date: today, added: [], updated: [], skipped: 0, failed: 0, failureReasons: [] };

  return {
    logAdded(file) { entry.added.push(file); },
    logUpdated(file) { entry.updated.push(file); },
    logSkipped() { entry.skipped++; },
    logFailed(reason) { entry.failed++; entry.failureReasons.push(reason); },
    save() {
      fs.mkdirSync(logsDir, { recursive: true });
      fs.writeFileSync(logPath, JSON.stringify(entry, null, 2));
      console.log(`Log: +${entry.added.length} added, ~${entry.updated.length} updated, ${entry.skipped} skipped, ${entry.failed} failed`);
    },
  };
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run scripts/logger.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/logger.ts scripts/logger.test.ts
git commit -m "feat: add logger module for daily run audit trail"
```

---

### Task 3: Sources module

**Files:**
- Create: `scripts/sources.ts`
- Create: `scripts/sources.test.ts`

- [ ] **Step 1: Write failing test**

Create `scripts/sources.test.ts`:

```typescript
import { vi } from "vitest";
import { TRUSTED_SOURCES, fetchAllSources } from "./sources";

const RSS_XML = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <item>
    <title>Autism Study 2026</title>
    <link>https://example.com/autism-study</link>
    <description>Research suggests improvements in social skills.</description>
    <pubDate>Sat, 03 Oct 2026 00:00:00 GMT</pubDate>
  </item>
</channel></rss>`;

it("TRUSTED_SOURCES has 7 entries, all with name and url", () => {
  expect(TRUSTED_SOURCES).toHaveLength(7);
  for (const s of TRUSTED_SOURCES) {
    expect(s.name).toBeTruthy();
    expect(s.url).toMatch(/^https?:\/\//);
  }
});

it("fetchAllSources returns an array of RawArticles", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    text: async () => RSS_XML,
    json: async () => ({ esearchresult: { idlist: [] } }),
  }));

  const articles = await fetchAllSources({ redditClientId: "", redditClientSecret: "" });
  expect(Array.isArray(articles)).toBe(true);

  vi.unstubAllGlobals();
});

it("fetchAllSources does not throw if a source is unreachable", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

  const articles = await fetchAllSources({ redditClientId: "", redditClientSecret: "" });
  expect(Array.isArray(articles)).toBe(true);
  expect(articles).toHaveLength(0);

  vi.unstubAllGlobals();
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run scripts/sources.test.ts
```

Expected: FAIL — `Cannot find module './sources'`

- [ ] **Step 3: Implement sources**

Create `scripts/sources.ts`:

```typescript
import { XMLParser } from "fast-xml-parser";

export interface RawArticle {
  title: string;
  url: string;
  source: string;
  content: string;
  date: string;
}

interface SourceConfig {
  name: string;
  url: string;
  type: "rss" | "pubmed";
}

export const TRUSTED_SOURCES: SourceConfig[] = [
  { name: "PubMed",        url: "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=autism&sort=date&retmax=5&retmode=json", type: "pubmed" },
  { name: "Cochrane",      url: "https://www.cochranelibrary.com/feed/rss",                type: "rss" },
  { name: "NIH",           url: "https://www.nih.gov/rss/news/news.xml",                   type: "rss" },
  { name: "Autism Speaks", url: "https://www.autismspeaks.org/news/rss.xml",               type: "rss" },
  { name: "ABAI",          url: "https://www.abainternational.org/rss.xml",                type: "rss" },
  { name: "WHO",           url: "https://www.who.int/rss-feeds/news-english.xml",          type: "rss" },
  { name: "Reddit",        url: "https://www.reddit.com/r/autism/top.json?t=day&limit=5",  type: "rss" },
];

const xmlParser = new XMLParser({ ignoreAttributes: false });

function toDate(raw: unknown): string {
  try {
    return new Date(String(raw)).toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

async function fetchRSS(source: SourceConfig): Promise<RawArticle[]> {
  const res = await fetch(source.url, { headers: { "User-Agent": "ASD-Guide-Bot/1.0" } });
  if (!res.ok) return [];
  const xml = await res.text();
  const parsed = xmlParser.parse(xml);
  const rawItems =
    parsed?.rss?.channel?.item ??
    parsed?.feed?.entry ??
    [];
  const items: Record<string, unknown>[] = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items.slice(0, 5).map((item) => ({
    title: String(item["title"] ?? "").trim(),
    url: String(item["link"] ?? item["guid"] ?? "").trim(),
    source: source.name,
    content: String(item["description"] ?? item["summary"] ?? item["title"] ?? "").trim(),
    date: toDate(item["pubDate"] ?? item["published"]),
  })).filter((a) => a.title && a.url);
}

async function fetchPubMed(): Promise<RawArticle[]> {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
  const searchUrl =
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi` +
    `?db=pubmed&term=autism&sort=date&retmax=5&retmode=json&mindate=${yesterday}&maxdate=${today}`;

  const res = await fetch(searchUrl, { headers: { "User-Agent": "ASD-Guide-Bot/1.0" } });
  if (!res.ok) return [];

  const data = (await res.json()) as { esearchresult: { idlist: string[] } };
  const ids = data.esearchresult?.idlist ?? [];
  if (ids.length === 0) return [];

  const summaryUrl =
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi` +
    `?db=pubmed&id=${ids.join(",")}&retmode=json`;
  const sumRes = await fetch(summaryUrl, { headers: { "User-Agent": "ASD-Guide-Bot/1.0" } });
  if (!sumRes.ok) return [];

  const sumData = (await sumRes.json()) as {
    result: Record<string, { title: string; pubdate: string }>;
  };

  return ids.flatMap((id) => {
    const item = sumData.result[id];
    if (!item?.title) return [];
    return [{
      title: item.title,
      url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      source: "PubMed",
      content: item.title,
      date: toDate(item.pubdate),
    }];
  });
}

export async function fetchAllSources(opts: {
  redditClientId: string;
  redditClientSecret: string;
}): Promise<RawArticle[]> {
  const rssSources = TRUSTED_SOURCES.filter((s) => s.type === "rss");
  const results = await Promise.allSettled([
    fetchPubMed(),
    ...rssSources.map((s) => fetchRSS(s)),
  ]);
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run scripts/sources.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/sources.ts scripts/sources.test.ts
git commit -m "feat: add sources module with PubMed API and 6 RSS feed fetchers"
```

---

### Task 4: AI Extractor module

**Files:**
- Create: `scripts/ai-extractor.ts`
- Create: `scripts/ai-extractor.test.ts`

- [ ] **Step 1: Write failing test**

Create `scripts/ai-extractor.test.ts`:

```typescript
import { vi } from "vitest";
import type { RawArticle } from "./sources";

const mockArticle: RawArticle = {
  title: "Music therapy improves social skills in autistic children",
  url: "https://pubmed.ncbi.nlm.nih.gov/12345/",
  source: "PubMed",
  content: "A 2026 meta-analysis of 15 studies found music therapy was associated with improvements in social engagement.",
  date: "2026-10-01",
};

const validNewsJSON = JSON.stringify({
  slug: "2026-10-01-music-therapy-improves-social-skills",
  title: "Music therapy improves social skills in autistic children",
  summary: "A 2026 meta-analysis found music therapy was associated with improvements in social engagement.",
  date: "2026-10-01",
  sources: [{ label: "PubMed - Music therapy study", url: "https://pubmed.ncbi.nlm.nih.gov/12345/" }],
  sourceType: "scraped",
});

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: validNewsJSON }],
      }),
    };
  },
}));

it("returns structured content matching the article", async () => {
  const { extractContent } = await import("./ai-extractor");
  const result = await extractContent(mockArticle, "news", "test-key");
  expect(result).not.toBeNull();
  expect(result?.slug).toContain("music-therapy");
  expect(result?.sources).toHaveLength(1);
  expect(result?.sourceType).toBe("scraped");
});

it("returns null when Claude output is not parseable JSON", async () => {
  const { extractContent } = await import("./ai-extractor");
  vi.mocked((await import("@anthropic-ai/sdk")).default.prototype?.messages?.create).mockResolvedValueOnce({
    content: [{ type: "text", text: "Sorry, I cannot help with that." }],
  } as never);
  const result = await extractContent(mockArticle, "news", "test-key");
  expect(result).toBeNull();
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run scripts/ai-extractor.test.ts
```

Expected: FAIL — `Cannot find module './ai-extractor'`

- [ ] **Step 3: Implement AI extractor**

Create `scripts/ai-extractor.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import type { RawArticle } from "./sources";

type ContentCategory = "news" | "therapies" | "behaviors";

const SCHEMAS: Record<ContentCategory, object> = {
  news: {
    slug: "string — kebab-case with date prefix YYYY-MM-DD-title",
    title: "string",
    summary: "string — 1-3 sentences, informational tone only",
    date: "string — YYYY-MM-DD",
    sources: [{ label: "string", url: "string — original article URL" }],
    sourceType: "scraped",
  },
  therapies: {
    slug: "string — kebab-case therapy name",
    name: "string",
    category: "string — one of: Behavioral, Sensory & Movement, Communication, Medical",
    summary: "string",
    description: "string — 2-4 sentences",
    claimedBenefits: ["string"],
    evidenceLevel: "clinical | emerging | anecdotal",
    evidenceNotes: "string — cite specific study year and findings",
    regions: ["string — country names"],
    sources: [{ label: "string", url: "string" }],
    image: "placeholder.jpg",
    sourceType: "scraped",
    updatedAt: "string — YYYY-MM-DD",
  },
  behaviors: {
    slug: "string — kebab-case behavior name",
    name: "string",
    summary: "string",
    triggers: ["string"],
    remedies: [{ text: "string", evidenceLevel: "clinical | emerging | anecdotal" }],
    sources: [{ label: "string", url: "string" }],
    sourceType: "scraped",
    updatedAt: "string — YYYY-MM-DD",
  },
};

const SYSTEM_PROMPT = `You are a research assistant for an autism information platform for parents and therapists.
Extract structured information from the provided article.

STRICT RULES — violating any of these causes your response to be discarded:
- Never make medical recommendations or use prescriptive language
- Never write "you should", "this treats", "this cures", "clinically proven", "recommended treatment"
- Always use informational phrasing: "research suggests", "a study found", "evidence indicates", "some families report"
- Always include at least one source with the original article URL
- evidenceLevel must be exactly one of: "clinical", "emerging", or "anecdotal"
  - clinical = strong RCT or systematic review evidence
  - emerging = small studies or preliminary evidence
  - anecdotal = parent/community reports, no peer-reviewed studies
- Output ONLY valid JSON — no markdown fences, no explanation text, nothing before or after the JSON`;

function buildPrompt(article: RawArticle, category: ContentCategory): string {
  return `Category: ${category}

Title: ${article.title}
URL: ${article.url}
Source: ${article.source}
Date: ${article.date}
Content: ${article.content}

Output JSON matching this schema:
${JSON.stringify(SCHEMAS[category], null, 2)}`;
}

function parseJSON(text: string): Record<string, unknown> | null {
  try {
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function extractContent(
  article: RawArticle,
  category: ContentCategory,
  apiKey: string
): Promise<Record<string, unknown> | null> {
  const client = new Anthropic({ apiKey });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildPrompt(article, category) }],
      });
      const text = msg.content.find((b) => b.type === "text")?.text ?? "";
      const parsed = parseJSON(text);
      if (parsed) {
        parsed["sourceType"] = "scraped";
        return parsed;
      }
    } catch {
      // retry on attempt 0, give up on attempt 1
    }
  }
  return null;
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run scripts/ai-extractor.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/ai-extractor.ts scripts/ai-extractor.test.ts
git commit -m "feat: add AI extractor using Claude Haiku with strict no-medical-advice prompts"
```

---

### Task 5: Extend writeContent.ts for update support

**Files:**
- Modify: `scripts/writeContent.ts`
- Modify: `scripts/dedupe.ts` (add URL-based existing check)

- [ ] **Step 1: Write failing test**

Add to `scripts/writeContent.ts` test (create `scripts/writeContent.test.ts` if it doesn't exist):

```typescript
import fs from "fs";
import path from "path";
import { writeScrapedNewsItem, isNewerThanExisting } from "./writeContent";
import type { NewsItem } from "../src/lib/schema";

const TEST_DIR = path.join(process.cwd(), "content-tmp");

beforeEach(() => fs.mkdirSync(path.join(TEST_DIR, "news"), { recursive: true }));
afterEach(() => fs.rmSync(TEST_DIR, { recursive: true, force: true }));

const item: NewsItem = {
  slug: "2026-10-01-test",
  title: "Test item",
  summary: "Research suggests X.",
  date: "2026-10-01",
  sources: [{ label: "Test", url: "https://example.com" }],
  sourceType: "scraped",
};

it("isNewerThanExisting returns true when file does not exist", () => {
  expect(isNewerThanExisting(item, TEST_DIR)).toBe(true);
});

it("isNewerThanExisting returns false when existing file has same date", () => {
  fs.writeFileSync(path.join(TEST_DIR, "news", "2026-10-01-test.json"), JSON.stringify(item));
  expect(isNewerThanExisting(item, TEST_DIR)).toBe(false);
});

it("isNewerThanExisting returns true when new item is newer", () => {
  fs.writeFileSync(path.join(TEST_DIR, "news", "2026-10-01-test.json"), JSON.stringify(item));
  const newer: NewsItem = { ...item, date: "2026-12-01" };
  expect(isNewerThanExisting(newer, TEST_DIR)).toBe(true);
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run scripts/writeContent.test.ts
```

Expected: FAIL — `isNewerThanExisting is not exported`

- [ ] **Step 3: Extend writeContent.ts**

Open `scripts/writeContent.ts` and add the `isNewerThanExisting` export (keep all existing code unchanged):

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

export function writeScrapedNewsItem(item: NewsItem, contentDir = CONTENT_DIR): void {
  const dir = path.join(contentDir, "news");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${item.slug}.json`), JSON.stringify(item, null, 2));
}

export function isNewerThanExisting(item: NewsItem, contentDir = CONTENT_DIR): boolean {
  const filePath = path.join(contentDir, "news", `${item.slug}.json`);
  if (!fs.existsSync(filePath)) return true;
  const existing: NewsItem = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const existingDate = existing.date ?? "1970-01-01";
  return item.date > existingDate;
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run scripts/writeContent.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/writeContent.ts scripts/writeContent.test.ts
git commit -m "feat: add isNewerThanExisting to writeContent for update-aware writes"
```

---

### Task 6: Main orchestrator

**Files:**
- Create: `scripts/ai-update.ts`
- Create: `scripts/ai-update.test.ts`

- [ ] **Step 1: Write failing test**

Create `scripts/ai-update.test.ts`:

```typescript
import { vi } from "vitest";

vi.mock("./sources", () => ({
  fetchAllSources: vi.fn().mockResolvedValue([
    {
      title: "New autism study 2026",
      url: "https://pubmed.ncbi.nlm.nih.gov/99999/",
      source: "PubMed",
      content: "Research suggests improvements in communication.",
      date: "2026-10-01",
    },
  ]),
}));

vi.mock("./ai-extractor", () => ({
  extractContent: vi.fn().mockResolvedValue({
    slug: "2026-10-01-new-autism-study-2026",
    title: "New autism study 2026",
    summary: "Research suggests improvements in communication.",
    date: "2026-10-01",
    sources: [{ label: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov/99999/" }],
    sourceType: "scraped",
  }),
}));

vi.mock("./writeContent", () => ({
  getExistingNewsUrls: vi.fn().mockReturnValue(new Set()),
  writeScrapedNewsItem: vi.fn(),
  isNewerThanExisting: vi.fn().mockReturnValue(true),
}));

vi.mock("./logger", () => ({
  createLogger: vi.fn().mockReturnValue({
    logAdded: vi.fn(),
    logUpdated: vi.fn(),
    logSkipped: vi.fn(),
    logFailed: vi.fn(),
    save: vi.fn(),
  }),
}));

it("runUpdate resolves without throwing", async () => {
  const { runUpdate } = await import("./ai-update");
  await expect(
    runUpdate({ apiKey: "test-key", redditClientId: "", redditClientSecret: "" })
  ).resolves.not.toThrow();
});

it("runUpdate exits early when apiKey is missing", async () => {
  const mockExit = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("process.exit"); });
  const { runUpdate } = await import("./ai-update");
  await expect(runUpdate({ apiKey: "", redditClientId: "", redditClientSecret: "" })).rejects.toThrow("process.exit");
  mockExit.mockRestore();
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run scripts/ai-update.test.ts
```

Expected: FAIL — `Cannot find module './ai-update'`

- [ ] **Step 3: Implement orchestrator**

Create `scripts/ai-update.ts`:

```typescript
import { fetchAllSources } from "./sources";
import { extractContent } from "./ai-extractor";
import { getExistingNewsUrls, writeScrapedNewsItem, isNewerThanExisting } from "./writeContent";
import { dedupe } from "./dedupe";
import { createLogger } from "./logger";
import { newsItemSchema } from "../src/lib/schema";

interface UpdateOptions {
  apiKey: string;
  redditClientId: string;
  redditClientSecret: string;
}

export async function runUpdate(opts: UpdateOptions): Promise<void> {
  if (!opts.apiKey) {
    console.error("Error: ANTHROPIC_API_KEY is not set in .env.local. Exiting.");
    process.exit(1);
  }

  const logger = createLogger();

  console.log("[ASD Guide] Fetching articles from trusted sources...");
  const articles = await fetchAllSources({
    redditClientId: opts.redditClientId,
    redditClientSecret: opts.redditClientSecret,
  });
  console.log(`[ASD Guide] Fetched ${articles.length} article(s).`);

  const existingUrls = getExistingNewsUrls();
  const fresh = dedupe(existingUrls, articles.map((a) => ({ ...a, sourceUrl: a.url })));
  console.log(`[ASD Guide] ${fresh.length} new article(s) after dedup.`);

  for (const article of fresh) {
    try {
      const extracted = await extractContent(article, "news", opts.apiKey);
      if (!extracted) {
        logger.logFailed(`Claude extraction failed: ${article.title}`);
        continue;
      }

      const validated = newsItemSchema.safeParse(extracted);
      if (!validated.success) {
        logger.logFailed(`Zod validation failed for "${article.title}": ${validated.error.issues[0]?.message}`);
        continue;
      }

      const newsItem = validated.data;

      if (!isNewerThanExisting(newsItem)) {
        logger.logSkipped();
        continue;
      }

      const alreadyExists = existingUrls.has(article.url);
      writeScrapedNewsItem(newsItem);

      if (alreadyExists) {
        logger.logUpdated(`news/${newsItem.slug}.json`);
        console.log(`  ~ Updated: ${newsItem.slug}`);
      } else {
        logger.logAdded(`news/${newsItem.slug}.json`);
        console.log(`  + Added:   ${newsItem.slug}`);
      }
    } catch (err) {
      logger.logFailed(`Unexpected error for "${article.title}": ${String(err)}`);
    }
  }

  logger.save();
  console.log("[ASD Guide] Update complete.");
}

// Run when executed directly
const isMain = process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/ai-update.ts") ||
               process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/ai-update.js");

if (isMain) {
  runUpdate({
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    redditClientId: process.env.REDDIT_CLIENT_ID ?? "",
    redditClientSecret: process.env.REDDIT_CLIENT_SECRET ?? "",
  }).catch(console.error);
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run scripts/ai-update.test.ts
```

Expected: PASS

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add scripts/ai-update.ts scripts/ai-update.test.ts
git commit -m "feat: add AI update orchestrator — fetch, extract, validate, write"
```

---

### Task 7: Windows Task Scheduler setup script

**Files:**
- Create: `scripts/setup-scheduler.ts`

- [ ] **Step 1: Create the setup script**

Create `scripts/setup-scheduler.ts`:

```typescript
import { execSync } from "child_process";
import path from "path";

const PROJECT_DIR = path.resolve(process.cwd()).replace(/\//g, "\\");
const TSX_PATH = path.join(PROJECT_DIR, "node_modules", ".bin", "tsx");
const SCRIPT_PATH = path.join(PROJECT_DIR, "scripts", "ai-update.ts");
const TASK_NAME = "ASD-Guide-Daily-Update";
const RUN_COMMAND = `"${TSX_PATH}" "${SCRIPT_PATH}"`;

console.log("Setting up Windows Task Scheduler for daily AI content updates...\n");

// Remove existing task silently
try {
  execSync(`schtasks /delete /tn "${TASK_NAME}" /f`, { stdio: "pipe" });
  console.log("Removed existing scheduled task.");
} catch {
  // Task didn't exist — that's fine
}

// Register new daily task at 3:00 AM
try {
  execSync(
    `schtasks /create /tn "${TASK_NAME}" /tr "${RUN_COMMAND}" /sc daily /st 03:00 /f`,
    { cwd: PROJECT_DIR, stdio: "inherit" }
  );

  console.log(`\nTask "${TASK_NAME}" scheduled to run daily at 3:00 AM.`);
  console.log(`Script: ${SCRIPT_PATH}`);
  console.log(`Working dir: ${PROJECT_DIR}`);
  console.log("\nUseful commands:");
  console.log(`  Run now:   npm run ai-update`);
  console.log(`  Verify:    schtasks /query /tn "${TASK_NAME}"`);
  console.log(`  Remove:    schtasks /delete /tn "${TASK_NAME}" /f`);
} catch (err) {
  console.error("\nFailed to create scheduled task. You may need to run as Administrator.");
  console.error("To create manually, open Task Scheduler and run:");
  console.error(`  ${RUN_COMMAND}`);
  console.error(`  Working directory: ${PROJECT_DIR}`);
  process.exit(1);
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/setup-scheduler.ts
git commit -m "feat: add Windows Task Scheduler setup script for 3AM daily run"
```

---

### Task 8: Wire up npm scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add scripts to package.json**

Open `package.json` and update the `"scripts"` section to:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest",
  "scrape": "tsx scripts/scrape.ts",
  "ai-update": "tsx scripts/ai-update.ts",
  "setup-scheduler": "tsx scripts/setup-scheduler.ts"
}
```

- [ ] **Step 2: Confirm all tests still pass**

```bash
npx vitest run
```

Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add ai-update and setup-scheduler npm scripts"
```

---

### Task 9: End-to-end smoke test

- [ ] **Step 1: Add your Anthropic API key to .env.local**

```bash
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" >> "C:/Users/sait9/sait/asd_site_extracted/asd_site/.env.local"
```

- [ ] **Step 2: Run the updater once manually**

```bash
cd "C:/Users/sait9/sait/asd_site_extracted/asd_site"
npm run ai-update
```

Expected output:
```
[ASD Guide] Fetching articles from trusted sources...
[ASD Guide] Fetched N article(s).
[ASD Guide] M new article(s) after dedup.
  + Added:   2026-10-03-autism-study-...
  ...
Log: +N added, ~0 updated, 0 skipped, 0 failed
[ASD Guide] Update complete.
```

- [ ] **Step 3: Verify log file was created**

```bash
cat "C:/Users/sait9/sait/asd_site_extracted/asd_site/logs/ai-update-$(date +%Y-%m-%d).json"
```

Expected: JSON with `added`, `updated`, `skipped`, `failed` arrays/counts.

- [ ] **Step 4: Verify content on site**

With dev server running (`npm run dev`), open http://localhost:3000 and check the News section for new entries.

- [ ] **Step 5: Schedule daily updates**

```bash
npm run setup-scheduler
```

Expected: `Task "ASD-Guide-Daily-Update" scheduled to run daily at 3:00 AM.`

> Note: Run this in an **Administrator** terminal if you get a permissions error.

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat: AI content updater complete — daily pipeline operational"
```
