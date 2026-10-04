import { fetchRssItems } from "./rss";
import type { RawItem } from "../types";

const PUBMED_DOMAIN = "pubmed.ncbi.nlm.nih.gov";

export async function fetchPubMedItems(
  searchTerm: string,
  limit = 20
): Promise<RawItem[]> {
  const encoded = encodeURIComponent(searchTerm);
  const feedUrl = `https://${PUBMED_DOMAIN}/rss/search/?term=${encoded}&sort=pubdate&limit=${limit}`;
  return fetchRssItems(feedUrl, PUBMED_DOMAIN, 1);
}
