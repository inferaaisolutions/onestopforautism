import { vi } from "vitest";
import { vol } from "memfs";

vi.mock("fs", async () => {
  const { fs } = await import("memfs");
  return { default: fs };
});

it("saves a run log and returns stats", async () => {
  vol.reset();
  const { createRunLogger } = await import("./run-logger");
  const logger = createRunLogger("/.webcman");
  logger.logAdded("news/autism-study.json");
  logger.logBlocked("Some item with forbidden phrase");
  const saved = logger.save();
  expect(saved.added).toContain("news/autism-study.json");
  expect(saved.blocked).toHaveLength(1);
});
