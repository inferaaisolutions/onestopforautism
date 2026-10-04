import type { WebCManConfig } from "./types";

export function scoreDomain(domain: string, config: WebCManConfig): number {
  const d = domain.replace(/^www\./, "");
  const tiers = config.trustTiers;
  if (tiers.tier1.some(t => d.includes(t))) return 1;
  if (tiers.tier2.some(t => d.includes(t))) return 2;
  if (tiers.tier3.some(t => d.includes(t))) return 3;
  return 4;
}

export function scoreUrl(url: string, config: WebCManConfig): number {
  try {
    return scoreDomain(new URL(url).hostname, config);
  } catch {
    return 4;
  }
}
