import fs from "fs";
import path from "path";

export interface LogEntry {
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
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const logPath = path.join(logsDir, `ai-update-${today}.json`);

  let entry: LogEntry;
  if (fs.existsSync(logPath)) {
    try {
      entry = JSON.parse(fs.readFileSync(logPath, "utf-8")) as LogEntry;
    } catch {
      entry = { date: today, added: [], updated: [], skipped: 0, failed: 0, failureReasons: [] };
    }
  } else {
    entry = { date: today, added: [], updated: [], skipped: 0, failed: 0, failureReasons: [] };
  }

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
