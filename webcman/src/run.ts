import { readFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

import { loadConfig } from "./config";
import { inferSiteSchema } from "./schema-inferrer";
import { runUpdateEngine } from "./update-engine";
import { createRunLogger } from "./run-logger";
import { generateDashboard } from "./dashboard";
import { sendNewsletter } from "./newsletter";

const WEBCMAN_DIR = path.join(process.cwd(), ".webcman");
const CONFIG_PATH = path.join(process.cwd(), "webcman.config.json");

function loadEnv(): void {
  try {
    const lines = readFileSync(join(process.cwd(), ".env.local"), "utf-8").split("\n");
    for (const line of lines) {
      const eq = line.indexOf("=");
      if (eq > 0) {
        const key = line.slice(0, eq).trim();
        const val = line.slice(eq + 1).trim();
        if (key && !process.env[key]) process.env[key] = val;
      }
    }
  } catch { /* .env.local not present */ }
}

async function main(): Promise<void> {
  loadEnv();

  const apiKey = process.env.GROQ_API_KEY ?? "";
  if (!apiKey) {
    console.error("[WebCMan] GROQ_API_KEY is not set. Get a free key at console.groq.com. Exiting.");
    process.exit(1);
  }

  console.log("[WebCMan] Loading config...");
  const config = loadConfig(CONFIG_PATH);

  console.log("[WebCMan] Inferring content schemas...");
  const siteSchema = inferSiteSchema(config.contentDir);
  const contentTypes = Object.keys(siteSchema);
  console.log(`[WebCMan] Found content types: ${contentTypes.join(", ")}`);

  console.log("[WebCMan] Running update engine...");
  const stats = await runUpdateEngine({
    config,
    apiKey,
    webcmanDir: WEBCMAN_DIR,
    contentTypes,
    siteSchema,
  });

  const logger = createRunLogger(WEBCMAN_DIR);
  stats.added.forEach(f => logger.logAdded(f));
  stats.updated.forEach(f => logger.logUpdated(f));
  stats.flagged.forEach(f => logger.logFlagged(f));
  stats.blocked.forEach(b => logger.logBlocked(b));
  stats.failed.forEach(f => logger.logFailed(f));
  logger.save();

  console.log(`[WebCMan] Done. +${stats.added.length} added, ~${stats.updated.length} updated, ${stats.flagged.length} flagged, ${stats.blocked.length} blocked, ${stats.failed.length} failed.`);

  // Send newsletter if new articles were added
  const resendKey = process.env.RESEND_API_KEY ?? "";
  const audienceId = process.env.RESEND_AUDIENCE_ID ?? "";
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  if (stats.added.length > 0 && resendKey && audienceId && fromEmail && siteUrl) {
    console.log("[WebCMan] Sending newsletter...");
    try {
      await sendNewsletter(stats.added, config.contentDir, resendKey, audienceId, fromEmail, siteUrl);
      console.log(`[WebCMan] Newsletter sent to subscribers.`);
    } catch (err) {
      console.error("[WebCMan] Newsletter send failed:", String(err));
    }
  }

  // Generate dashboard
  const logsDir = path.join(WEBCMAN_DIR, "logs");
  const logEntries = fs.existsSync(logsDir)
    ? fs.readdirSync(logsDir).sort().reverse().slice(0, 30).map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(logsDir, f), "utf-8")); } catch { return null; }
      }).filter(Boolean)
    : [];

  const dashboardHtml = generateDashboard(logEntries as Array<{ date: string; stats: typeof stats }>);
  fs.mkdirSync(path.join(process.cwd(), "public"), { recursive: true });
  fs.writeFileSync(path.join(process.cwd(), "public", "webcman.html"), dashboardHtml);
  console.log("[WebCMan] Dashboard written to public/webcman.html");

  // Git commit if running in CI
  if (process.env.CI) {
    const added = stats.added.length;
    const updated = stats.updated.length;
    const flagged = stats.flagged.length;
    const blocked = stats.blocked.length;
    if (added + updated > 0) {
      execSync("git config user.name 'webcman-bot'");
      execSync("git config user.email 'webcman@users.noreply.github.com'");
      execSync("git add content/ public/webcman.html .webcman/");
      execSync(`git commit -m "webcman: add ${added}, update ${updated}, flag ${flagged} conflicts, block ${blocked}"`);
      execSync("git push");
      console.log("[WebCMan] Committed and pushed changes.");
    } else {
      console.log("[WebCMan] No changes to commit.");
    }
  }
}

main().catch(err => {
  console.error("[WebCMan] Fatal error:", err);
  process.exit(1);
});
