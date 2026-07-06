import { describe, it, expect } from "vitest";
import { getNews } from "./content";

describe("news content", () => {
  it("has at least 5 news entries", () => {
    expect(getNews().length).toBeGreaterThanOrEqual(5);
  });

  it("has unique slugs", () => {
    const slugs = getNews().map((n) => n.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
