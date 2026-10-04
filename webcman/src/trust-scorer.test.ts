import { scoreDomain, scoreUrl } from "./trust-scorer";
import type { WebCManConfig } from "./types";

const config: WebCManConfig = {
  topic: "autism",
  contentDir: "./content",
  schedule: "0 10 * * *",
  blockedPhrases: [],
  rollbackDepth: 5,
  trustTiers: {
    tier1: ["pubmed.ncbi.nlm.nih.gov", "cochranelibrary.com", "who.int"],
    tier2: ["nih.gov", "autismspeaks.org", "cdc.gov"],
    tier3: ["sciencedaily.com", "thetransmitter.org"],
    tier4: ["reddit.com"],
  },
};

it("scores pubmed as tier 1", () => {
  expect(scoreDomain("pubmed.ncbi.nlm.nih.gov", config)).toBe(1);
});
it("scores nih.gov as tier 2", () => {
  expect(scoreDomain("nih.gov", config)).toBe(2);
});
it("scores sciencedaily as tier 3", () => {
  expect(scoreDomain("sciencedaily.com", config)).toBe(3);
});
it("scores unknown domain as tier 4", () => {
  expect(scoreDomain("somerandomblog.com", config)).toBe(4);
});
it("scoreUrl works with a full URL", () => {
  expect(scoreUrl("https://www.who.int/news/article", config)).toBe(1);
});
it("scoreUrl returns 4 for invalid URL", () => {
  expect(scoreUrl("not-a-url", config)).toBe(4);
});
