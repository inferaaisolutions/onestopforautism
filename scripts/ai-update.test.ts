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
