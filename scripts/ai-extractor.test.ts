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

const mockCreate = vi.fn().mockResolvedValue({
  content: [{ type: "text", text: validNewsJSON }],
});

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate };
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
  const badResponse = { content: [{ type: "text", text: "Sorry, I cannot help with that." }] };
  // mock both attempts (extractContent retries once)
  mockCreate.mockResolvedValueOnce(badResponse);
  mockCreate.mockResolvedValueOnce(badResponse);
  const { extractContent } = await import("./ai-extractor");
  const result = await extractContent(mockArticle, "news", "test-key");
  expect(result).toBeNull();
});
