import Groq from "groq-sdk";
import type { RawItem, ContentSchema } from "./types";

const MODEL = "openai/gpt-oss-20b";

const SYSTEM_PROMPT = `You are a content editor for a public information website.
Extract structured content from source articles.

STRICT RULES — any violation causes your output to be discarded:
- Write in plain language any general reader can understand
- No jargon; if a technical term is needed, define it briefly in parentheses
- NEVER write medical advice, legal advice, or financial advice
- NEVER write: "consult your doctor", "seek medical attention", "medical advice", "clinical recommendation"
- ALWAYS use informational phrasing: "research suggests", "a study found", "evidence indicates"
- ALWAYS include the source URL in the sources array
- If the article contradicts commonly known information on the same topic, add "conflictFlag": true
- Set sourceType to "scraped"
- Output ONLY valid JSON — no markdown fences, no explanation`;

function buildPrompt(item: RawItem, contentType: string, schema: ContentSchema): string {
  const schemaDescription = Object.entries(schema)
    .map(([k, v]) => `  "${k}": ${v.type}${v.required ? " (required)" : " (optional)"}`)
    .join("\n");

  return `Content type: ${contentType}

Source article:
Title: ${item.title}
URL: ${item.url}
Date: ${item.date}
Content: ${item.content}

Extract this into JSON with these fields:
{
${schemaDescription}
}

Source URL to include: ${item.url}`;
}

function parseJSON(text: string): Record<string, unknown> | null {
  try {
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function extractItem(
  item: RawItem,
  contentType: string,
  schema: ContentSchema,
  apiKey: string
): Promise<Record<string, unknown> | null> {
  const client = new Groq({ apiKey });
  const prompt = buildPrompt(item, contentType, schema);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const msg = await client.chat.completions.create({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      });
      const text = msg.choices[0]?.message?.content ?? "";
      const parsed = parseJSON(text);
      if (parsed) {
        parsed["sourceType"] = "scraped";
        return parsed;
      }
    } catch { /* retry */ }
  }
  return null;
}
