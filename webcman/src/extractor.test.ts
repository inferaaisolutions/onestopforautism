import { vi } from "vitest";
import type { RawItem, ContentSchema } from "./types";

const mockCreate = vi.fn();

vi.mock("groq-sdk", () => ({
  default: class MockGroq {
    chat = { completions: { create: mockCreate } };
  },
}));

const item: RawItem = {
  title: "Music therapy improves social skills",
  url: "https://pubmed.ncbi.nlm.nih.gov/12345/",
  content: "A 2026 meta-analysis found music therapy improved social engagement in autistic children.",
  date: "2026-10-01",
  sourceDomain: "pubmed.ncbi.nlm.nih.gov",
  trustScore: 1,
};

const schema: ContentSchema = {
  slug: { type: "string", required: true },
  title: { type: "string", required: true },
  summary: { type: "string", required: true },
  date: { type: "string", required: true },
  sources: { type: "array", required: true },
  sourceType: { type: "string", required: true },
};

it("returns extracted content matching the schema", async () => {
  mockCreate.mockResolvedValueOnce({
    choices: [{ message: { content: JSON.stringify({
      slug: "music-therapy-improves-social-skills",
      title: "Music therapy improves social skills",
      summary: "A 2026 meta-analysis found music therapy improved social engagement.",
      date: "2026-10-01",
      sources: [{ label: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov/12345/" }],
      sourceType: "scraped",
    })}}]
  });

  vi.resetModules();
  const { extractItem } = await import("./extractor");
  const result = await extractItem(item, "news", schema, "test-key");
  expect(result).not.toBeNull();
  expect(result?.slug).toBe("music-therapy-improves-social-skills");
  expect(result?.sourceType).toBe("scraped");
});

it("returns null when Groq output is not valid JSON (both retries)", async () => {
  mockCreate.mockResolvedValue({ choices: [{ message: { content: "Sorry, I cannot help." } }] });
  vi.resetModules();
  const { extractItem } = await import("./extractor");
  const result = await extractItem(item, "news", schema, "test-key");
  expect(result).toBeNull();
});
