import type {
  ContextAssembly,
  ExperimentRun,
  RetrievalQuery,
  RetrievalResult,
  Scenario,
} from "./model";
import { sameScope, reconcile } from "./validity";
import { log } from "./engine";
export const words = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ı/g, "i")
      .match(/[\p{L}\p{N}]+/gu) || [],
  );
export function retrieve(
  input: ExperimentRun,
  query: RetrievalQuery,
  scenario?: Scenario,
): ExperimentRun {
  const run = structuredClone(input);
  reconcile(run);
  const q = words(query.text);
  const results: RetrievalResult[] = run.records.map((r, index) => {
    const w = words(`${r.content.tr} ${r.content.en} ${r.tags.join(" ")}`);
    const components = {
      words: [...q].filter((x) => w.has(x)).length,
      tags: query.tags.filter((t) => r.tags.includes(t)).length,
      recency: (index + 1) / Math.max(1, run.records.length),
      importance: run.policy === "selective" ? r.importance * 4 : 0,
    };
    const score =
      components.words +
      components.tags * 3 +
      components.recency +
      components.importance;
    const reason = !sameScope(r.scope, query.scope)
      ? "scope"
      : r.scope.session !== undefined && r.scope.session !== run.session
        ? "session"
        : r.status === "superseded"
          ? "superseded"
          : r.status === "expired"
            ? "expired"
            : r.validFrom !== undefined && r.validFrom > run.clock
              ? "future"
              : r.status === "conflict"
                ? "conflict"
                : components.words + components.tags === 0
                  ? "irrelevant"
                  : "selected";
    return { id: r.id, score, components, reason };
  });
  results.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  let used = 0;
  for (const r of results)
    if (r.reason === "selected") {
      if (used >= query.budget) r.reason = "budget";
      else used++;
    }
  const recordIds = results
    .filter((r) => r.reason === "selected")
    .map((r) => r.id);
  const relevantConflict = results.some(
    (r) =>
      r.reason === "conflict" && r.components.tags + r.components.words > 0,
  );
  const context: ContextAssembly = {
    query,
    results,
    recordIds,
    used,
    budget: query.budget,
    at: run.clock,
    outcome: relevantConflict ? "conflict" : used ? "answer" : "clarify",
    matchesExpected: null,
  };
  if (scenario)
    context.matchesExpected =
      scenario.expectedOutcome === context.outcome &&
      (context.outcome !== "answer" ||
        scenario.expectedValues.every((v) =>
          run.records.some((r) => recordIds.includes(r.id) && r.value === v),
        ));
  run.context = context;
  log(run, "query", recordIds);
  return run;
}
