# MEM working contract

- Build the bilingual agent-memory laboratory: six synthetic scenarios, three distinct memory policies, real local persistence, explainable recall, correction, expiry, deletion, and JSON export.
- Keep memory truth in `src/domain` and the scenario catalogue in `src/data`; `src/i18n.ts` owns the Turkish and English surface. The three policies must differ in observable behaviour, not only in label.
- A recall is explainable: return the entries that justified it and the policy rule that selected them. Expiry and deletion are real state transitions, not presentation flags, and an export must reproduce what the app actually held.
- Keep Turkish and English controls, scenario text and explanations equivalent. Label the synthetic nature of every scenario; do not present stored memory as a real agent's persistent store.
- Verify `npm run validate:codex` and review `git diff --check` before handoff.
- Local work only unless the user authorizes external publication. Preserve unrelated work and processes.
