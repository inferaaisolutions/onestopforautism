import { describe, it, expect } from "vitest";
import { getBehaviors } from "./content";

describe("behaviors content", () => {
  it("has at least 10 behavior entries", () => {
    expect(getBehaviors().length).toBeGreaterThanOrEqual(10);
  });

  it("has unique slugs", () => {
    const slugs = getBehaviors().map((b) => b.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every entry has at least 3 triggers and 2 remedies", () => {
    for (const b of getBehaviors()) {
      expect(b.triggers.length).toBeGreaterThanOrEqual(3);
      expect(b.remedies.length).toBeGreaterThanOrEqual(2);
    }
  });
});
