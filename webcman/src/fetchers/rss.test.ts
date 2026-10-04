import { vi } from "vitest";
import { fetchRssItems } from "./rss";

global.fetch = vi.fn();

const SAMPLE_RSS = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Autism study 2026</title>
      <link>https://example.com/study-2026</link>
      <description>New findings in autism research.</description>
      <pubDate>Mon, 01 Jan 2026 10:00:00 +0000</pubDate>
    </item>
  </channel>
</rss>`;

it("returns parsed items from a valid RSS feed", async () => {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    text: async () => SAMPLE_RSS,
  } as Response);

  const items = await fetchRssItems("https://example.com/feed.xml", "example.com", 1);
  expect(items).toHaveLength(1);
  expect(items[0].title).toBe("Autism study 2026");
  expect(items[0].url).toBe("https://example.com/study-2026");
  expect(items[0].date).toBe("2026-01-01");
  expect(items[0].trustScore).toBe(1);
});

it("returns empty array on fetch failure", async () => {
  vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
  const items = await fetchRssItems("https://bad.com/feed.xml", "bad.com", 4);
  expect(items).toHaveLength(0);
});

it("strips HTML from descriptions", async () => {
  const rssWithHtml = `<rss><channel><item>
    <title>Test</title>
    <link>https://example.com/test</link>
    <description>&lt;p&gt;Clean text here.&lt;/p&gt;</description>
    <pubDate>Mon, 01 Jan 2026 10:00:00 +0000</pubDate>
  </item></channel></rss>`;
  vi.mocked(fetch).mockResolvedValueOnce({ ok: true, text: async () => rssWithHtml } as Response);
  const items = await fetchRssItems("https://example.com/feed.xml", "example.com", 2);
  expect(items[0].content).toBe("Clean text here.");
});
