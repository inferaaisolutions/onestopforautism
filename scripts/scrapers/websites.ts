import { NewsItem } from "../../src/lib/schema";

interface FeedEntry {
  title: string;
  summary: string;
  link: string;
  isoDate?: string;
}

export function mapFeedEntryToNewsItem(entry: FeedEntry, region?: string): NewsItem {
  const slug = entry.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  return {
    slug,
    title: entry.title,
    summary: entry.summary,
    date: (entry.isoDate ?? new Date().toISOString()).slice(0, 10),
    region,
    sources: [{ label: "Source article", url: entry.link }],
    sourceType: "scraped",
  };
}

export async function fetchWebsiteFeedItems(feedUrl: string): Promise<FeedEntry[]> {
  const res = await fetch(feedUrl);
  if (!res.ok) return [];
  const xml = await res.text();
  const items: FeedEntry[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml))) {
    const block = match[1];
    const title = /<title>([\s\S]*?)<\/title>/.exec(block)?.[1]?.trim() ?? "";
    const link = /<link>([\s\S]*?)<\/link>/.exec(block)?.[1]?.trim() ?? "";
    const summary = /<description>([\s\S]*?)<\/description>/.exec(block)?.[1]?.trim() ?? "";
    const isoDate = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(block)?.[1]?.trim();
    if (title && link) items.push({ title, link, summary, isoDate });
  }
  return items;
}
