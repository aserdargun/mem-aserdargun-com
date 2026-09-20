import { z } from "zod";
import { runSchema } from "./model";
import type { ExperimentRun, Language } from "./model";
import { scenarios } from "../data/scenarios";
export const STORAGE_KEY = "mem-laboratory:v1";
const schema = z.object({
  schemaVersion: z.literal(1),
  language: z.enum(["tr", "en"]),
  selectedScenario: z.string(),
  selectedPolicy: z.enum(["session", "simple", "selective"]),
  runs: z.record(z.string(), runSchema),
});
export type LaboratoryState = z.infer<typeof schema>;
export const initialState = (): LaboratoryState => ({
  schemaVersion: 1,
  language: "tr",
  selectedScenario: "preferences",
  selectedPolicy: "selective",
  runs: {},
});
export function decode(raw: string | null): {
  state: LaboratoryState;
  recovered: boolean;
} {
  if (raw === null) return { state: initialState(), recovered: false };
  try {
    const state = schema.parse(JSON.parse(raw));
    if (!scenarios.some((s) => s.id === state.selectedScenario))
      throw Error("scenario");
    for (const [key, run] of Object.entries(state.runs)) {
      const scenario = scenarios.find((s) => s.id === run.scenarioId);
      if (
        !scenario ||
        key !== `${run.scenarioId}:${run.policy}` ||
        run.cursor > scenario.events.length
      )
        throw Error("run");
      const ids = new Set(run.records.map((r) => r.id));
      if (
        run.records.some(
          (r) => r.status === "deleted" || r.status === "candidate",
        )
      )
        throw Error("lifecycle");
      if (
        run.revisions.some(
          (r) => !ids.has(r.from) || !ids.has(r.to) || r.from === r.to,
        )
      )
        throw Error("revisions");
      if (
        ids.size !== run.records.length ||
        run.context?.recordIds.some((id) => !ids.has(id)) ||
        run.records.some((r) =>
          r.candidateIds.some((id) => run.tombstones.includes(id)),
        )
      )
        throw Error("references");
      if (!Number.isFinite(run.clock)) throw Error("clock");
    }
    return { state, recovered: false };
  } catch {
    return { state: initialState(), recovered: true };
  }
}
export function load(): {
  state: LaboratoryState;
  recovered: boolean;
  unavailable: boolean;
} {
  try {
    return { ...decode(localStorage.getItem(STORAGE_KEY)), unavailable: false };
  } catch {
    return { state: initialState(), recovered: false, unavailable: true };
  }
}
export function save(state: LaboratoryState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
export function exportRun(run: ExperimentRun, language: Language): string {
  return JSON.stringify(
    {
      schemaVersion: 1,
      scenario: { id: run.scenarioId, version: run.scenarioVersion },
      policy: run.policy,
      clock: run.clock,
      language,
      scenarioDataSynthetic: true,
      containsUserEntries: run.records.some((r) =>
        r.candidateIds.some((id) => id.startsWith("custom-")),
      ),
      modelExecution: false,
      run,
    },
    null,
    2,
  );
}
