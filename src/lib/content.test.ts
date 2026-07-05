import { describe, it, expect } from "vitest";
import { getTherapies, getTherapyBySlug, getBehaviors, getNews, getResources } from "./content";

describe("content loaders", () => {
  it("loads at least one therapy and every entry matches the schema", () => {
    const therapies = getTherapies();
    expect(therapies.length).toBeGreaterThan(0);
    for (const t of therapies) {
      expect(t.slug).toBeTruthy();
      expect(["clinical", "emerging", "anecdotal"]).toContain(t.evidenceLevel);
      expect(t.sources.length).toBeGreaterThan(0);
    }
  });

  it("finds a therapy by slug", () => {
    const first = getTherapies()[0];
    expect(getTherapyBySlug(first.slug)?.name).toBe(first.name);
  });

  it("returns undefined for an unknown slug", () => {
    expect(getTherapyBySlug("does-not-exist")).toBeUndefined();
  });

  it("loads behaviors, news, and resources", () => {
    expect(getBehaviors().length).toBeGreaterThan(0);
    expect(getNews().length).toBeGreaterThan(0);
    expect(getResources().length).toBeGreaterThan(0);
  });

  it("sorts news newest first", () => {
    const news = getNews();
    for (let i = 1; i < news.length; i++) {
      expect(news[i - 1].date >= news[i].date).toBe(true);
    }
  });
});
