import { describe, it, expect } from "vitest";
import { dedupe } from "./dedupe";

interface Item {
  sourceUrl: string;
  title: string;
}

describe("dedupe", () => {
  it("removes items whose sourceUrl already exists", () => {
    const existing = new Set(["https://a.com/1"]);
    const items: Item[] = [
      { sourceUrl: "https://a.com/1", title: "old" },
      { sourceUrl: "https://a.com/2", title: "new" },
    ];
    expect(dedupe(existing, items)).toEqual([{ sourceUrl: "https://a.com/2", title: "new" }]);
  });

  it("removes duplicates within the same batch, keeping the first", () => {
    const items: Item[] = [
      { sourceUrl: "https://a.com/2", title: "first" },
      { sourceUrl: "https://a.com/2", title: "duplicate" },
    ];
    expect(dedupe(new Set(), items)).toEqual([{ sourceUrl: "https://a.com/2", title: "first" }]);
  });

  it("returns an empty array when everything is a duplicate", () => {
    const existing = new Set(["https://a.com/1"]);
    expect(dedupe(existing, [{ sourceUrl: "https://a.com/1", title: "x" }])).toEqual([]);
  });
});
