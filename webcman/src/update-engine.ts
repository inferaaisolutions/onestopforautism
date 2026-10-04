import fs from "fs";
import path from "path";
import { discoverSources } from "./source-discovery";
import { fetchRssItems } from "./fetchers/rss";
import { fetchPubMedItems } from "./fetchers/pubmed";
import { scoreUrl } from "./trust-scorer";
import { isSafeObject } from "./safety-filter";
import { extractItem } from "./extractor";
import { saveVersion } from "./history";
import type { WebCManConfig, SiteSchema, RawItem, RunStats } from "./types";

interface EngineOptions {
  config: WebCManConfig;
  apiKey: string;
  webcmanDir: string;
  contentTypes: string[];
  siteSchema: SiteSchema;
}

function getExistingUrls(contentTypeDir: string): Set<string> {
  const urls = new Set<string>();
  if (!fs.existsSync(contentTypeDir)) return urls;
  for (const file of fs.readdirSync(contentTypeDir).filter(f => f.endsWith(".json"))) {
    try {
      const item = JSON.parse(fs.readFileSync(path.join(contentTypeDir, file), "utf-8")) as Record<string, unknown>;
      const sources = item["sources"] as Array<{ url: string }> | undefined;
      sources?.forEach(s => urls.add(s.url));
    } catch { /* skip */ }
  }
  return urls;
}

function makeSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}

export async function runUpdateEngine(opts: EngineOptions): Promise<RunStats> {
  const stats: RunStats = { added: [], updated: [], flagged: [], blocked: [], failed: [] };
  const { config, apiKey, webcmanDir, contentTypes, siteSchema } = opts;

  const sources = await discoverSources(config.topic, apiKey, webcmanDir);

  for (const contentType of contentTypes) {
    const schema = siteSchema[contentType];
    if (!schema) continue;

    const contentTypeDir = path.join(config.contentDir, contentType);
    const existingUrls = getExistingUrls(contentTypeDir);

    const allItems: RawItem[] = [];
    for (const source of sources) {
      if (source.type === "pubmed") {
        const items = await fetchPubMedItems(config.topic);
        allItems.push(...items);
      } else {
        const score = scoreUrl(source.feedUrl, config);
        const items = await fetchRssItems(source.feedUrl, source.domain, score);
        allItems.push(...items);
      }
    }

    const seen = new Set(existingUrls);
    const fresh = allItems.filter(item => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });

    for (const rawItem of fresh) {
      try {
        const extracted = await extractItem(rawItem, contentType, schema, apiKey);
        if (!extracted) {
          stats.failed.push(`Extraction failed: ${rawItem.title}`);
          continue;
        }

        if (!isSafeObject(extracted, config.blockedPhrases)) {
          stats.blocked.push(`Blocked: ${rawItem.title}`);
          continue;
        }

        const slug = (extracted["slug"] as string) || makeSlug(rawItem.title);
        const relPath = `${contentType}/${slug}.json`;
        const filePath = path.join(config.contentDir, relPath);

        if (fs.existsSync(filePath)) {
          const existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          saveVersion(relPath, existing, webcmanDir, config.rollbackDepth);
          stats.updated.push(relPath);
        } else {
          stats.added.push(relPath);
        }

        if (extracted["conflictFlag"]) stats.flagged.push(relPath);

        fs.mkdirSync(contentTypeDir, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify({ ...extracted, slug, sourceType: "scraped" }, null, 2));
      } catch (err) {
        stats.failed.push(`Error for "${rawItem.title}": ${String(err)}`);
      }
    }
  }

  return stats;
}
