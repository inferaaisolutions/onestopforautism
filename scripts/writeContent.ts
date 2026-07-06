import fs from "fs";
import path from "path";
import { NewsItem } from "../src/lib/schema";

const CONTENT_DIR = path.join(process.cwd(), "content");

export function getExistingNewsUrls(): Set<string> {
  const dir = path.join(CONTENT_DIR, "news");
  if (!fs.existsSync(dir)) return new Set();
  const urls = new Set<string>();
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const item: NewsItem = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
    for (const s of item.sources) urls.add(s.url);
  }
  return urls;
}

export function writeScrapedNewsItem(item: NewsItem): void {
  const dir = path.join(CONTENT_DIR, "news");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${item.slug}.json`), JSON.stringify(item, null, 2));
}
