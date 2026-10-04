import { readFileSync } from "fs";
import { z } from "zod";
import type { WebCManConfig } from "./types";

const ConfigSchema = z.object({
  topic: z.string().min(1),
  contentDir: z.string().default("./content"),
  schedule: z.string().default("0 10 * * *"),
  trustTiers: z.object({
    tier1: z.array(z.string()).default([]),
    tier2: z.array(z.string()).default([]),
    tier3: z.array(z.string()).default([]),
    tier4: z.array(z.string()).default([]),
  }).default({}),
  blockedPhrases: z.array(z.string()).default([
    "consult your doctor",
    "consult a physician",
    "medical advice",
    "seek medical attention",
    "talk to your doctor",
    "see a doctor",
    "clinical recommendation",
  ]),
  rollbackDepth: z.number().int().min(1).default(5),
});

export function loadConfig(configPath: string): WebCManConfig {
  const raw = JSON.parse(readFileSync(configPath, "utf-8"));
  return ConfigSchema.parse(raw) as WebCManConfig;
}
