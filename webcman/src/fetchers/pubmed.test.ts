import { vi } from "vitest";
import { fetchPubMedItems } from "./pubmed";

vi.mock("./rss", () => ({
  fetchRssItems: vi.fn().mockResolvedValue([
    {
      title: "Music therapy and autism: a meta-analysis",
      url: "https://pubmed.ncbi.nlm.nih.gov/12345/",
      content: "A meta-analysis of 15 studies found improvements in social engagement.",
      date: "2026-10-01",
      sourceDomain: "pubmed.ncbi.nlm.nih.gov",
      trustScore: 1,
    },
  ]),
}));

it("fetches items for a search term with trust score 1", async () => {
  const items = await fetchPubMedItems("autism");
  expect(items).toHaveLength(1);
  expect(items[0].sourceDomain).toBe("pubmed.ncbi.nlm.nih.gov");
  expect(items[0].trustScore).toBe(1);
});

it("passes correct URL to rss fetcher", async () => {
  const { fetchRssItems } = await import("./rss");
  await fetchPubMedItems("autism therapy");
  expect(vi.mocked(fetchRssItems)).toHaveBeenCalledWith(
    expect.stringContaining("pubmed.ncbi.nlm.nih.gov"),
    "pubmed.ncbi.nlm.nih.gov",
    1
  );
});
