import {
  Play,
  Pause,
  SkipForward,
  Search,
  Plus,
  ChevronRight,
} from "lucide-react";
import { scenarios } from "../data/scenarios";
import { policyNames, policyInfo } from "../i18n";
import { policies } from "../domain/model";
import type {
  ExperimentRun,
  Language,
  MemoryPolicy,
  Scenario,
} from "../domain/model";
interface Props {
  lang: Language;
  run: ExperimentRun;
  scenario: Scenario;
  playing: boolean;
  query: string;
  project: string;
  budget: number;
  onScenario: (id: string) => void;
  onPolicy: (p: MemoryPolicy) => void;
  onStep: () => void;
  onPlay: () => void;
  onQuery: (s: string) => void;
  onProject: (s: string) => void;
  onBudget: (n: number) => void;
  onRetrieve: () => void;
  onThreshold: (n: number) => void;
  onCreate: () => void;
}
export function Controls(p: Props) {
  const { lang, run, scenario } = p;
  const t = (tr: string, en: string) => (lang === "tr" ? tr : en);
  const next = scenario.events[run.cursor];
  return (
    <aside
      className="controls panel"
      aria-label={t("Deney kontrolleri", "Experiment controls")}
    >
      <div className="section-label">
        <span>01</span>
        {t("Senaryo seç", "Choose a scenario")}
      </div>
      <div className="scenario-list">
        {scenarios.map((s, i) => (
          <button
            key={s.id}
            className={`scenario-button ${s.id === scenario.id ? "selected" : ""}`}
            aria-pressed={s.id === scenario.id}
            onClick={() => p.onScenario(s.id)}
          >
            <span className="mono">0{i + 1}</span>
            <span>
              <strong>{s.title[lang]}</strong>
              <small>{s.subtitle[lang]}</small>
            </span>
            <ChevronRight size={14} />
          </button>
        ))}
      </div>
      <div className="control-section">
        <label htmlFor="policy" className="section-label">
          <span>02</span>
          {t("Bellek politikası", "Memory policy")}
        </label>
        <select
          aria-label={t("Bellek politikası", "Memory policy")}
          id="policy"
          value={run.policy}
          onChange={(e) => p.onPolicy(e.target.value as MemoryPolicy)}
        >
          {policies.map((policy, i) => (
            <option value={policy} key={policy}>
              {"ABC"[i]} · {policyNames[policy][lang]}
            </option>
          ))}
        </select>
        <p className="hint">{policyInfo[run.policy][lang]}</p>
        {run.policy === "selective" && (
          <>
            <label htmlFor="threshold">
              {t("Saklama eşiği", "Retention threshold")}{" "}
              <b>{run.threshold.toFixed(2)}</b>
            </label>
            <input
              id="threshold"
              type="range"
              min="0"
              max="1"
              step=".05"
              value={run.threshold}
              onChange={(e) => p.onThreshold(Number(e.target.value))}
            />
            <small>
              {t(
                "Sonraki adaylara uygulanır. Baştan denemek için sıfırlayın.",
                "Applies to subsequent candidates. Reset to replay from the start.",
              )}
            </small>
          </>
        )}
      </div>
      <div className="control-section">
        <div className="section-label">
          <span>03</span>
          {t("Olayı çalıştır", "Run an event")}
          <small>
            {run.cursor}/{scenario.events.length}
          </small>
        </div>
        <div className="candidate">
          <span className="mono">{t("BELLEK ADAYI", "MEMORY CANDIDATE")}</span>
          <p>
            {next
              ? run.tombstones.includes(next.id)
                ? t(
                    "Silinmiş aday; yeniden yüklenmeyecek.",
                    "Deleted candidate; will not be restored.",
                  )
                : next.content[lang]
              : t(
                  "Olay akışı tamamlandı. Şimdi yeni bir oturum ve görev deneyin.",
                  "Event stream complete. Try a new session and task.",
                )}
          </p>
        </div>
        <div className="button-pair">
          <button onClick={p.onStep} disabled={!next}>
            <SkipForward size={15} />
            {t("Adımla", "Step")}
          </button>
          <button onClick={p.onPlay} disabled={!next}>
            {p.playing ? <Pause size={15} /> : <Play size={15} />}
            {p.playing ? t("Duraklat", "Pause") : t("Oynat", "Play")}
          </button>
        </div>
      </div>
      <form
        className="control-section"
        onSubmit={(e) => {
          e.preventDefault();
          p.onRetrieve();
        }}
      >
        <label htmlFor="query" className="section-label">
          <span>04</span>
          {t("Yeni görevi sor", "Ask a new task")}
        </label>
        <textarea
          id="query"
          value={p.query}
          onChange={(e) => p.onQuery(e.target.value)}
          maxLength={500}
          rows={3}
        />
        <div className="field-pair">
          <label>
            {t("Proje kapsamı", "Project scope")}
            <select
              value={p.project}
              onChange={(e) => p.onProject(e.target.value)}
            >
              <option>Atlas</option>
              <option>Nova</option>
            </select>
          </label>
          <label>
            {t("Kayıt bütçesi", "Record budget")}
            <input
              type="number"
              min="1"
              max="12"
              value={p.budget}
              onChange={(e) =>
                p.onBudget(
                  Math.max(1, Math.min(12, Number(e.target.value) || 1)),
                )
              }
            />
          </label>
        </div>
        <button className="primary cyan full" type="submit">
          <Search size={16} />
          {t("Geri çağır ve bağlam oluştur", "Recall & assemble context")}
        </button>
        <p className="hint">
          {t(
            "Sözcük + etiket eşleşmesi. Anlamsal arama veya model çalıştırılmaz.",
            "Word + tag matching. No semantic search or model execution.",
          )}
        </p>
      </form>
      <button className="quiet full" onClick={p.onCreate}>
        <Plus size={15} />
        {t("Kendi kaydını ekle", "Add your own record")}
      </button>
    </aside>
  );
}
