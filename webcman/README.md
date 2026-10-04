# WebCMan — AI Web Content Manager

Keep any website's JSON content automatically up to date from trusted sources.
No server. No review step. One config file.

**Free forever** — uses [Groq](https://console.groq.com) free tier AI.

---

## How it works

WebCMan runs as a GitHub Actions cron job. On each run it:

1. Reads `webcman.config.json` to understand your site topic and content directory
2. Scans existing content files to infer the JSON schema automatically
3. Fetches articles from your configured RSS sources (or AI-discovers them)
4. Scores each source by trust tier (peer-reviewed > government > news > community)
5. Uses AI to extract plain-language summaries — no jargon, no medical/legal advice language
6. Detects conflicts between sources and flags them instead of hiding them
7. Writes new and updated JSON files to your content directory
8. Commits and pushes changes to your repo
9. Generates a dashboard at `public/webcman.html`

---

## Quick start (5 minutes)

### 1. Add the config file

Create `webcman.config.json` at the root of your repo:

```json
{
  "topic": "describe your site topic here",
  "contentDir": "./content",
  "schedule": "0 10 * * *",
  "trustTiers": {
    "tier1": ["pubmed.ncbi.nlm.nih.gov", "who.int"],
    "tier2": ["nih.gov", "cdc.gov"],
    "tier3": ["sciencedaily.com"],
    "tier4": ["reddit.com"]
  },
  "blockedPhrases": [
    "consult your doctor",
    "medical advice",
    "seek medical attention"
  ],
  "rollbackDepth": 5,
  "sources": [
    { "feedUrl": "https://your-source.com/rss.xml", "domain": "your-source.com", "type": "rss" }
  ]
}
```

If you omit `sources`, WebCMan uses AI to discover appropriate sources for your topic.

### 2. Add the GitHub Actions workflow

Create `.github/workflows/webcman.yml`:

```yaml
name: WebCMan Content Update
on:
  schedule:
    - cron: '0 10 * * *'
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm run webcman
        env:
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
          CI: true
```

### 3. Add the npm script

In your `package.json`:

```json
{
  "scripts": {
    "webcman": "tsx webcman/src/run.ts"
  },
  "dependencies": {
    "groq-sdk": "^0.3.0",
    "tsx": "^4.0.0",
    "zod": "^3.0.0"
  }
}
```

### 4. Get a free Groq API key

1. Go to [console.groq.com](https://console.groq.com) and sign up (free)
2. Create an API key
3. Add it to your GitHub repo: **Settings → Secrets and variables → Actions → New secret → `GROQ_API_KEY`**

### 5. For local development

Create `.env.local` at your repo root (never commit this):

```
GROQ_API_KEY=your_key_here
```

Then run:

```bash
npm run webcman
```

---

## Content directory structure

WebCMan works with any content structure where:
- Content lives in subdirectories under `contentDir`
- Each subdirectory is a content type (`news/`, `articles/`, `research/`, etc.)
- Each file is a JSON object

```
content/
  news/
    some-article.json
    another-article.json
  research/
    study-title.json
```

WebCMan infers the JSON schema from your existing files — no manual schema definition needed.

---

## Config reference

| Field | Required | Default | Description |
|---|---|---|---|
| `topic` | yes | — | Plain English description of your site's subject |
| `contentDir` | yes | `./content` | Path to content directory |
| `schedule` | yes | `0 10 * * *` | Cron expression for GitHub Actions |
| `trustTiers` | no | Built-in defaults | Domain lists per tier 1–4 |
| `blockedPhrases` | no | Common advice phrases | Phrases that cause hard-blocking |
| `rollbackDepth` | no | `5` | History versions kept per file |
| `sources` | no | AI-discovered | Explicit RSS feed list; AI discovery skipped if provided |

---

## Dashboard

After each run, `public/webcman.html` is updated. It shows:

- Items added, updated, flagged (conflicting sources), and blocked
- Per-file rollback button (restores previous version)

---

## Trust tiers

| Tier | Examples | Behaviour |
|---|---|---|
| 1 | PubMed, Cochrane, WHO | Published with full confidence |
| 2 | NIH, CDC, government orgs | Published normally |
| 3 | Science news sites | Published normally |
| 4 | Reddit, community forums | Requires tier 1–2 corroboration |

---

## Safety filter

The AI enforces strict rules on every item:

- No medical, legal, or financial advice language
- No jargon without inline definition
- Source URL always included
- Conflicting sources flagged with `"conflictFlag": true`, not hidden
- Items containing hard-blocked phrases are discarded and logged

---

## Rollback

Every file write saves the previous version to `.webcman/history/<slug>/<timestamp>.json`.
Up to `rollbackDepth` versions are kept per file.

To rollback manually:

```bash
cp .webcman/history/some-article/2026-10-01T10-00-00.json content/news/some-article.json
git add content/news/some-article.json
git commit -m "rollback some-article to 2026-10-01"
```

---

## Framework compatibility

WebCMan writes JSON files. It works with any site that reads JSON:

| Framework | How to read content |
|---|---|
| Next.js | `fs.readFileSync` in server components or `getStaticProps` |
| Astro / SvelteKit / Nuxt | Import JSON at build time |
| Hugo / Jekyll | Place `contentDir` in `data/` |
| Plain HTML | `fetch('/content/news/item.json')` |

---

## Validated on

- **ASD Guide** — autism therapies and research, 95+ articles, 4 content types, running daily

---

## License

MIT
