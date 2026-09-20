import { useState } from "react";
import { GitCompare, Play, CheckCircle, CircleHelp } from "lucide-react";
import type { ExperimentRun, Language, Scenario } from "../domain/model";
import { compare } from "../domain/comparison";
import { policyNames } from "../i18n";
export function Comparison({
  lang,
  scenario,
  threshold,
  tombstones,
}: {
  lang: Language;
  scenario: Scenario;
  threshold: number;
  tombstones: string[];
}) {
  const [runs, setRuns] = useState<ExperimentRun[]>([]);
  const t = (tr: string, en: string) => (lang === "tr" ? tr : en);
  const metrics: [string, (r: ExperimentRun) => string | number][] = [
    [t("Saklanan kayıt", "Stored records"), (r) => r.records.length],
    [t("Elenen aday", "Rejected candidates"), (r) => r.rejected],
    [t("Birleştirilen tekrar", "Merged duplicates"), (r) => r.merged],
    [
      t("Geri çağrılan kayıt", "Retrieved records"),
      (r) =>
        r.context?.results.filter(
          (x) => x.reason === "selected" || x.reason === "budget",
        ).length ?? 0,
    ],
    [t("Bağlama alınan", "Included in context"), (r) => r.context?.used ?? 0],
    [
      t("Kullanılan kayıt bütçesi", "Used record budget"),
      (r) => `${r.context?.used ?? 0} / ${r.context?.budget ?? 0}`,
    ],
    [
      t("Güncel olmayan bilgi kullanımı", "Stale records used"),
      (r) =>
        r.records.filter(
          (x) => r.context?.recordIds.includes(x.id) && x.status !== "active",
        ).length,
    ],
    [
      t("Çözülemeyen çelişki (konu)", "Unresolved conflicts (claims)"),
      (r) =>
        new Set(
          r.records
            .filter((x) => x.status === "conflict")
            .map((x) => `${x.scope.user}:${x.scope.project}:${x.claim}`),
        ).size,
    ],
  ];
  return (
    <section className="comparison">
      <div className="page-heading">
        <div>
          <h1>
            {t(
              "Aynı olaylar. Üç bellek politikası.",
              "Same events. Three memory policies.",
            )}
          </h1>
          <p>
            {t(
              "Kontrollü bir karşılaştırma; genel ajan benchmark’ı değildir.",
              "A controlled comparison, not a general agent benchmark.",
            )}
          </p>
        </div>
        <GitCompare size={40} />
      </div>
      <div className="comparison-setup panel">
        <div>
          <h2>{scenario.title[lang]}</h2>
          <p>{scenario.lesson[lang]}</p>
          <div className="setup-meta">
            <span>
              v1 · {scenario.events.length} {t("olay", "events")}
            </span>
            <span>
              {scenario.compareSession
                ? t("Yeni oturum açılır", "Starts a new session")
                : t("Aynı oturum", "Same session")}
            </span>
            <span>
              +{scenario.compareAdvance} {t("gün", "days")}
            </span>
            <span>
              {t("Seçici eşik", "Selective threshold")}: {threshold.toFixed(2)}
            </span>
          </div>
        </div>
        <button
          className="primary"
          onClick={() => setRuns(compare(scenario, threshold, tombstones))}
        >
          <Play size={16} />
          {t("Üç politikayı karşılaştır", "Compare all three policies")}
        </button>
      </div>
      <p className="hint">
        {t(
          "Laboratuvardaki seçili senaryo kullanılır. Her politika aynı sentetik olayları, başlangıç saatini, sorguyu ve bütçeyi ayrı bir boş depoda çalıştırır. Kullanıcı kayıtları aktarılmaz; silme işaretleri üç politikaya eşit uygulanır.",
          "Uses the scenario selected in the laboratory. Each policy runs the same synthetic events, starting clock, query and budget in a separate empty store. User records are not transferred; deletion markers apply equally to all three policies.",
        )}
      </p>
      {runs.length > 0 ? (
        <>
          <div className="comparison-grid">
            {runs.map((r) => (
              <article className="panel comparison-column" key={r.policy}>
                <span className="column-letter">
                  {{ session: "A", simple: "B", selective: "C" }[r.policy]}
                </span>
                <h2>{policyNames[r.policy][lang]}</h2>
                <div
                  className={`outcome ${r.context?.matchesExpected ? "success" : "warning"}`}
                >
                  {r.context?.matchesExpected ? (
                    <CheckCircle size={19} />
                  ) : (
                    <CircleHelp size={19} />
                  )}{" "}
                  {r.context?.matchesExpected
                    ? t("Beklenen sonuca uygun", "Matches expected result")
                    : t(
                        "Beklenen sonuç karşılanmadı",
                        "Expected result not met",
                      )}
                </div>
                <dl>
                  {metrics.map(([label, calculate]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{calculate(r)}</dd>
                    </div>
                  ))}
                </dl>
                <h3>{t("Oluşan bağlam", "Assembled context")}</h3>
                {r.context?.recordIds.length ? (
                  r.context.recordIds.map((id) => (
                    <p key={id}>
                      <span className="mono">[{id}]</span>{" "}
                      {r.records.find((x) => x.id === id)?.content[lang]}
                    </p>
                  ))
                ) : (
                  <p>
                    {r.context?.outcome === "conflict"
                      ? t(
                          "Çelişki var; açıklama istenir.",
                          "Conflict present; clarification requested.",
                        )
                      : t(
                          "Bellek yetersiz; açıklama istenir.",
                          "Insufficient memory; clarification requested.",
                        )}
                  </p>
                )}
              </article>
            ))}
          </div>
          <p className="comparison-note">
            {t(
              "Uyum, senaryoda tanımlı sonuç türü ve gerekli değerlerin bağlamda bulunmasıyla hesaplanır. Seçici politika gürültü deneyinde yüksek eşikle yararlı kodu eler. Güvenlik filtreleri bütün politikalarda aynıdır.",
              "Alignment is computed from the scenario’s expected outcome and required values in context. With a high threshold, selective memory drops the useful code in the noise scenario. Safety filters are identical for all policies.",
            )}
          </p>
        </>
      ) : (
        <div className="comparison-empty">
          <GitCompare size={50} />
          <h2>
            {t("Farkı sonuçta görün.", "See the difference in the result.")}
          </h2>
          <p>
            {t(
              "Aynı girdiler, ayrı depolar ve açıklanabilir ölçümler.",
              "Identical inputs, isolated stores and explainable measurements.",
            )}
          </p>
        </div>
      )}
    </section>
  );
}
