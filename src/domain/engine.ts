import { START, DAY } from "./model";
import type {
  ExperimentRun,
  MemoryCandidate,
  MemoryEvent,
  MemoryPolicy,
  Scenario,
} from "./model";
import { sameScope, reconcile } from "./validity";
import { writeDecision } from "./policies";
export function fresh(
  scenarioId: string,
  policy: MemoryPolicy = "selective",
  threshold = 0.65,
): ExperimentRun {
  return {
    scenarioId,
    scenarioVersion: 1,
    policy,
    clock: START,
    session: 1,
    cursor: 0,
    sequence: 0,
    threshold,
    records: [],
    revisions: [],
    events: [],
    tombstones: [],
    rejected: 0,
    merged: 0,
    context: null,
  };
}
export function log(
  run: ExperimentRun,
  type: MemoryEvent["type"],
  recordIds: string[] = [],
  reason?: string,
) {
  run.events.push({
    id: ++run.sequence,
    at: run.clock,
    type,
    recordIds,
    ...(reason ? { reason } : {}),
  });
}
export function write(
  input: ExperimentRun,
  candidate: MemoryCandidate,
): ExperimentRun {
  const run = structuredClone(input),
    c = structuredClone(candidate);
  run.context = null;
  if (run.tombstones.includes(c.id)) {
    log(run, "skip", [], "deleted");
    return run;
  }
  const reason = writeDecision(run, c);
  if (["untrusted", "temporary", "below-threshold"].includes(reason)) {
    run.rejected++;
    log(run, "reject", [], reason);
    return run;
  }
  const peers = run.records.filter(
    (r) =>
      sameScope(r.scope, c.scope) &&
      r.claim === c.claim &&
      (r.scope.session === undefined || r.scope.session === run.session),
  );
  const scope = {
    ...c.scope,
    ...(run.policy === "session" || !c.durable ? { session: run.session } : {}),
  };
  const duplicate = peers.find(
    (r) =>
      r.value === c.value &&
      r.status === "active" &&
      r.validUntil === c.validUntil &&
      r.validFrom === c.validFrom &&
      !c.corrects,
  );
  if (run.policy === "selective" && duplicate) {
    duplicate.sources.push(c.source);
    duplicate.candidateIds.push(c.id);
    run.merged++;
    log(run, "merge", [duplicate.id]);
    return run;
  }
  const id = `M-${String(++run.sequence).padStart(3, "0")}`;
  const { source, ...rest } = c;
  const record = {
    ...rest,
    id,
    scope,
    candidateIds: [c.id],
    sources: [source],
    writtenAt: run.clock,
    status: "active" as const,
    retentionReason: reason as
      "session" | "durable" | "threshold" | "correction",
    authority: "data" as const,
    ...(source.trusted ? { lastVerifiedAt: run.clock } : {}),
  };
  run.records.push(record);
  // Only explicit, trusted, chronologically valid corrections supersede claims.
  if (c.corrects && source.trusted)
    for (const p of peers)
      if (
        c.occurredAt >= p.occurredAt &&
        (c.corrects === p.claim || p.candidateIds.includes(c.corrects))
      ) {
        run.revisions.push({ from: p.id, to: id, at: run.clock });
        Object.assign(record, { previousId: p.id });
      }
  // A late old document stays historical even when it is written most recently.
  const newer = peers.find(
    (p) =>
      p.corrects &&
      p.sources.some((s) => s.trusted) &&
      p.occurredAt > c.occurredAt,
  );
  if (newer) run.revisions.push({ from: id, to: newer.id, at: run.clock });
  log(run, c.corrects ? "correct" : "write", [id]);
  reconcile(run);
  return run;
}
export function step(input: ExperimentRun, scenario: Scenario): ExperimentRun {
  if (input.cursor >= scenario.events.length) return input;
  const run = write(input, scenario.events[input.cursor]);
  run.cursor++;
  return run;
}
export function nextSession(input: ExperimentRun): ExperimentRun {
  const run = structuredClone(input);
  run.session++;
  run.context = null;
  log(run, "session");
  reconcile(run);
  return run;
}
export function advance(input: ExperimentRun, days = 1): ExperimentRun {
  const run = structuredClone(input);
  run.clock += DAY * days;
  run.context = null;
  reconcile(run);
  log(run, "advance");
  return run;
}
export function correct(
  input: ExperimentRun,
  id: string,
  content: string,
): ExperimentRun {
  const old = input.records.find((r) => r.id === id);
  if (!old || !content.trim()) return input;
  return write(input, {
    id: `custom-${input.sequence + 1}`,
    kind: old.kind,
    content: { tr: content.trim(), en: content.trim() },
    scope: { user: old.scope.user, project: old.scope.project },
    source: {
      id: `user-${input.sequence + 1}`,
      type: "user",
      title: { tr: "Kullanıcı düzeltmesi", en: "User correction" },
      version: old.sources[0].version + 1,
      trusted: true,
    },
    claim: old.claim,
    value: content.trim(),
    tags: old.tags,
    importance: 1,
    durable: true,
    occurredAt: Math.max(input.clock, old.occurredAt),
    validFrom: input.clock,
    corrects: old.claim,
  });
}
export function forget(
  input: ExperimentRun,
  id: string,
  scenarioCandidates: MemoryCandidate[] = [],
): ExperimentRun {
  const run = structuredClone(input);
  const ids = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const rev of run.revisions)
      if (ids.has(rev.from) || ids.has(rev.to))
        for (const key of [rev.from, rev.to])
          if (!ids.has(key)) {
            ids.add(key);
            changed = true;
          }
  }
  const removed = run.records.filter((r) => ids.has(r.id));
  for (const r of run.records)
    if (
      removed.some(
        (d) =>
          sameScope(r.scope, d.scope) &&
          r.claim === d.claim &&
          r.value === d.value,
      )
    )
      ids.add(r.id);
  for (const r of run.records.filter((r) => ids.has(r.id)))
    run.tombstones.push(...r.candidateIds);
  for (const candidate of scenarioCandidates) {
    if (
      removed.some(
        (r) =>
          sameScope(r.scope, candidate.scope) &&
          r.claim === candidate.claim &&
          r.value === candidate.value,
      )
    )
      run.tombstones.push(candidate.id);
  }
  run.tombstones = [...new Set(run.tombstones)];
  run.records = run.records.filter((r) => !ids.has(r.id));
  run.revisions = run.revisions.filter(
    (r) => !ids.has(r.from) && !ids.has(r.to),
  );
  // Logs contain only IDs, never source or record content. Derived query/context is discarded.
  run.events = run.events.filter((e) => !e.recordIds.some((i) => ids.has(i)));
  run.context = null;
  log(run, "delete", [...ids]);
  reconcile(run);
  return run;
}
export function reset(input: ExperimentRun): ExperimentRun {
  const run = fresh(input.scenarioId, input.policy, input.threshold);
  run.tombstones = [...input.tombstones];
  run.sequence = input.sequence;
  log(run, "reset");
  return run;
}
