import { describe, it, expect } from "vitest";
import {
  fresh,
  step,
  write,
  nextSession,
  advance,
  correct,
  forget,
  reset,
} from "../src/domain/engine";
import { retrieve } from "../src/domain/retrieval";
import { compare } from "../src/domain/comparison";
import { decode, exportRun, initialState } from "../src/domain/persistence";
import { scenarios } from "../src/data/scenarios";
import { DAY, START } from "../src/domain/model";
import type {
  ExperimentRun,
  MemoryPolicy,
  Scenario,
} from "../src/domain/model";
const execute = (s: Scenario, p: MemoryPolicy = "selective") =>
  s.events.reduce((r) => step(r, s), fresh(s.id, p));
const query = (r: ExperimentRun, s: Scenario, budget = 2) =>
  retrieve(
    r,
    {
      text: "",
      tags: s.tags,
      scope: { user: "Ada", project: "Atlas" },
      budget,
    },
    s,
  );
describe("memory lifecycle", () => {
  it("completes write → session → recall → correction → recall → deletion", () => {
    const s = scenarios[0];
    let r = step(fresh(s.id), s);
    r = query(nextSession(r), s);
    expect(r.context?.recordIds).toHaveLength(1);
    r = correct(r, r.records[0].id, "Detailed English reports");
    r = query(r, s);
    expect(r.records.find((x) => x.id === r.context?.recordIds[0])?.value).toBe(
      "Detailed English reports",
    );
    r = forget(r, r.context!.recordIds[0]);
    r = query(r, s);
    expect(r.context?.outcome).toBe("clarify");
    expect(exportRun(r, "en")).not.toContain("Detailed English reports");
    expect(r.records).toHaveLength(0);
  });
  it("is deterministic", () =>
    expect(execute(scenarios[1])).toEqual(execute(scenarios[1])));
  it.each(["simple", "selective"] as const)(
    "preserves %s memory after session",
    (p) =>
      expect(
        query(nextSession(execute(scenarios[0], p)), scenarios[0]).context
          ?.used,
      ).toBe(1),
  );
  it("isolates session-only memory", () =>
    expect(
      query(nextSession(execute(scenarios[0], "session")), scenarios[0]).context
        ?.used,
    ).toBe(0));
  it("isolates projects", () => {
    const r = query(execute(scenarios[5]), scenarios[5]);
    expect(r.context?.results.some((x) => x.reason === "scope")).toBe(true);
    expect(r.context?.used).toBe(1);
  });
  it("isolates fictional users", () => {
    const r = execute(scenarios[0]);
    expect(
      retrieve(r, {
        text: "report",
        tags: ["report"],
        scope: { user: "Ece", project: "Atlas" },
        budget: 2,
      }).context?.used,
    ).toBe(0);
  });
  it("expires at exact deadline", () => {
    const r = query(advance(execute(scenarios[3])), scenarios[3]);
    expect(r.records[0].status).toBe("expired");
    expect(r.context?.outcome).toBe("clarify");
  });
  it("excludes future validity even with a high match", () => {
    let r = fresh("preferences");
    r = write(r, { ...scenarios[0].events[0], validFrom: START + DAY });
    expect(query(r, scenarios[0]).context?.results[0].reason).toBe("future");
  });
  it.each(["session", "simple", "selective"] as const)(
    "preserves correction despite late old document under %s",
    (p) => {
      const r = query(execute(scenarios[1], p), scenarios[1]);
      expect(r.context?.used).toBe(1);
      expect(
        r.records.find((x) => x.id === r.context?.recordIds[0])?.value,
      ).toBe("2026-09-18");
      expect(r.records.filter((x) => x.status === "superseded")).toHaveLength(
        2,
      );
    },
  );
  it("does not hide conflict or count repetition as truth", () => {
    const r = query(execute(scenarios[2]), scenarios[2]);
    expect(r.context?.outcome).toBe("conflict");
    expect(r.context?.used).toBe(0);
  });
  it("resolves conflict only with explicit trusted correction", () => {
    let r = execute(scenarios[2]);
    r = correct(r, r.records[0].id, "White room");
    expect(query(r, scenarios[2]).context?.outcome).toBe("answer");
  });
  it("keeps duplicate source references", () => {
    const r = execute(scenarios[4]);
    expect(r.merged).toBe(4);
    expect(r.records[0].sources).toHaveLength(5);
  });
  it("does not exceed context budget", () => {
    const r = query(execute(scenarios[4], "simple"), scenarios[4], 1);
    expect(r.context?.used).toBe(1);
    expect(r.context?.results.some((x) => x.reason === "budget")).toBe(true);
  });
  it.each(["session", "simple", "selective"] as const)(
    "rejects source instruction under %s",
    (p) => {
      const r = execute(scenarios[5], p);
      expect(r.rejected).toBe(1);
      expect(r.records.some((x) => x.instruction)).toBe(false);
      expect(r.records.every((x) => x.authority === "data")).toBe(true);
    },
  );
  it("removes content from derivatives, history, export, and reset replay", () => {
    const s = scenarios[0];
    let r = query(execute(s), s);
    r = forget(r, r.records[0].id);
    expect(exportRun(r, "tr")).not.toContain(s.events[0].content.tr);
    r = step(reset(r), s);
    expect(r.records).toHaveLength(0);
    expect(r.events.some((e) => e.type === "skip")).toBe(true);
  });
  it("deletes merged sources and duplicated content", () => {
    const r = execute(scenarios[4], "simple");
    const target = r.records.find((x) => x.value === "coffee")!;
    const deleted = forget(r, target.id);
    expect(deleted.records.some((x) => x.value === "coffee")).toBe(false);
  });
  it.each(["{bad", '{"schemaVersion":0}', '{"schemaVersion":1,"runs":{}}'])(
    "recovers corrupt/old data %s",
    (raw) => expect(decode(raw).recovered).toBe(true),
  );
  it("rejects invalid persisted references", () => {
    const state = initialState();
    const r = query(execute(scenarios[0]), scenarios[0]);
    r.context!.recordIds = ["missing"];
    state.runs["preferences:selective"] = r;
    expect(decode(JSON.stringify(state)).recovered).toBe(true);
  });
  it("round-trips local state", () => {
    const state = initialState();
    state.runs["preferences:selective"] = execute(scenarios[0]);
    expect(decode(JSON.stringify(state)).state).toEqual(state);
  });
  it("isolates comparison stores and does not force selective victory", () => {
    const s = scenarios[4],
      runs = compare(s);
    expect(runs[1].context?.matchesExpected).toBe(true);
    expect(runs[2].context?.matchesExpected).toBe(false);
    runs[0].records.splice(0);
    expect(runs[1].records.length).toBeGreaterThan(0);
    expect(compare(s)[0].records.length).toBeGreaterThan(0);
  });
  it("same logical queries preserve bilingual behavior", () => {
    const r = execute(scenarios[0]);
    const search = (text: string) =>
      retrieve(r, {
        text,
        tags: [],
        scope: { user: "Ada", project: "Atlas" },
        budget: 1,
      }).context?.recordIds;
    expect(search("kısa Türkçe")).toEqual(search("short Turkish"));
    expect(search("short Turkish")).toHaveLength(1);
  });
  it("reset never reuses a deleted custom candidate id", () => {
    let r = write(fresh("preferences"), {
      ...scenarios[0].events[0],
      id: "custom-1",
    });
    r = reset(forget(r, r.records[0].id));
    expect(r.sequence).toBeGreaterThan(1);
    r = write(r, { ...scenarios[0].events[0], id: `custom-${r.sequence + 1}` });
    expect(r.records).toHaveLength(1);
  });
  it("rejects persisted source-less records before they can crash the inspector", () => {
    const state = initialState();
    const run = execute(scenarios[0]);
    run.records[0].sources = [];
    state.runs["preferences:selective"] = run;
    expect(decode(JSON.stringify(state)).recovered).toBe(true);
  });
});

describe("persistence safety", () => {
  it("rejects out-of-range timestamps", () => {
    const state = initialState();
    const run = execute(scenarios[0]);
    run.clock = 1e99;
    state.runs["preferences:selective"] = run;
    expect(decode(JSON.stringify(state)).recovered).toBe(true);
  });
  it("does not restore a deleted lifecycle state from stored content", () => {
    const state = initialState();
    const run = execute(scenarios[0]);
    run.records[0].status = "deleted";
    state.runs["preferences:selective"] = run;
    expect(decode(JSON.stringify(state)).recovered).toBe(true);
  });
});

describe("forgetting pending duplicates", () => {
  it("does not resurrect a deleted synthetic record through unprocessed copies", () => {
    const scenario = scenarios[4];
    let run = step(step(fresh(scenario.id, "simple"), scenario), scenario);
    run = forget(
      run,
      run.records.find((r) => r.value === "coffee")!.id,
      scenario.events,
    );
    while (run.cursor < scenario.events.length) run = step(run, scenario);
    expect(run.records.some((r) => r.value === "coffee")).toBe(false);
    run = reset(run);
    while (run.cursor < scenario.events.length) run = step(run, scenario);
    expect(exportRun(run, "tr")).not.toContain("kahve");
  });
});
