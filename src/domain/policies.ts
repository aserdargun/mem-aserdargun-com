import type { ExperimentRun, MemoryCandidate } from "./model";
export function writeDecision(
  run: ExperimentRun,
  c: MemoryCandidate,
):
  | "session"
  | "durable"
  | "threshold"
  | "correction"
  | "untrusted"
  | "temporary"
  | "below-threshold" {
  if (c.instruction || (c.kind === "procedure" && !c.source.trusted))
    return "untrusted";
  if (run.policy === "session") return "session";
  if (run.policy === "simple") return c.durable ? "durable" : "session";
  if (c.corrects && c.source.trusted) return "correction";
  if (!c.durable) return "temporary";
  return c.importance >= run.threshold ? "threshold" : "below-threshold";
}
