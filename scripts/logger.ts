import fs from "fs";
import path from "path";

interface LogEntry {
  date: string;
  added: string[];
  updated: string[];
  skipped: number;
  failed: number;
  failureReasons: string[];
}

interface Logger {
  logAdded(file: string): void;
  logUpdated(file: string): void;
  logSkipped(): void;
  logFailed(reason: string): void;
  save(): void;
}

export function createLogger(logsDir = path.join(process.cwd(), "logs")): Logger {
  const today = new Date().toISOString().split("T")[0];
  const logPath = path.join(logsDir, `ai-update-${today}.json`);

  const entry: LogEntry = fs.existsSync(logPath)
    ? JSON.parse(fs.readFileSync(logPath, "utf-8"))
    : { date: today, added: [], updated: [], skipped: 0, failed: 0, failureReasons: [] };

  return {
    logAdded(file) { entry.added.push(file); },
    logUpdated(file) { entry.updated.push(file); },
    logSkipped() { entry.skipped++; },
    logFailed(reason) { entry.failed++; entry.failureReasons.push(reason); },
    save() {
      fs.mkdirSync(logsDir, { recursive: true });
      fs.writeFileSync(logPath, JSON.stringify(entry, null, 2));
      console.log(`Log: +${entry.added.length} added, ~${entry.updated.length} updated, ${entry.skipped} skipped, ${entry.failed} failed`);
    },
  };
}
