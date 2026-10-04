import fs from "fs";
import path from "path";
import type { RunStats } from "./types";

export interface RunLog {
  date: string;
  stats: RunStats;
}

export function createRunLogger(webcmanDir: string) {
  const stats: RunStats = { added: [], updated: [], flagged: [], blocked: [], failed: [] };

  return {
    logAdded: (file: string) => stats.added.push(file),
    logUpdated: (file: string) => stats.updated.push(file),
    logFlagged: (file: string) => stats.flagged.push(file),
    logBlocked: (reason: string) => stats.blocked.push(reason),
    logFailed: (reason: string) => stats.failed.push(reason),
    save(): RunStats {
      const logsDir = path.join(webcmanDir, "logs");
      fs.mkdirSync(logsDir, { recursive: true });
      const date = new Date().toISOString().slice(0, 10);
      const logPath = path.join(logsDir, `${date}.json`);
      fs.writeFileSync(logPath, JSON.stringify({ date, stats }, null, 2));
      return stats;
    },
  };
}
