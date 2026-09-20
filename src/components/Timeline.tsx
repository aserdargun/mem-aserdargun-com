import { Clock, RotateCcw, Download, Plus, ArrowRight } from "lucide-react";
import { date, eventNames, retentionNames } from "../i18n";
import type { ExperimentRun, Language } from "../domain/model";
export function Timeline({
  lang,
  run,
  onSession,
  onTask,
  onAdvance,
  onReset,
  onExport,
  onReload,
}: {
  lang: Language;
  run: ExperimentRun;
  onSession: () => void;
  onTask: () => void;
  onAdvance: () => void;
  onReset: () => void;
  onExport: () => void;
  onReload: () => void;
}) {
  const t = (tr: string, en: string) => (lang === "tr" ? tr : en);
  return (
    <section className="panel timeline">
      <div className="panel-heading">
        <h2>
          <Clock size={17} />
          {t("Olay zaman çizelgesi", "Event timeline")}
        </h2>
        <span className="mono">{date(run.clock, lang)} UTC</span>
      </div>
      <div className="timeline-body">
        <div className="events" aria-label={t("Olay günlüğü", "Event log")}>
          {run.events.length ? (
            run.events
              .slice(-10)
              .reverse()
              .map((e) => (
                <div className="event" key={e.id}>
                  <span className="mono">{String(e.id).padStart(3, "0")}</span>
                  <span className={`event-dot ${e.type}`} />
                  <strong>{eventNames[e.type][lang]}</strong>
                  <span className="mono">{e.recordIds.join(", ")}</span>
                  {e.reason && (
                    <small>
                      {retentionNames[e.reason]?.[lang] ?? e.reason}
                    </small>
                  )}
                </div>
              ))
          ) : (
            <p className="muted">
              {t(
                "İlk olay çalıştırıldığında yazma gerekçesi burada görünür.",
                "The first event will appear here with its write decision.",
              )}
            </p>
          )}
        </div>
        <div className="experiment-actions">
          <div className="button-pair">
            <button onClick={onTask}>
              <Plus size={14} />
              {t("Yeni görev", "New task")}
            </button>
            <button className="primary" onClick={onSession}>
              <ArrowRight size={14} />
              {t("Yeni oturum", "New session")}
            </button>
          </div>
          <div className="button-pair">
            <button onClick={onAdvance}>
              <Clock size={14} />
              {t("Saati +1 gün ilerlet", "Advance +1 day")}
            </button>
            <button onClick={onReset}>
              <RotateCcw size={14} />
              {t("Deneyi sıfırla", "Reset experiment")}
            </button>
          </div>
          <button className="full" onClick={onExport}>
            <Download size={15} />
            {t("JSON dışa aktar", "Export JSON")}
          </button>
          {run.tombstones.length > 0 && (
            <button className="quiet full" onClick={onReload}>
              {t(
                "Sentetik senaryoyu yeniden yükle",
                "Reload synthetic scenario",
              )}
            </button>
          )}
          <p className="hint">
            {t(
              "Yeni görev belleği korur. Yeni oturum kalıcı belleği korur. Reset silme işaretlerini koruyarak başa döner.",
              "New tasks keep memory. New sessions keep persistent memory. Reset returns to the start while preserving deletion markers.",
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
