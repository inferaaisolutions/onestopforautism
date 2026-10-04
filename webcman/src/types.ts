export interface WebCManConfig {
  topic: string;
  contentDir: string;
  schedule: string;
  trustTiers: {
    tier1: string[];
    tier2: string[];
    tier3: string[];
    tier4: string[];
  };
  blockedPhrases: string[];
  rollbackDepth: number;
}

export interface FieldInfo {
  type: "string" | "number" | "boolean" | "array" | "object";
  required: boolean;
}

export type ContentSchema = Record<string, FieldInfo>;
export type SiteSchema = Record<string, ContentSchema>;

export interface RawItem {
  title: string;
  url: string;
  content: string;
  date: string;
  sourceDomain: string;
  trustScore: number;
}

export interface DiscoveredSource {
  feedUrl: string;
  domain: string;
  type: "rss" | "pubmed";
}

export interface RunStats {
  added: string[];
  updated: string[];
  flagged: string[];
  blocked: string[];
  failed: string[];
}
