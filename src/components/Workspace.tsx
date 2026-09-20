import {
  Database,
  ArrowRight,
  ArrowLeft,
  Layers,
  Search,
  Check,
  Ban,
  GitBranch,
  RotateCcw,
} from "lucide-react";
import { kinds, reasons, statusNames } from "../i18n";
import type {
  ExperimentRun,
  Language,
  MemoryRecord,
  Scenario,
} from "../domain/model";
export type View = "memory" | "found" | "context" | "excluded";
interface Props {
  lang: Language;
  run: ExperimentRun;
  scenario: Scenario;
  view: View;
  onView: (v: View) => void;
  selected: string | null;
  onSelect: (id: string) => void;
}
export function Lifecycle({ lang, run }: Pick<Props, "lang" | "run">) {
  const t = (tr: string, en: string) => (lang === "tr" ? tr : en);
  const persistent = run.records.filter(
    (r) => r.scope.session === undefined,
  ).length;
  const session = run.records.length - persistent;
  return (
    <section className="panel lifecycle" aria-labelledby="lifecycle-heading">
      <div className="panel-heading">
        <h2 id="lifecycle-heading">
          <GitBranch size={17} />
          {t("Bellek yaşam döngüsü", "Memory lifecycle")}
        </h2>
        <span className="live-dot">
          {t("Gerçek deney durumu", "Live experiment state")}
        </span>
      </div>
      <div className="diagram">
        <div className="diagram-frame">
          <span className="frame-title">
            <Layers size={18} />
            {t("Oturum bağlamı", "Session context")}
          </span>
          <small>
            {t("Oturum", "Session")} {run.session} · Ada /{" "}
            {run.context?.query.scope.project ?? "Atlas"}
          </small>
          <div className="diagram-value">
            {run.context?.used ?? 0}
            <span>{t("bağlamdaki kayıt", "records in context")}</span>
          </div>
          <div className="frame-foot">
            {session} {t("oturum kaydı", "session records")}
          </div>
        </div>
        <div className="diagram-arrows">
          <span>
            {run.policy === "session"
              ? t("Oturum içi", "Within session")
              : t("Yazma politikası", "Write policy")}
          </span>
          {run.policy === "session" ? (
            <RotateCcw aria-hidden="true" />
          ) : (
            <ArrowRight aria-hidden="true" />
          )}
          <small>
            {run.policy === "session" ? session : persistent}{" "}
            {t("kayıt", "records")}
          </small>
          {run.policy !== "session" && (
            <ArrowLeft className="recall-arrow" aria-hidden="true" />
          )}
          <span className="cyan-text">
            {run.policy === "session"
              ? t("Kalıcı yazma yok", "No persistent write")
              : t("Geri çağırma", "Recall")}
          </span>
        </div>
        <div className="diagram-frame persistent">
          <span className="frame-title">
            <Database size={18} />
            {t("Kalıcı bellek", "Persistent memory")}
          </span>
          <small>
            {t("Kaynaklı · kapsamlı · sürümlü", "Sourced · scoped · versioned")}
          </small>
          <div className="diagram-value">
            {persistent}
            <span>{t("kalıcı kayıt", "persistent records")}</span>
          </div>
          <div className="frame-foot">
            {run.revisions.length} {t("sürüm ilişkisi", "revision links")}
          </div>
        </div>
      </div>
      <div className="diagram-exits">
        <span>
          ↻ {run.revisions.length} {t("güncelleme", "updates")}
        </span>
        <span>
          ↘ {run.records.filter((r) => r.status === "expired").length}{" "}
          {t("süre sonu", "expired")}
        </span>
        <span>
          ↘ {run.tombstones.length} {t("silinen aday", "deleted candidates")}
        </span>
      </div>
      <p className="sr-only">
        {t(
          "Olaydan yazma politikasına, kapsamlı belleğe; bellekten geçerlilik kontrolüyle oturum bağlamına. Güncelleme eski kaydı yeni sürüme bağlar. Süre sonu ve silme geri çağırmadan çıkarır.",
          "Events pass through write policy to scoped memory; memory passes validity checks into session context. Updates link old records to new revisions. Expiry and deletion exclude records from recall.",
        )}
      </p>
    </section>
  );
}
function RecordRow({
  record,
  lang,
  run,
  selected,
  onSelect,
}: {
  record: MemoryRecord;
  lang: Language;
  run: ExperimentRun;
  selected: boolean;
  onSelect: () => void;
}) {
  const result = run.context?.results.find((x) => x.id === record.id);
  return (
    <button
      className={`memory-row ${selected ? "selected" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
      data-testid="memory-row"
    >
      <div className="record-top">
        <span className="mono">{record.id}</span>
        <span className={`status ${record.status}`}>
          {statusNames[record.status][lang]}
        </span>
        <span className="kind">{kinds[record.kind][lang]}</span>
      </div>
      <p>{record.content[lang]}</p>
      <div className="record-meta">
        <span>
          {record.scope.user} / {record.scope.project}
          {record.scope.session ? ` / S${record.scope.session}` : ""}
        </span>
        <span>
          {record.sources[0].id}
          {record.sources.length > 1 ? ` +${record.sources.length - 1}` : ""}
        </span>
        <span>
          {result
            ? reasons[result.reason][lang]
            : record.validUntil
              ? lang === "tr"
                ? "Süreli kayıt"
                : "Time-limited"
              : lang === "tr"
                ? "Süresiz"
                : "No expiry"}
        </span>
      </div>
    </button>
  );
}
export function Workspace(p: Props) {
  const { lang, run, view } = p;
  const t = (tr: string, en: string) => (lang === "tr" ? tr : en);
  const results = run.context?.results ?? [];
  const filtered = run.records.filter(
    (r) =>
      view === "memory" ||
      results.some(
        (x) =>
          x.id === r.id &&
          (view === "found"
            ? x.reason === "selected" || x.reason === "budget"
            : view === "context"
              ? x.reason === "selected"
              : x.reason !== "selected"),
      ),
  );
  const tabs: [View, string, typeof Database][] = [
    ["memory", t("Bellek", "Memory"), Database],
    ["found", t("Bulunan", "Retrieved"), Search],
    ["context", t("Bağlam", "Context"), Check],
    ["excluded", t("Elenen", "Excluded"), Ban],
  ];
  if (view !== "memory")
    filtered.sort(
      (a, b) =>
        results.findIndex((x) => x.id === a.id) -
        results.findIndex((x) => x.id === b.id),
    );
  return (
    <div className="workspace">
      <Lifecycle lang={lang} run={run} />
      <section className="panel records">
        <div
          className="view-tabs"
          role="tablist"
          aria-label={t("Bellek görünümleri", "Memory views")}
        >
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              role="tab"
              id={`view-${id}`}
              aria-controls="record-view"
              tabIndex={view === id ? 0 : -1}
              aria-selected={view === id}
              onClick={() => p.onView(id)}
              onKeyDown={(e) => {
                const index = tabs.findIndex((x) => x[0] === id);
                const next =
                  e.key === "ArrowRight"
                    ? (index + 1) % tabs.length
                    : e.key === "ArrowLeft"
                      ? (index + tabs.length - 1) % tabs.length
                      : e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? tabs.length - 1
                          : null;
                if (next !== null) {
                  e.preventDefault();
                  p.onView(tabs[next][0]);
                  document.getElementById(`view-${tabs[next][0]}`)?.focus();
                }
              }}
            >
              <Icon size={15} />
              {label}
              <span>
                {id === "memory"
                  ? run.records.length
                  : id === "found"
                    ? results.filter(
                        (r) => r.reason === "selected" || r.reason === "budget",
                      ).length
                    : id === "context"
                      ? (run.context?.used ?? 0)
                      : results.filter((r) => r.reason !== "selected").length}
              </span>
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          id="record-view"
          aria-labelledby={`view-${view}`}
          aria-label={tabs.find((x) => x[0] === view)?.[1]}
          className="record-list"
        >
          {filtered.length ? (
            filtered.map((r) => (
              <RecordRow
                key={r.id}
                record={r}
                lang={lang}
                run={run}
                selected={p.selected === r.id}
                onSelect={() => p.onSelect(r.id)}
              />
            ))
          ) : (
            <div className="empty">
              <Database size={28} />
              <strong>
                {t("Henüz burada bir kayıt yok.", "No records here yet.")}
              </strong>
              <p>
                {view === "memory"
                  ? t(
                      "İlk olayı adımlayın; neyin, neden saklandığını inceleyin.",
                      "Step through the first event to inspect what is stored and why.",
                    )
                  : t(
                      "Bir görev çalıştırın; bulunan ve elenen kayıtlar burada görünür.",
                      "Run a task to see retrieved and excluded records here.",
                    )}
              </p>
            </div>
          )}
        </div>
      </section>
      <section className="result panel" aria-live="polite">
        <div className="panel-heading">
          <h2>
            <Layers size={17} />
            {t("Görev sonucu", "Task result")}
          </h2>
          <small>
            {t(
              "Senaryo kurallarıyla oluşturulur",
              "Generated by scenario rules",
            )}
          </small>
        </div>
        {!run.context ? (
          <p className="muted">
            {t(
              "Bir soru sorun. Sonucu ve kullanılan kayıt kimliklerini birlikte görün.",
              "Ask a question. Inspect the result together with the IDs it used.",
            )}
          </p>
        ) : (
          <>
            <div className="result-status">
              {run.context.outcome === "conflict"
                ? t(
                    "Çelişki çözülmedi — açıklama gerekli.",
                    "Conflict unresolved — clarification required.",
                  )
                : run.context.outcome === "clarify"
                  ? t(
                      "Yeterli bellek yok — açıklama gerekli.",
                      "Insufficient memory — clarification required.",
                    )
                  : t(
                      "Bağlamdan derlenen bilgiler",
                      "Facts assembled from context",
                    )}
            </div>
            {run.context.outcome === "conflict" && (
              <p>
                {t(
                  "Kaynaklar farklı değerler veriyor. Bir değeri seçmek için kayıt ayrıntısından açık düzeltme yapın.",
                  "Sources disagree. Make an explicit correction in the record inspector to choose a value.",
                )}
              </p>
            )}
            {run.context.outcome === "clarify" && (
              <p>
                {t(
                  "Bu görev için güncel, ilgili ve kapsam içi bilgi sağlayın.",
                  "Provide current, relevant information within this task’s scope.",
                )}
              </p>
            )}
            {run.context.recordIds.map((id) => {
              const r = run.records.find((x) => x.id === id);
              return r ? (
                <p key={id} className="context-line">
                  <span className="mono">[{id}]</span> {r.content[lang]}{" "}
                  <small>({r.sources.map((s) => s.id).join(", ")})</small>
                </p>
              ) : null;
            })}
            <div className="budget-bar">
              <span
                style={{
                  width: `${(run.context.used / run.context.budget) * 100}%`,
                }}
              />
            </div>
            <small>
              {run.context.used} / {run.context.budget}{" "}
              {t(
                "kayıt bütçesi · token ölçümü değildir",
                "record budget · not a token measure",
              )}
            </small>
            <details>
              <summary>
                {t(
                  "Geri çağırma adımları ve puanlar",
                  "Retrieval steps and scores",
                )}
              </summary>
              <ol>
                {[
                  t(
                    "Ada ve seçili proje kapsamı",
                    "Ada and selected project scope",
                  ),
                  t(
                    "Durum ve oturum uygunluğu",
                    "Status and session eligibility",
                  ),
                  t(
                    "İki dilde sözcük ve sabit etiket eşleştirme",
                    "Word matching in both languages and stable tags",
                  ),
                  t(
                    "Geçerlilik, düzeltme ve çelişki denetimi",
                    "Validity, correction and conflict checks",
                  ),
                  t("Puanla sıralama", "Ranking by score"),
                  t("Kayıt bütçesi seçimi", "Record budget selection"),
                  t(
                    "Kimlik ve kaynaklarla bağlam oluşturma",
                    "Context assembly with IDs and sources",
                  ),
                ].map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <p>
                {t(
                  "Puan = sözcük + 3 × etiket + kayıt sırası (0–1) + seçici politikada 4 × önem. Doğruluk olasılığı değildir. Zorunlu filtreler puanla aşılamaz.",
                  "Score = words + 3 × tags + insertion order (0–1) + 4 × importance under selective policy. Not a truth probability. Scores cannot bypass mandatory filters.",
                )}
              </p>
              {results.map((r) => (
                <div className="score-row" key={r.id}>
                  <span>
                    {r.id} · {r.score.toFixed(2)} = {r.components.words} +{" "}
                    {r.components.tags * 3} + {r.components.recency.toFixed(2)}{" "}
                    + {r.components.importance.toFixed(2)}
                  </span>
                  <span>{reasons[r.reason][lang]}</span>
                </div>
              ))}
            </details>
          </>
        )}
      </section>
    </div>
  );
}
