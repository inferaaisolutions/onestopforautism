import type { RunStats } from "./types";

interface LogEntry {
  date: string;
  stats: RunStats;
}

export function generateDashboard(logs: LogEntry[]): string {
  const latest = logs[0];
  const s = latest?.stats ?? { added: [], updated: [], flagged: [], blocked: [], failed: [] };

  const rows = logs.map(log => {
    const { added, updated, flagged, blocked, failed } = log.stats;
    return `<tr>
      <td>${log.date}</td>
      <td>${added.length} added</td>
      <td>${updated.length} updated</td>
      <td>${flagged.length} flagged</td>
      <td>${blocked.length} blocked</td>
      <td>${failed.length} failed</td>
    </tr>`;
  }).join("\n");

  const addedList = s.added.map(f => `<li>${f}</li>`).join("");
  const flaggedList = s.flagged.map(f => `<li class="flag">${f}</li>`).join("");
  const blockedList = s.blocked.map(f => `<li class="block">${f}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>WebCMan Dashboard</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
    h1 { color: #0f172a; } h2 { color: #334155; margin-top: 32px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { padding: 8px 12px; border: 1px solid #e2e8f0; text-align: left; }
    th { background: #f8fafc; }
    ul { list-style: none; padding: 0; }
    li { padding: 4px 0; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
    li.flag { color: #b45309; } li.block { color: #dc2626; }
  </style>
</head>
<body>
  <h1>WebCMan Dashboard</h1>
  <p>Last run: ${latest?.date ?? "never"}</p>
  <h2>Run History</h2>
  <table>
    <thead><tr><th>Date</th><th>Added</th><th>Updated</th><th>Flagged</th><th>Blocked</th><th>Failed</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <h2>Latest — Added (${s.added.length})</h2>
  <ul>${addedList || "<li>None</li>"}</ul>
  <h2>Flagged (${s.flagged.length})</h2>
  <ul>${flaggedList || "<li>None</li>"}</ul>
  <h2>Blocked (${s.blocked.length})</h2>
  <ul>${blockedList || "<li>None</li>"}</ul>
</body>
</html>`;
}
