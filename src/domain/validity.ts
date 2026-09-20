import type { ExperimentRun, MemoryRecord, MemoryScope } from "./model";
export const sameScope = (a: MemoryScope, b: MemoryScope) =>
  a.user === b.user && a.project === b.project;
export function reconcile(run: ExperimentRun): void {
  const replaced = new Set(run.revisions.map((r) => r.from));
  for (const r of run.records)
    r.status = replaced.has(r.id)
      ? "superseded"
      : r.validUntil !== undefined && r.validUntil <= run.clock
        ? "expired"
        : "active";
  const live = run.records.filter(
    (r) =>
      r.status === "active" &&
      (r.validFrom === undefined || r.validFrom <= run.clock) &&
      (r.scope.session === undefined || r.scope.session === run.session),
  );
  for (const r of live)
    if (
      live.some(
        (o) =>
          o.id !== r.id &&
          sameScope(r.scope, o.scope) &&
          o.claim === r.claim &&
          o.value !== r.value,
      )
    )
      r.status = "conflict";
}
export const isCurrent = (r: MemoryRecord, clock: number) =>
  r.status === "active" &&
  (r.validFrom === undefined || r.validFrom <= clock) &&
  (r.validUntil === undefined || r.validUntil > clock);
