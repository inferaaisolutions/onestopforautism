import { describe, it, expect } from "vitest";
import { getTherapies } from "./content";

describe("therapies content", () => {
  it("has at least 12 therapy entries", () => {
    expect(getTherapies().length).toBeGreaterThanOrEqual(12);
  });

  it("has unique slugs", () => {
    const slugs = getTherapies().map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every entry has at least 2 sources", () => {
    for (const t of getTherapies()) {
      expect(t.sources.length).toBeGreaterThanOrEqual(2);
    }
  });
});
