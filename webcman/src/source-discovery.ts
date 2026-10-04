import fs from "fs";
import path from "path";
import Groq from "groq-sdk";
import type { DiscoveredSource } from "./types";

const CACHE_TTL_DAYS = 30;
const MODEL = "openai/gpt-oss-20b";

const DISCOVERY_PROMPT = (topic: string) => `You are a web researcher.
List the best publicly available RSS feeds and PubMed search URLs for the topic: "${topic}".

Rules:
- Only include feeds from well-known, trusted organizations (government health agencies, peer-reviewed journals, established non-profits)
- Include at least one PubMed RSS search URL
- Return 6-10 sources maximum
- Return ONLY a JSON array, no explanation

Format:
[
  { "feedUrl": "https://...", "domain": "example.com", "type": "rss" },
  { "feedUrl": "https://pubmed.ncbi.nlm.nih.gov/rss/search/?term=...", "domain": "pubmed.ncbi.nlm.nih.gov", "type": "pubmed" }
]`;

function isCacheFresh(cachePath: string): boolean {
  if (!fs.existsSync(cachePath)) return false;
  const stats = fs.statSync(cachePath);
  const ageMs = Date.now() - stats.mtimeMs;
  return ageMs < CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
}

export async function discoverSources(
  topic: string,
  apiKey: string,
  webcmanDir: string
): Promise<DiscoveredSource[]> {
  const cachePath = path.join(webcmanDir, "sources.json");

  if (isCacheFresh(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, "utf-8")) as DiscoveredSource[];
  }

  const client = new Groq({ apiKey });
  const msg = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: DISCOVERY_PROMPT(topic) }],
  });

  const text = msg.choices[0]?.message?.content ?? "[]";
  let sources: DiscoveredSource[] = [];
  try {
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    sources = JSON.parse(cleaned) as DiscoveredSource[];
  } catch {
    sources = [];
  }

  fs.mkdirSync(webcmanDir, { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(sources, null, 2));
  return sources;
}
