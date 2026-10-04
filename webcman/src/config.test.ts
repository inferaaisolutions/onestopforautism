import { vi } from "vitest";
import { loadConfig } from "./config";

vi.mock("fs", () => {
  const readFileSyncMock = vi.fn();
  return {
    default: { readFileSync: readFileSyncMock },
    readFileSync: readFileSyncMock,
  };
});

it("parses a valid config", async () => {
  const { readFileSync } = await import("fs");
  vi.mocked(readFileSync).mockReturnValue(JSON.stringify({
    topic: "autism therapies",
    contentDir: "./content",
  }));
  const config = loadConfig("/fake/path/webcman.config.json");
  expect(config.topic).toBe("autism therapies");
  expect(config.rollbackDepth).toBe(5);
  expect(config.blockedPhrases).toContain("consult your doctor");
});

it("throws on missing topic", async () => {
  const { readFileSync } = await import("fs");
  vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ contentDir: "./content" }));
  expect(() => loadConfig("/fake/path/webcman.config.json")).toThrow();
});
