import fs from "fs";
import path from "path";
import { writeScrapedNewsItem, isNewerThanExisting } from "./writeContent";
import type { NewsItem } from "../src/lib/schema";

const TEST_DIR = path.join(process.cwd(), "content-tmp");

beforeEach(() => fs.mkdirSync(path.join(TEST_DIR, "news"), { recursive: true }));
afterEach(() => fs.rmSync(TEST_DIR, { recursive: true, force: true }));

const item: NewsItem = {
  slug: "2026-10-01-test",
  title: "Test item",
  summary: "Research suggests X.",
  date: "2026-10-01",
  sources: [{ label: "Test", url: "https://example.com" }],
  sourceType: "scraped",
};

it("isNewerThanExisting returns true when file does not exist", () => {
  expect(isNewerThanExisting(item, TEST_DIR)).toBe(true);
});

it("isNewerThanExisting returns false when existing file has same date", () => {
  fs.writeFileSync(path.join(TEST_DIR, "news", "2026-10-01-test.json"), JSON.stringify(item));
  expect(isNewerThanExisting(item, TEST_DIR)).toBe(false);
});

it("isNewerThanExisting returns true when new item is newer", () => {
  fs.writeFileSync(path.join(TEST_DIR, "news", "2026-10-01-test.json"), JSON.stringify(item));
  const newer: NewsItem = { ...item, date: "2026-12-01" };
  expect(isNewerThanExisting(newer, TEST_DIR)).toBe(true);
});

it("writeScrapedNewsItem writes file to correct path", () => {
  writeScrapedNewsItem(item, TEST_DIR);
  const written = JSON.parse(fs.readFileSync(path.join(TEST_DIR, "news", "2026-10-01-test.json"), "utf-8"));
  expect(written.slug).toBe(item.slug);
  expect(written.title).toBe(item.title);
});
