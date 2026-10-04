import { vi } from "vitest";
import { vol } from "memfs";

vi.mock("fs", async () => {
  const { fs } = await import("memfs");
  return { default: fs };
});

it("saves a version and lists it", async () => {
  vol.reset();
  const { saveVersion, listVersions } = await import("./history");
  saveVersion("news/test-item.json", { slug: "test-item", title: "Test" }, "/.webcman", 5);
  const versions = listVersions("news/test-item.json", "/.webcman");
  expect(versions).toHaveLength(1);
});

it("prunes versions beyond rollbackDepth", async () => {
  vol.reset();
  const { saveVersion, listVersions } = await import("./history");
  for (let i = 0; i < 7; i++) {
    await new Promise(r => setTimeout(r, 5)); // ensure different timestamps
    saveVersion("news/item.json", { version: i }, "/.webcman", 5);
  }
  const versions = listVersions("news/item.json", "/.webcman");
  expect(versions.length).toBeLessThanOrEqual(5);
});
