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
