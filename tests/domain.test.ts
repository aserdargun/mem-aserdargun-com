import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  fresh,
  step,
  write,
  nextSession,
  advance,
  correct,
  forget,
  reset,
  DEFAULT_THRESHOLD,
  NOISE_ACCESS_IMPORTANCE,
  NOISE_EXPLORATION_THRESHOLD,
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
  it("rejects a recall that scores a record the run no longer holds", () => {
    const state = initialState();
    const r = query(execute(scenarios[0]), scenarios[0]);
    r.context!.results.push({
      id: "missing",
      reason: "selected",
      score: 99,
      components: { words: 1, tags: 1, recency: 1, importance: 1 },
    });
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
  // The assembled count is derived from recordIds, and the budget is its hard
  // ceiling. Stored counts that disagree are not measurements, so the recovery
  // path must reject them instead of rendering them as the task result.
  it("rejects an assembled count that contradicts the records it lists", () => {
    const state = initialState();
    const run = query(execute(scenarios[0]), scenarios[0]);
    expect(run.context?.used).toBe(run.context?.recordIds.length);
    run.context!.used = 99;
    state.runs["preferences:selective"] = run;
    expect(decode(JSON.stringify(state)).recovered).toBe(true);
  });
  it("rejects an assembled count above the record budget", () => {
    const state = initialState();
    const run = query(execute(scenarios[0]), scenarios[0]);
    run.context!.used = run.context!.budget + 1;
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

describe("published numbers against enforced ones", () => {
  it("the threshold the reader is told about is the threshold the engine enforces", () => {
    /* The footer says the rejection threshold is 0.65, and the noise
       scenario's lesson tells the reader that at threshold 0.65 selective
       memory drops the access code. Both sentences described a bare literal
       that lived in a function signature, so nothing connected them to the
       engine: moving the default to 0.60 left the footer and the lesson
       claiming 0.65 while the engine rejected at 0.60, and every test stayed
       green.

       The published text is now read from the named value, and this test
       holds it there — if the number in the prose drifts from the number the
       engine runs, the prose fails. */
    const footer = readFileSync(
      resolve(__dirname, "..", "src", "App.tsx"),
      "utf8",
    );
    /* The footer sentence is rendered from the named value, so the source
       carries the interpolation rather than a typed-out number. */
    expect(
      footer,
      "the footer reads the threshold from the named value",
    ).toContain("Memory rules and the ${DEFAULT_THRESHOLD.toFixed(2)} rejection threshold");
    expect(
      footer,
      "the footer must not repeat the number as a literal",
    ).not.toMatch(/Memory rules and the [\d.]+ rejection threshold/);
    /* And the engine really does enforce that number. */
    expect(fresh("preferences", "selective").threshold).toBe(DEFAULT_THRESHOLD);
  });

  it("the noise lesson states the importance and thresholds the scenario uses", () => {
    /* The noise lesson names three numbers: the access detail's importance,
       the threshold at which selective memory drops it, and the lower
       threshold it invites the reader to try. Each one is a claim about what
       the engine does, and each was a literal repeated in the prose. */
    const noise = scenarios.find((s) => s.id === "noise")!;
    const access = noise.events[0];
    expect(access.importance).toBe(NOISE_ACCESS_IMPORTANCE);

    const stated = (text: string) => text.match(/[\d]+[.,][\d]+/g) ?? [];
    for (const lang of ["tr", "en"] as const) {
      const numbers = stated(noise.lesson[lang]).map((n) =>
        Number(n.replace(",", ".")),
      );
      expect(numbers, `noise lesson (${lang}) names the access importance`).toContain(
        NOISE_ACCESS_IMPORTANCE,
      );
      expect(numbers, `noise lesson (${lang}) names the default threshold`).toContain(
        DEFAULT_THRESHOLD,
      );
      expect(
        numbers,
        `noise lesson (${lang}) names the exploration threshold`,
      ).toContain(NOISE_EXPLORATION_THRESHOLD);
    }

    /* The lesson's claim has to hold: at the default threshold selective
       memory drops the access code and simple memory keeps it, and lowering
       the threshold to the published one brings it back. */
    const atDefault = compare(noise);
    const selective = atDefault.find((r) => r.policy === "selective")!;
    const simple = atDefault.find((r) => r.policy === "simple")!;
    expect(selective.records.some((r) => r.value === "LIME-7")).toBe(false);
    expect(simple.records.some((r) => r.value === "LIME-7")).toBe(true);

    const lowered = compare(noise, NOISE_EXPLORATION_THRESHOLD);
    expect(
      lowered
        .find((r) => r.policy === "selective")!
        .records.some((r) => r.value === "LIME-7"),
    ).toBe(true);
  });

  it("the exploration threshold is reachable on the panel's slider", () => {
    /* The lesson invites the reader to lower the threshold to a published
       number. The panel's slider has a fixed step, so a threshold the lesson
       names but the slider cannot land on is an instruction the reader
       cannot follow. */
    const controls = readFileSync(
      resolve(__dirname, "..", "src", "components", "Controls.tsx"),
      "utf8",
    );
    const step = Number(controls.match(/step="([\d.]+)"/)?.[1]);
    expect(Number.isFinite(step)).toBe(true);
    for (const threshold of [
      DEFAULT_THRESHOLD,
      NOISE_EXPLORATION_THRESHOLD,
      NOISE_ACCESS_IMPORTANCE,
    ]) {
      const steps = Math.round(threshold / step);
      expect(Math.abs(steps * step - threshold), `${threshold} on a ${step} step`).toBeLessThan(
        1e-9,
      );
    }
  });
});
