import { z } from "zod";
const timestamp = z
  .number()
  .int()
  .min(-8_640_000_000_000_000)
  .max(8_640_000_000_000_000);
export const textSchema = z.object({
  tr: z.string().max(4000),
  en: z.string().max(4000),
});
export type LocalText = z.infer<typeof textSchema>;
export type Language = "tr" | "en";
export const L = (tr: string, en: string): LocalText => ({ tr, en });
export const policySchema = z.enum(["session", "simple", "selective"]);
export type MemoryPolicy = z.infer<typeof policySchema>;
export const scopeSchema = z.object({
  user: z.string(),
  project: z.string(),
  session: z.number().int().positive().optional(),
});
export type MemoryScope = z.infer<typeof scopeSchema>;
export const sourceSchema = z.object({
  id: z.string(),
  type: z.enum(["user", "document", "note"]),
  title: textSchema,
  version: z.number().int().positive(),
  trusted: z.boolean(),
});
export type SourceReference = z.infer<typeof sourceSchema>;
export const candidateSchema = z.object({
  id: z.string(),
  kind: z.enum(["fact", "episode", "procedure"]),
  content: textSchema,
  scope: scopeSchema,
  source: sourceSchema,
  claim: z.string(),
  value: z.string(),
  tags: z.array(z.string()),
  importance: z.number().min(0).max(1),
  durable: z.boolean(),
  occurredAt: timestamp,
  validFrom: timestamp.optional(),
  validUntil: timestamp.optional(),
  corrects: z.string().optional(),
  instruction: z.boolean().optional(),
});
export type MemoryCandidate = z.infer<typeof candidateSchema>;
export const statusSchema = z.enum([
  "candidate",
  "active",
  "conflict",
  "superseded",
  "expired",
  "deleted",
]);
export type MemoryStatus = z.infer<typeof statusSchema>;
export const recordSchema = candidateSchema.omit({ source: true }).extend({
  id: z.string(),
  candidateIds: z.array(z.string()).min(1),
  sources: z.array(sourceSchema).min(1),
  writtenAt: timestamp,
  lastVerifiedAt: timestamp.optional(),
  status: statusSchema,
  previousId: z.string().optional(),
  retentionReason: z.enum(["session", "durable", "threshold", "correction"]),
  authority: z.literal("data"),
});
export type MemoryRecord = z.infer<typeof recordSchema>;
export const revisionSchema = z.object({
  from: z.string(),
  to: z.string(),
  at: timestamp,
});
export type MemoryRevision = z.infer<typeof revisionSchema>;
export const eventSchema = z.object({
  id: z.number(),
  at: timestamp,
  type: z.enum([
    "write",
    "reject",
    "merge",
    "correct",
    "session",
    "query",
    "advance",
    "delete",
    "skip",
    "reset",
  ]),
  recordIds: z.array(z.string()),
  reason: z.string().optional(),
});
export type MemoryEvent = z.infer<typeof eventSchema>;
export const querySchema = z.object({
  text: z.string().max(4000),
  tags: z.array(z.string()),
  scope: scopeSchema,
  budget: z.number().int().min(1).max(12),
});
export type RetrievalQuery = z.infer<typeof querySchema>;
export const reasonSchema = z.enum([
  "selected",
  "scope",
  "session",
  "expired",
  "future",
  "superseded",
  "conflict",
  "irrelevant",
  "budget",
  "deleted",
]);
export type ExclusionReason = z.infer<typeof reasonSchema>;
export const resultSchema = z.object({
  id: z.string(),
  reason: reasonSchema,
  score: z.number(),
  components: z.object({
    words: z.number(),
    tags: z.number(),
    recency: z.number(),
    importance: z.number(),
  }),
});
export type RetrievalResult = z.infer<typeof resultSchema>;
export const contextSchema = z.object({
  query: querySchema,
  results: z.array(resultSchema),
  recordIds: z.array(z.string()),
  used: z.number(),
  budget: z.number(),
  at: timestamp,
  outcome: z.enum(["answer", "clarify", "conflict"]),
  matchesExpected: z.boolean().nullable(),
});
export type ContextAssembly = z.infer<typeof contextSchema>;
export const runSchema = z.object({
  scenarioId: z.string(),
  scenarioVersion: z.literal(1),
  policy: policySchema,
  clock: timestamp,
  session: z.number().int().positive(),
  cursor: z.number().int().nonnegative(),
  sequence: z.number().int().nonnegative(),
  threshold: z.number().min(0).max(1),
  records: z.array(recordSchema),
  revisions: z.array(revisionSchema),
  events: z.array(eventSchema),
  tombstones: z.array(z.string()),
  rejected: z.number().int().nonnegative(),
  merged: z.number().int().nonnegative(),
  context: contextSchema.nullable(),
});
export type ExperimentRun = z.infer<typeof runSchema>;
export interface Scenario {
  id: string;
  title: LocalText;
  subtitle: LocalText;
  lesson: LocalText;
  events: MemoryCandidate[];
  query: LocalText;
  tags: string[];
  expectedValues: string[];
  expectedOutcome: "answer" | "clarify" | "conflict";
  compareSession: boolean;
  compareAdvance: number;
  budget: number;
}
export const START = Date.UTC(2026, 8, 1, 9);
export const DAY = 86_400_000;
export const policies: MemoryPolicy[] = ["session", "simple", "selective"];
