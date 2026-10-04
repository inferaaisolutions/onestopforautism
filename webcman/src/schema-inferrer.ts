import fs from "fs";
import path from "path";
import type { SiteSchema, ContentSchema, FieldInfo } from "./types";

function detectType(value: unknown): FieldInfo["type"] {
  if (Array.isArray(value)) return "array";
  if (value === null) return "string";
  return typeof value as FieldInfo["type"];
}

function inferSchema(files: Record<string, unknown>[]): ContentSchema {
  if (files.length === 0) return {};
  const fieldCounts: Record<string, number> = {};
  const fieldTypes: Record<string, FieldInfo["type"]> = {};

  for (const file of files) {
    for (const [key, val] of Object.entries(file)) {
      fieldCounts[key] = (fieldCounts[key] ?? 0) + 1;
      fieldTypes[key] = detectType(val);
    }
  }

  const schema: ContentSchema = {};
  for (const [key, count] of Object.entries(fieldCounts)) {
    schema[key] = {
      type: fieldTypes[key],
      required: count / files.length >= 0.8,
    };
  }
  return schema;
}

export function inferSiteSchema(contentDir: string): SiteSchema {
  const siteSchema: SiteSchema = {};
  if (!fs.existsSync(contentDir)) return siteSchema;

  for (const subdir of fs.readdirSync(contentDir)) {
    const dirPath = path.join(contentDir, subdir);
    if (!fs.statSync(dirPath).isDirectory()) continue;

    const files: Record<string, unknown>[] = [];
    for (const file of fs.readdirSync(dirPath).filter(f => f.endsWith(".json"))) {
      try {
        files.push(JSON.parse(fs.readFileSync(path.join(dirPath, file), "utf-8")));
      } catch { /* skip malformed */ }
    }
    if (files.length > 0) siteSchema[subdir] = inferSchema(files);
  }
  return siteSchema;
}
