import fs from "fs";
import path from "path";

function historyDir(relPath: string, webcmanDir: string): string {
  const slug = relPath.replace(/[/\\]/g, "__").replace(/\.json$/, "");
  return path.join(webcmanDir, "history", slug);
}

export function saveVersion(
  relPath: string,
  content: unknown,
  webcmanDir: string,
  rollbackDepth: number
): void {
  const dir = historyDir(relPath, webcmanDir);
  fs.mkdirSync(dir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.writeFileSync(path.join(dir, `${timestamp}.json`), JSON.stringify(content, null, 2));

  const versions = fs.readdirSync(dir).sort();
  while (versions.length > rollbackDepth) {
    fs.unlinkSync(path.join(dir, versions.shift()!));
  }
}

export function listVersions(relPath: string, webcmanDir: string): string[] {
  const dir = historyDir(relPath, webcmanDir);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).sort().reverse();
}

export function restoreVersion(
  relPath: string,
  timestamp: string,
  webcmanDir: string,
  contentDir: string
): boolean {
  const dir = historyDir(relPath, webcmanDir);
  const versionFile = fs.readdirSync(dir).find(f => f.startsWith(timestamp));
  if (!versionFile) return false;
  const content = fs.readFileSync(path.join(dir, versionFile), "utf-8");
  const target = path.join(contentDir, relPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  return true;
}
