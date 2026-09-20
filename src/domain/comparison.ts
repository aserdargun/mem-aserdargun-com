import { fresh, step, nextSession, advance } from "./engine";
import { policies } from "./model";
import type { Scenario } from "./model";
import { retrieve } from "./retrieval";
export function compare(
  scenario: Scenario,
  threshold = 0.65,
  tombstones: string[] = [],
) {
  return policies.map((policy) => {
    let run = fresh(scenario.id, policy, threshold);
    run.tombstones = [...tombstones];
    for (const _event of scenario.events) run = step(run, scenario);
    if (scenario.compareSession) run = nextSession(run);
    if (scenario.compareAdvance) run = advance(run, scenario.compareAdvance);
    return retrieve(
      run,
      {
        text: "",
        tags: scenario.tags,
        scope: { user: "Ada", project: "Atlas" },
        budget: scenario.budget,
      },
      scenario,
    );
  });
}
