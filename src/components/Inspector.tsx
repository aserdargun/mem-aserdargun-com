import { useState } from "react";
import { FileText, Pencil, Trash2, X } from "lucide-react";
import {
  date,
  kinds,
  retentionNames,
  statusNames,
  sourceTypes,
  reasons,
} from "../i18n";
import type { ExperimentRun, Language, MemoryRecord } from "../domain/model";
export function Inspector({
  lang,
  run,
  record,
  onCorrect,
  onDelete,
  onClose,
}: {
  lang: Language;
  run: ExperimentRun;
  record?: MemoryRecord;
  onCorrect: (s: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false),
    [value, setValue] = useState("");
  const t = (tr: string, en: string) => (lang === "tr" ? tr : en);
  return (
    <aside
      className={`panel inspector ${record ? "has-record" : ""}`}
      tabIndex={-1}
      aria-label={t("Kayıt ayrıntıları", "Record details")}
    >
      <div className="panel-heading">
        <h2>
          <FileText size={17} />
          {t("Kayıt incele", "Inspect record")}
        </h2>
        {record && (
          <button
            aria-label={t("Ayrıntıyı kapat", "Close details")}
            className="icon-button"
            onClick={onClose}
          >
            <X size={17} />
          </button>
        )}
      </div>
      {!record ? (
        <div className="empty">
          <FileText size={28} />
          <strong>{t("Bir kaydı seçin.", "Select a record.")}</strong>
          <p>
            {t(
              "Kaynağı, zamanı ve bu görevde neden kullanıldığını inceleyin.",
              "Inspect its source, time, and why it was used for this task.",
            )}
          </p>
        </div>
      ) : (
        <>
          <div className="inspector-title">
            <h3>{record.id}</h3>
            <span className={`status ${record.status}`}>
              {statusNames[record.status][lang]}
            </span>
          </div>
          <p className="record-content">{record.content[lang]}</p>
          <dl>
            <dt>{t("Tür", "Type")}</dt>
            <dd>{kinds[record.kind][lang]}</dd>
            <dt>{t("Kapsam", "Scope")}</dt>
            <dd>
              {record.scope.user} / {record.scope.project}
              {record.scope.session ? ` / S${record.scope.session}` : ""}
            </dd>
            <dt>{t("Kaydedilme", "Recorded")}</dt>
            <dd>{date(record.writtenAt, lang)}</dd>
            <dt>{t("Olay zamanı", "Event time")}</dt>
            <dd>{date(record.occurredAt, lang)}</dd>
            <dt>{t("Geçerlilik başlangıcı", "Valid from")}</dt>
            <dd>{date(record.validFrom, lang)}</dd>
            <dt>{t("Geçerlilik sonu", "Valid until")}</dt>
            <dd>{date(record.validUntil, lang)}</dd>
            <dt>{t("Son kullanıcı teyidi", "Last user assertion")}</dt>
            <dd>{date(record.lastVerifiedAt, lang)}</dd>
            <dt>{t("Önem değeri", "Importance")}</dt>
            <dd>{record.importance.toFixed(2)}</dd>
            <dt>{t("Yetki", "Authority")}</dt>
            <dd>
              {t(
                "Veri; işlem izni vermez",
                "Data; grants no action permission",
              )}
            </dd>
          </dl>
          <small>
            {t(
              "Tüm zamanlar UTC. Kullanıcı teyidi dış doğrulama değildir.",
              "All times UTC. A user assertion is not external verification.",
            )}
          </small>
          <div className="inspector-block">
            <h4>{t("Neden saklandı?", "Why was it stored?")}</h4>
            <p>{retentionNames[record.retentionReason][lang]}</p>
            <h4>{t("Bu görevde neden?", "Why in this task?")}</h4>
            <p>
              {run.context
                ? reasons[
                    run.context.results.find((x) => x.id === record.id)
                      ?.reason ?? "irrelevant"
                  ][lang]
                : t("Henüz görev çalıştırılmadı.", "No task has been run yet.")}
            </p>
          </div>
          <div className="inspector-block">
            <h4>{t("Kaynak ilişkileri", "Source references")}</h4>
            {record.sources.map((s) => (
              <div className="source-item" key={s.id}>
                <span className="mono">
                  {s.id} · v{s.version}
                </span>
                <p>{s.title[lang]}</p>
                <small>
                  {sourceTypes[s.type][lang]} ·{" "}
                  {s.trusted
                    ? t("Kullanıcı beyanı", "User assertion")
                    : t("Güvenilmeyen içerik", "Untrusted content")}
                </small>
              </div>
            ))}
            <small>
              {t(
                "Tekrar sayısı bağımsız doğrulama değildir.",
                "Repetition count is not independent verification.",
              )}
            </small>
          </div>
          <div className="inspector-block">
            <h4>{t("Sürüm geçmişi", "Revision history")}</h4>
            {run.revisions
              .filter((r) => r.from === record.id || r.to === record.id)
              .map((r, i) => (
                <p key={i} className="mono">
                  {r.from} → {r.to}
                </p>
              ))}
            {!run.revisions.some(
              (r) => r.from === record.id || r.to === record.id,
            ) && <p className="muted">{t("İlk sürüm", "Initial version")}</p>}
          </div>
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onCorrect(value);
                setEditing(false);
                setValue("");
              }}
            >
              <label htmlFor="correction">
                {t("Açık kullanıcı düzeltmesi", "Explicit user correction")}
              </label>
              <textarea
                autoFocus
                id="correction"
                rows={3}
                maxLength={1000}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
              <button className="primary full" disabled={!value.trim()}>
                {t("Düzeltmeyi kaydet", "Save correction")}
              </button>
              <button
                className="quiet full"
                type="button"
                onClick={() => setEditing(false)}
              >
                {t("Vazgeç", "Cancel")}
              </button>
            </form>
          ) : (
            <button
              className="full"
              onClick={() => {
                setValue(record.content[lang]);
                setEditing(true);
              }}
            >
              <Pencil size={15} />
              {t("Bilgiyi düzelt", "Correct information")}
            </button>
          )}
          <button className="danger full" onClick={onDelete}>
            <Trash2 size={15} />
            {t("Kaydı ve sürümlerini sil", "Delete record and revisions")}
          </button>
          <small>
            {t(
              "Silme aynı içeriğin tekrarlarını, kaynaklarını ve türetilmiş bağlamı da kaldırır.",
              "Deletion also removes duplicates of this content, its sources, and derived context.",
            )}
          </small>
        </>
      )}
    </aside>
  );
}
