import { z } from "zod";

export const evidenceLevelSchema = z.enum(["clinical", "emerging", "anecdotal"]);

export const sourceLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export const therapySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().min(1),
  claimedBenefits: z.array(z.string().min(1)).min(1),
  evidenceNotes: z.string().min(1),
  evidenceLevel: evidenceLevelSchema,
  regions: z.array(z.string().min(1)).min(1),
  sources: z.array(sourceLinkSchema).min(1),
  image: z.string().min(1),
  sourceType: z.enum(["seed", "scraped"]),
  updatedAt: z.string().min(1),
});

export const behaviorRemedySchema = z.object({
  text: z.string().min(1),
  evidenceLevel: evidenceLevelSchema,
  source: sourceLinkSchema.optional(),
});

export const behaviorSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(1),
  triggers: z.array(z.string().min(1)).min(1),
  remedies: z.array(behaviorRemedySchema).min(1),
  sources: z.array(sourceLinkSchema).min(1),
  image: z.string().min(1).optional(),
  sourceType: z.enum(["seed", "scraped"]),
  updatedAt: z.string().min(1),
});

export const newsItemSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  date: z.string().min(1),
  region: z.string().min(1).optional(),
  sources: z.array(sourceLinkSchema).min(1),
  sourceType: z.enum(["seed", "scraped"]),
});

export const resourceSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  body: z.string().min(1),
  sources: z.array(sourceLinkSchema).optional(),
});

export type EvidenceLevel = z.infer<typeof evidenceLevelSchema>;
export type SourceLink = z.infer<typeof sourceLinkSchema>;
export type Therapy = z.infer<typeof therapySchema>;
export type Behavior = z.infer<typeof behaviorSchema>;
export type NewsItem = z.infer<typeof newsItemSchema>;
export type Resource = z.infer<typeof resourceSchema>;
