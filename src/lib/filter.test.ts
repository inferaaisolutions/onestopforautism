import { describe, it, expect } from "vitest";
import { filterTherapies, filterBehaviors } from "./filter";
import { Therapy, Behavior } from "./schema";

const therapy = (overrides: Partial<Therapy>): Therapy => ({
  slug: "t",
  name: "Speech Therapy",
  category: "Communication",
  summary: "Helps with communication",
  description: "desc",
  claimedBenefits: ["benefit"],
  evidenceNotes: "notes",
  evidenceLevel: "clinical",
  regions: ["Global"],
  sources: [{ label: "Source", url: "https://example.org" }],
  image: "img.jpg",
  sourceType: "seed",
  updatedAt: "2026-01-01",
  ...overrides,
});

describe("filterTherapies", () => {
  it("matches by name substring, case-insensitive", () => {
    const therapies = [therapy({ name: "Speech Therapy" }), therapy({ slug: "b", name: "Music Therapy" })];
    expect(filterTherapies(therapies, "speech")).toHaveLength(1);
  });

  it("filters by evidence level", () => {
    const therapies = [
      therapy({ slug: "a", evidenceLevel: "clinical" }),
      therapy({ slug: "b", evidenceLevel: "anecdotal" }),
    ];
    expect(filterTherapies(therapies, "", "anecdotal")).toHaveLength(1);
  });

  it("returns all therapies for an empty query and no evidence filter", () => {
    const therapies = [therapy({ slug: "a" }), therapy({ slug: "b" })];
    expect(filterTherapies(therapies, "")).toHaveLength(2);
  });
});

describe("filterBehaviors", () => {
  const behavior = (overrides: Partial<Behavior>): Behavior => ({
    slug: "meltdowns",
    name: "Meltdowns",
    summary: "Overwhelm response",
    triggers: ["noise"],
    remedies: [{ text: "quiet space", evidenceLevel: "anecdotal" }],
    sources: [{ label: "Source", url: "https://example.org" }],
    sourceType: "seed",
    updatedAt: "2026-01-01",
    ...overrides,
  });

  it("matches by name or summary substring", () => {
    const behaviors = [behavior({ slug: "a", name: "Meltdowns" }), behavior({ slug: "b", name: "Stimming" })];
    expect(filterBehaviors(behaviors, "melt")).toHaveLength(1);
  });
});
