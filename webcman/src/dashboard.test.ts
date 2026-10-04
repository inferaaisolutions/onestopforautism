import { generateDashboard } from "./dashboard";
import type { RunStats } from "./types";

it("generates HTML with correct stats", () => {
  const stats: RunStats = {
    added: ["news/item1.json", "news/item2.json"],
    updated: ["therapies/aba.json"],
    flagged: [],
    blocked: ["Blocked phrase detected"],
    failed: [],
  };
  const html = generateDashboard([{ date: "2026-10-04", stats }]);
  expect(html).toContain("WebCMan Dashboard");
  expect(html).toContain("2 added");
  expect(html).toContain("1 updated");
  expect(html).toContain("1 blocked");
});
