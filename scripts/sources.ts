import { XMLParser } from "fast-xml-parser";

export interface RawArticle {
  title: string;
  url: string;
  source: string;
  content: string;
  date: string;
}

interface SourceConfig {
  name: string;
  url: string;
  type: "rss" | "pubmed";
}

export const TRUSTED_SOURCES: SourceConfig[] = [
  { name: "PubMed",        url: "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=autism&sort=date&retmax=5&retmode=json", type: "pubmed" },
  { name: "Cochrane",      url: "https://www.cochranelibrary.com/feed/rss",                type: "rss" },
  { name: "NIH",           url: "https://www.nih.gov/rss/news/news.xml",                   type: "rss" },
  { name: "Autism Speaks", url: "https://www.autismspeaks.org/news/rss.xml",               type: "rss" },
  { name: "ABAI",          url: "https://www.abainternational.org/rss.xml",                type: "rss" },
  { name: "WHO",           url: "https://www.who.int/rss-feeds/news-english.xml",          type: "rss" },
  { name: "Reddit",        url: "https://www.reddit.com/r/autism+Autism_Parenting/top.json?t=day&limit=5", type: "rss" },
];

const xmlParser = new XMLParser({ ignoreAttributes: false });

function toDate(raw: unknown): string {
  try {
    return new Date(String(raw)).toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

async function fetchRSS(source: SourceConfig): Promise<RawArticle[]> {
  try {
    const res = await fetch(source.url, { headers: { "User-Agent": "ASD-Guide-Bot/1.0" } });
    if (!res.ok) return [];
    const xml = await res.text();
    const parsed = xmlParser.parse(xml);
    const rawItems =
      parsed?.rss?.channel?.item ??
      parsed?.feed?.entry ??
      [];
    const items: Record<string, unknown>[] = Array.isArray(rawItems) ? rawItems : [rawItems];

    return items.slice(0, 5).map((item) => ({
      title: String(item["title"] ?? "").trim(),
      url: String(item["link"] ?? item["guid"] ?? "").trim(),
      source: source.name,
      content: String(item["description"] ?? item["summary"] ?? item["title"] ?? "").trim(),
      date: toDate(item["pubDate"] ?? item["published"]),
    })).filter((a) => a.title && a.url);
  } catch {
    return [];
  }
}

async function fetchPubMed(): Promise<RawArticle[]> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
    const searchUrl =
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi` +
      `?db=pubmed&term=autism&sort=date&retmax=5&retmode=json&mindate=${yesterday}&maxdate=${today}`;

    const res = await fetch(searchUrl, { headers: { "User-Agent": "ASD-Guide-Bot/1.0" } });
    if (!res.ok) return [];

    const data = (await res.json()) as { esearchresult: { idlist: string[] } };
    const ids = data.esearchresult?.idlist ?? [];
    if (ids.length === 0) return [];

    const summaryUrl =
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi` +
      `?db=pubmed&id=${ids.join(",")}&retmode=json`;
    const sumRes = await fetch(summaryUrl, { headers: { "User-Agent": "ASD-Guide-Bot/1.0" } });
    if (!sumRes.ok) return [];

    const sumData = (await sumRes.json()) as {
      result: Record<string, { title: string; pubdate: string }>;
    };

    return ids.flatMap((id) => {
      const item = sumData.result[id];
      if (!item?.title) return [];
      return [{
        title: item.title,
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        source: "PubMed",
        content: item.title, // esummary basic mode; abstract requires efetch
        date: toDate(item.pubdate),
      }];
    }).slice(0, 5);
  } catch {
    return [];
  }
}

async function fetchReddit(): Promise<RawArticle[]> {
  try {
    const res = await fetch(
      "https://www.reddit.com/r/autism+Autism_Parenting/top.json?t=day&limit=5",
      { headers: { "User-Agent": "ASD-Guide-Bot/1.0" } }
    );
    if (!res.ok) return [];
    const data = await res.json() as {
      data?: { children?: Array<{ data: { title: string; url: string; selftext: string; created_utc: number } }> }
    };
    const posts = data.data?.children ?? [];
    return posts.map((p) => ({
      title: p.data.title,
      url: p.data.url.startsWith("http") ? p.data.url : `https://reddit.com${p.data.url}`,
      source: "Reddit",
      content: p.data.selftext?.slice(0, 500) || p.data.title,
      date: new Date(p.data.created_utc * 1000).toISOString().split("T")[0],
    })).filter((a) => a.title && a.url);
  } catch {
    return [];
  }
}

export async function fetchAllSources(opts: {
  redditClientId: string;
  redditClientSecret: string;
}): Promise<RawArticle[]> {
  const rssSources = TRUSTED_SOURCES.filter((s) => s.type === "rss" && s.name !== "Reddit");
  const results = await Promise.allSettled([
    fetchPubMed(),
    ...rssSources.map((s) => fetchRSS(s)),
    fetchReddit(),
  ]);
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
