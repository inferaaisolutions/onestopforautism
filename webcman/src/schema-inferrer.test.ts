import { vi, describe, it, expect } from "vitest";
import { vol } from "memfs";

vi.mock("fs", () => {
  const memfs = require("memfs");
  return {
    default: memfs.fs,
    ...memfs.fs,
  };
});

vi.mock("path", async () => {
  return await vi.importActual("path");
});

describe("schema-inferrer", () => {
  it("infers required and optional fields from JSON files", async () => {
    vol.reset();
    vol.fromJSON({
      "/content/news/item1.json": JSON.stringify({ slug: "a", title: "T1", summary: "S1", date: "2026-01-01", sources: [], sourceType: "scraped" }),
      "/content/news/item2.json": JSON.stringify({ slug: "b", title: "T2", summary: "S2", date: "2026-01-02", sources: [], sourceType: "scraped", region: "US" }),
    });

    const { inferSiteSchema } = await import("./schema-inferrer");
    const schema = inferSiteSchema("/content");

    expect(schema["news"]).toBeDefined();
    expect(schema["news"]["slug"].required).toBe(true);
    expect(schema["news"]["region"].required).toBe(false);
    expect(schema["news"]["title"].type).toBe("string");
    expect(schema["news"]["sources"].type).toBe("array");
  });

  it("returns empty schema for non-existent content dir", async () => {
    const { inferSiteSchema } = await import("./schema-inferrer");
    const schema = inferSiteSchema("/does-not-exist");
    expect(Object.keys(schema)).toHaveLength(0);
  });
});
