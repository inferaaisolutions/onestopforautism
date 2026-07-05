import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
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

  it("throws descriptive error when therapy schema validation fails", () => {
    const therapiesDir = path.join(process.cwd(), "content", "therapies");
    const invalidTherapyFile = path.join(therapiesDir, "__test-invalid-schema__.json");

    try {
      // Create invalid therapy with empty slug (schema requires min(1))
      fs.writeFileSync(invalidTherapyFile, JSON.stringify({
        slug: "",
        name: "Invalid Therapy",
        description: "Test",
        evidenceLevel: "clinical",
        sources: ["http://example.com"]
      }));

      expect(() => getTherapies()).toThrow(/Invalid content file therapies\/__test-invalid-schema__\.json/);
    } finally {
      // Clean up
      if (fs.existsSync(invalidTherapyFile)) {
        fs.unlinkSync(invalidTherapyFile);
      }
    }
  });

  it("throws descriptive error when JSON is malformed", () => {
    const therapiesDir = path.join(process.cwd(), "content", "therapies");
    const malformedJsonFile = path.join(therapiesDir, "__test-malformed-json__.json");

    try {
      // Create file with syntactically invalid JSON
      fs.writeFileSync(malformedJsonFile, "{ not valid json");

      expect(() => getTherapies()).toThrow(/Malformed JSON in content file therapies\/__test-malformed-json__\.json/);
    } finally {
      // Clean up
      if (fs.existsSync(malformedJsonFile)) {
        fs.unlinkSync(malformedJsonFile);
      }
    }
  });
});
