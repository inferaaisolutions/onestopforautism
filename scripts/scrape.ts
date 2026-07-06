import { fetchWebsiteFeedItems, mapFeedEntryToNewsItem } from "./scrapers/websites";
import { getExistingNewsUrls, writeScrapedNewsItem } from "./writeContent";
import { dedupe } from "./dedupe";

const NEWS_FEEDS: string[] = [
  "https://www.sciencedaily.com/rss/mind_brain/autism.xml",
  "https://www.thetransmitter.org/spectrum/feed/",
];

async function main() {
  const existingUrls = getExistingNewsUrls();
  let written = 0;

  for (const feedUrl of NEWS_FEEDS) {
    try {
      const entries = await fetchWebsiteFeedItems(feedUrl);
      const asNewsItems = entries.map((e) => mapFeedEntryToNewsItem(e));
      const fresh = dedupe(
        existingUrls,
        asNewsItems.map((n) => ({ ...n, sourceUrl: n.sources[0].url }))
      );
      for (const item of fresh) {
        writeScrapedNewsItem(item);
        written++;
      }
    } catch (err) {
      console.error(`Failed to fetch feed ${feedUrl}:`, err);
    }
  }

  console.log(`Scrape complete: ${written} new item(s) written.`);
}

main();
