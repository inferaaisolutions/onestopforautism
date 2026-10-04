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

it("fetchAllSources returns RawArticles with expected shape", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    text: async () => RSS_XML,
    json: async () => ({ esearchresult: { idlist: [] }, data: { children: [] } }),
  }));

  const articles = await fetchAllSources({ redditClientId: "", redditClientSecret: "" });
  expect(Array.isArray(articles)).toBe(true);
  for (const a of articles) {
    expect(typeof a.title).toBe("string");
    expect(typeof a.url).toBe("string");
    expect(typeof a.source).toBe("string");
    expect(typeof a.content).toBe("string");
    expect(typeof a.date).toBe("string");
  }

  vi.unstubAllGlobals();
});

it("fetchAllSources does not throw if a source is unreachable", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

  const articles = await fetchAllSources({ redditClientId: "", redditClientSecret: "" });
  expect(Array.isArray(articles)).toBe(true);
  expect(articles).toHaveLength(0);

  vi.unstubAllGlobals();
});
