import { execSync } from "child_process";
import path from "path";

const PROJECT_DIR = path.resolve(process.cwd()).replace(/\//g, "\\");
const TSX_PATH = path.join(PROJECT_DIR, "node_modules", ".bin", "tsx");
const SCRIPT_PATH = path.join(PROJECT_DIR, "scripts", "ai-update.ts");
const TASK_NAME = "ASD-Guide-Daily-Update";
const RUN_COMMAND = `"${TSX_PATH}" "${SCRIPT_PATH}"`;

console.log("Setting up Windows Task Scheduler for daily AI content updates...\n");

// Remove existing task silently
try {
  execSync(`schtasks /delete /tn "${TASK_NAME}" /f`, { stdio: "pipe" });
  console.log("Removed existing scheduled task.");
} catch {
  // Task didn't exist — that's fine
}

// Register new daily task at 3:00 AM
try {
  execSync(
    `schtasks /create /tn "${TASK_NAME}" /tr "${RUN_COMMAND}" /sc daily /st 03:00 /f`,
    { cwd: PROJECT_DIR, stdio: "inherit" }
  );

  console.log(`\nTask "${TASK_NAME}" scheduled to run daily at 3:00 AM.`);
  console.log(`Script: ${SCRIPT_PATH}`);
  console.log(`Working dir: ${PROJECT_DIR}`);
  console.log("\nUseful commands:");
  console.log(`  Run now:   npm run ai-update`);
  console.log(`  Verify:    schtasks /query /tn "${TASK_NAME}"`);
  console.log(`  Remove:    schtasks /delete /tn "${TASK_NAME}" /f`);
} catch (err) {
  console.error("\nFailed to create scheduled task. You may need to run as Administrator.");
  console.error("To create manually, open Task Scheduler and run:");
  console.error(`  ${RUN_COMMAND}`);
  console.error(`  Working directory: ${PROJECT_DIR}`);
  process.exit(1);
}
