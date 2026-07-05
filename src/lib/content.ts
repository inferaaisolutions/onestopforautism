import fs from "fs";
import path from "path";
import { z } from "zod";
import {
  therapySchema,
  behaviorSchema,
  newsItemSchema,
  resourceSchema,
  Therapy,
  Behavior,
  NewsItem,
  Resource,
} from "./schema";

const CONTENT_DIR = path.join(process.cwd(), "content");

function readJsonDir<T>(subdir: string, schema: z.ZodType<T>): T[] {
  const dir = path.join(CONTENT_DIR, subdir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
      const result = schema.safeParse(raw);
      if (!result.success) {
        throw new Error(`Invalid content file ${subdir}/${f}: ${result.error.message}`);
      }
      return result.data;
    });
}

export function getTherapies(): Therapy[] {
  return readJsonDir("therapies", therapySchema);
}

export function getTherapyBySlug(slug: string): Therapy | undefined {
  return getTherapies().find((t) => t.slug === slug);
}

export function getBehaviors(): Behavior[] {
  return readJsonDir("behaviors", behaviorSchema);
}

export function getBehaviorBySlug(slug: string): Behavior | undefined {
  return getBehaviors().find((b) => b.slug === slug);
}

export function getNews(): NewsItem[] {
  return readJsonDir("news", newsItemSchema).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getResources(): Resource[] {
  return readJsonDir("resources", resourceSchema);
}
