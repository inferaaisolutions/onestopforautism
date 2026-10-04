import { fetchAllSources } from "./sources";
import { extractContent } from "./ai-extractor";
import { getExistingNewsUrls, writeScrapedNewsItem, isNewerThanExisting } from "./writeContent";
import { dedupe } from "./dedupe";
import { createLogger } from "./logger";
import { newsItemSchema } from "../src/lib/schema";

interface UpdateOptions {
  apiKey: string;
  redditClientId: string;
  redditClientSecret: string;
}

export async function runUpdate(opts: UpdateOptions): Promise<void> {
  if (!opts.apiKey) {
    console.error("Error: ANTHROPIC_API_KEY is not set in .env.local. Exiting.");
    process.exit(1);
  }

  const logger = createLogger();

  console.log("[ASD Guide] Fetching articles from trusted sources...");
  const articles = await fetchAllSources({
    redditClientId: opts.redditClientId,
    redditClientSecret: opts.redditClientSecret,
  });
  console.log(`[ASD Guide] Fetched ${articles.length} article(s).`);

  const existingUrls = getExistingNewsUrls();
  const fresh = dedupe(existingUrls, articles.map((a) => ({ ...a, sourceUrl: a.url })));
  console.log(`[ASD Guide] ${fresh.length} new article(s) after dedup.`);

  for (const article of fresh) {
    try {
      const extracted = await extractContent(article, "news", opts.apiKey);
      if (!extracted) {
        logger.logFailed(`Claude extraction failed: ${article.title}`);
        continue;
      }

      const validated = newsItemSchema.safeParse(extracted);
      if (!validated.success) {
        logger.logFailed(`Zod validation failed for "${article.title}": ${validated.error.issues[0]?.message}`);
        continue;
      }

      const newsItem = validated.data;

      if (!isNewerThanExisting(newsItem)) {
        logger.logSkipped();
        continue;
      }

      const alreadyExists = existingUrls.has(article.url);
      writeScrapedNewsItem(newsItem);

      if (alreadyExists) {
        logger.logUpdated(`news/${newsItem.slug}.json`);
        console.log(`  ~ Updated: ${newsItem.slug}`);
      } else {
        logger.logAdded(`news/${newsItem.slug}.json`);
        console.log(`  + Added:   ${newsItem.slug}`);
      }
    } catch (err) {
      logger.logFailed(`Unexpected error for "${article.title}": ${String(err)}`);
    }
  }

  logger.save();
  console.log("[ASD Guide] Update complete.");
}

// Run when executed directly
const isMain = process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/ai-update.ts") ||
               process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/ai-update.js");

if (isMain) {
  runUpdate({
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    redditClientId: process.env.REDDIT_CLIENT_ID ?? "",
    redditClientSecret: process.env.REDDIT_CLIENT_SECRET ?? "",
  }).catch(console.error);
}
