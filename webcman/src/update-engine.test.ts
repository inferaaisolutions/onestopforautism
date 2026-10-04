import { vi } from "vitest";

vi.mock("./source-discovery", () => ({
  discoverSources: vi.fn().mockResolvedValue([
    { feedUrl: "https://www.who.int/rss-feeds/news-english.xml", domain: "who.int", type: "rss" },
  ]),
}));

vi.mock("./fetchers/rss", () => ({
  fetchRssItems: vi.fn().mockResolvedValue([
    { title: "New autism study", url: "https://who.int/news/autism-2026", content: "WHO study on autism.", date: "2026-10-01", sourceDomain: "who.int", trustScore: 2 },
  ]),
}));

vi.mock("./fetchers/pubmed", () => ({
  fetchPubMedItems: vi.fn().mockResolvedValue([]),
}));

vi.mock("./extractor", () => ({
  extractItem: vi.fn().mockResolvedValue({
    slug: "new-autism-study",
    title: "New autism study",
    summary: "A WHO study on autism research.",
    date: "2026-10-01",
    sources: [{ label: "WHO", url: "https://who.int/news/autism-2026" }],
    sourceType: "scraped",
  }),
}));

vi.mock("./history", () => ({
  saveVersion: vi.fn(),
}));

vi.mock("./trust-scorer", () => ({
  scoreUrl: vi.fn().mockReturnValue(2),
}));

vi.mock("./safety-filter", () => ({
  isSafeObject: vi.fn().mockReturnValue(true),
}));

vi.mock("fs", () => {
  const fsMock = {
    existsSync: vi.fn().mockReturnValue(false),
    readdirSync: vi.fn().mockReturnValue([]),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn().mockReturnValue("{}"),
    statSync: vi.fn().mockReturnValue({ isDirectory: () => true }),
  };
  return { default: fsMock, ...fsMock };
});

it("returns stats with added items", async () => {
  const { runUpdateEngine } = await import("./update-engine");
  const stats = await runUpdateEngine({
    config: {
      topic: "autism",
      contentDir: "/content",
      schedule: "0 10 * * *",
      blockedPhrases: ["consult your doctor"],
      rollbackDepth: 5,
      trustTiers: { tier1: ["who.int"], tier2: [], tier3: [], tier4: [] },
    },
    apiKey: "test-key",
    webcmanDir: "/.webcman",
    contentTypes: ["news"],
    siteSchema: {
      news: {
        slug: { type: "string", required: true },
        title: { type: "string", required: true },
        summary: { type: "string", required: true },
        date: { type: "string", required: true },
        sources: { type: "array", required: true },
        sourceType: { type: "string", required: true },
      }
    },
  });

  expect(stats.added.length).toBeGreaterThan(0);
  expect(stats.failed).toHaveLength(0);
});
