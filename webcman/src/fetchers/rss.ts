import type { RawItem } from "../types";

function stripHtml(str: string): string {
  return str
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(raw: string | undefined): string {
  if (!raw) return new Date().toISOString().slice(0, 10);
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

export async function fetchRssItems(
  feedUrl: string,
  sourceDomain: string,
  trustScore: number
): Promise<RawItem[]> {
  try {
    const res = await fetch(feedUrl);
    if (!res.ok) return [];
    const xml = await res.text();
    const items: RawItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;
    while ((match = itemRegex.exec(xml))) {
      const block = match[1];
      const title = stripHtml(/<title>([\s\S]*?)<\/title>/.exec(block)?.[1] ?? "");
      const url = /<link>([\s\S]*?)<\/link>/.exec(block)?.[1]?.trim() ?? "";
      const content = stripHtml(/<description>([\s\S]*?)<\/description>/.exec(block)?.[1] ?? "") || title;
      const rawDate = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(block)?.[1]?.trim();
      if (title && url) {
        items.push({ title, url, content, date: parseDate(rawDate), sourceDomain, trustScore });
      }
    }
    return items;
  } catch {
    return [];
  }
}
