import fs from "fs";
import path from "path";
import { createLogger } from "./logger";

const TEST_LOGS_DIR = path.join(process.cwd(), "logs-test-tmp");

beforeEach(() => fs.mkdirSync(TEST_LOGS_DIR, { recursive: true }));
afterEach(() => fs.rmSync(TEST_LOGS_DIR, { recursive: true, force: true }));

it("saves a log file with correct structure", () => {
  const logger = createLogger(TEST_LOGS_DIR);
  logger.logAdded("news/test.json");
  logger.logUpdated("therapies/aba.json");
  logger.logSkipped();
  logger.logSkipped();
  logger.logFailed("Zod validation failed");
  logger.save();

  const files = fs.readdirSync(TEST_LOGS_DIR);
  expect(files).toHaveLength(1);
  expect(files[0]).toMatch(/^ai-update-\d{4}-\d{2}-\d{2}\.json$/);

  const log = JSON.parse(fs.readFileSync(path.join(TEST_LOGS_DIR, files[0]), "utf-8"));
  expect(log.added).toEqual(["news/test.json"]);
  expect(log.updated).toEqual(["therapies/aba.json"]);
  expect(log.skipped).toBe(2);
  expect(log.failed).toBe(1);
  expect(log.failureReasons).toEqual(["Zod validation failed"]);
});

it("appends to the same log file if called twice in one day", () => {
  const logger = createLogger(TEST_LOGS_DIR);
  logger.logAdded("news/a.json");
  logger.save();

  const logger2 = createLogger(TEST_LOGS_DIR);
  logger2.logAdded("news/b.json");
  logger2.save();

  const files = fs.readdirSync(TEST_LOGS_DIR);
  expect(files).toHaveLength(1);
  const log = JSON.parse(fs.readFileSync(path.join(TEST_LOGS_DIR, files[0]), "utf-8"));
  expect(log.added).toEqual(["news/a.json", "news/b.json"]);
});
