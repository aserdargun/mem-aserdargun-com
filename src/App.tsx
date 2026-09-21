import { useEffect, useState, useRef } from "react";
import { ArrowRight, Database, ShieldCheck, Trash2, Check } from "lucide-react";
import {
  fresh,
  step,
  nextSession,
  advance,
  correct,
  forget,
  reset,
  write,
} from "./domain/engine";
import { retrieve } from "./domain/retrieval";
import {
  load,
  save,
  initialState,
  STORAGE_KEY,
  exportRun,
} from "./domain/persistence";
import type { ExperimentRun, Language, MemoryPolicy } from "./domain/model";
import { getScenario } from "./data/scenarios";
import { portfolioUrl, contextUrl } from "./data/portfolio";
import { Controls } from "./components/Controls";
import { Workspace } from "./components/Workspace";
import type { View } from "./components/Workspace";
import { Inspector } from "./components/Inspector";
import { Timeline } from "./components/Timeline";
import { Comparison } from "./components/Comparison";
import { Methods } from "./components/Methods";
import { CreateRecord } from "./components/CreateRecord";
export default function App() {
  const [loaded] = useState(load);
  const [state, setState] = useState(loaded.state);
  const [recovered, setRecovered] = useState(loaded.recovered);
  const [storageError, setStorageError] = useState(loaded.unavailable);
  const [page, setPage] = useState<"lab" | "comparison" | "methods">("lab");
  const [view, setView] = useState<View>("memory");
  const [selected, setSelected] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [customQuery, setCustomQuery] = useState<string | null>(null);
  const [project, setProject] = useState("Atlas");
  const [customBudget, setCustomBudget] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");
  const [clearPrompt, setClearPrompt] = useState(false);
  const [reloadPrompt, setReloadPrompt] = useState(false);
  const dirty = useRef(false);
  const main = useRef<HTMLDivElement>(null);
  const lang = state.language,
    t = (tr: string, en: string) => (lang === "tr" ? tr : en);
  const scenario = getScenario(state.selectedScenario);
  const key = `${scenario.id}:${state.selectedPolicy}`;
  const run = state.runs[key] ?? fresh(scenario.id, state.selectedPolicy);
  const budget = customBudget ?? scenario.budget;
  const query = customQuery ?? scenario.query[lang];
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    if (selected && window.innerWidth <= 1200) {
      const inspector = document.querySelector<HTMLElement>(".inspector");
      inspector?.scrollIntoView({ block: "start", behavior: "instant" });
      inspector?.focus({ preventScroll: true });
    }
  }, [selected]);
  useEffect(() => {
    if (dirty.current && !recovered) {
      setStorageError(!save(state));
    }
  }, [state, recovered]);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      dirty.current = true;
      setState((s) => {
        const k = `${s.selectedScenario}:${s.selectedPolicy}`;
        const r = s.runs[k] ?? fresh(s.selectedScenario, s.selectedPolicy);
        const sc = getScenario(s.selectedScenario);
        return { ...s, runs: { ...s.runs, [k]: step(r, sc) } };
      });
    }, 850);
    return () => clearInterval(timer);
  }, [playing]);
  useEffect(() => {
    if (run.cursor >= scenario.events.length) setPlaying(false);
  }, [run.cursor, scenario.events.length]);
  const update = (fn: (r: ExperimentRun) => ExperimentRun) => {
    dirty.current = true;
    setState((s) => ({
      ...s,
      runs: {
        ...s.runs,
        [key]: fn(s.runs[key] ?? fresh(s.selectedScenario, s.selectedPolicy)),
      },
    }));
    setNotice("");
  };
  const chooseScenario = (id: string) => {
    setPlaying(false);
    setSelected(null);
    setCustomQuery(null);
    setCustomBudget(null);
    setProject("Atlas");
    setCreating(false);
    setView("memory");
    dirty.current = true;
    setState((s) => ({ ...s, selectedScenario: id }));
  };
  const choosePolicy = (policy: MemoryPolicy) => {
    setPlaying(false);
    setSelected(null);
    setView("memory");
    dirty.current = true;
    setState((s) => ({ ...s, selectedPolicy: policy }));
  };
  const recall = () => {
    update((r) =>
      retrieve(
        r,
        {
          text: customQuery ?? "",
          tags: customQuery === null ? scenario.tags : [],
          scope: { user: "Ada", project },
          budget,
        },
        customQuery === null && project === "Atlas" ? scenario : undefined,
      ),
    );
    setView("context");
  };
  const download = () => {
    const blob = new Blob([exportRun(run, lang)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mem-${run.scenarioId}-${run.policy}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(
      t("Deney JSON olarak indirildi.", "Experiment downloaded as JSON."),
    );
  };
  const erase = () => {
    setPlaying(false);
    dirty.current = false;
    let removed = true;
    try {
      localStorage.removeItem(STORAGE_KEY);
      setStorageError(false);
    } catch {
      removed = false;
      setStorageError(true);
    }
    setState({ ...initialState(), language: lang });
    setSelected(null);
    setView("memory");
    setCustomQuery(null);
    setCustomBudget(null);
    setProject("Atlas");
    setCreating(false);
    setClearPrompt(false);
    setReloadPrompt(false);
    setRecovered(false);
    setPage("lab");
    setNotice(
      removed
        ? t(
            "Bu tarayıcıdaki laboratuvar deneyleri silindi. Önceki indirmeler etkilenmez.",
            "Laboratory experiments in this browser were deleted. Previous downloads are unaffected.",
          )
        : t(
            "Sayfa durumu temizlendi ancak tarayıcı depolaması silinemedi. Tarayıcının site verisi ayarlarından temizleyin.",
            "Page state was cleared, but browser storage could not be erased. Clear site data in your browser settings.",
          ),
    );
  };
  return (
    <>
      <a className="skip-link" href="#main">
        {t("Laboratuvara geç", "Skip to laboratory")}
      </a>
      <header className="site-header">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("lab");
          }}
          aria-label="MEM Agent Memory Laboratory"
        >
          <span>
            MEM<span className="brand-dot">.</span>
          </span>
          <small>
            Agent Memory
            <br />
            Laboratory
          </small>
        </a>
        <nav aria-label={t("Ana gezinme", "Main navigation")}>
          {(["lab", "comparison", "methods"] as const).map((id, i) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              aria-current={page === id ? "page" : undefined}
              onClick={() => {
                setPage(id);
                setPlaying(false);
                setCreating(false);
              }}
            >
              {
                [
                  t("Laboratuvar", "Laboratory"),
                  t("Karşılaştırma", "Comparison"),
                  t("Kavramlar ve yöntem", "Concepts & method"),
                ][i]
              }
            </button>
          ))}
        </nav>
        <div className="language" aria-label={t("Dil", "Language")}>
          {(["tr", "en"] as Language[]).map((l) => (
            <button
              key={l}
              aria-pressed={lang === l}
              onClick={() => {
                dirty.current = true;
                setState((s) => ({ ...s, language: l }));
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>
      <nav
        className="portfolio-nav"
        aria-label={t("Öğrenme sistemi", "Learning system")}
      >
        <a href={portfolioUrl(lang)}>aserdargun.com</a>
        <span aria-hidden="true">/</span>
        <a href={contextUrl(lang)}>
          {t("CTX · Bağlam ve bilgi", "CTX · Context & knowledge")}
        </a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">MEM</span>
      </nav>
      <main id="main" ref={main} tabIndex={-1}>
        {recovered && (
          <div className="banner warning" role="alert">
            <strong>
              {t(
                "Yerel kayıt okunamadı: şema eski veya veri bozuk.",
                "Local data could not be read: outdated schema or corrupt data.",
              )}
            </strong>
            <p>
              {t(
                "Uygulama güvenli, boş bir durumda açıldı. Yeni deneyleri saklamak için bozuk kaydı temizleyin.",
                "The app opened in a safe empty state. Clear the invalid data to save new experiments.",
              )}
            </p>
            <button onClick={erase}>
              {t("Bozuk kaydı temizle", "Clear invalid data")}
            </button>
          </div>
        )}
        {storageError && (
          <div className="banner warning" role="alert">
            {t(
              "Tarayıcı depolaması kullanılamıyor. Değişiklikler yalnızca bu sayfa açıkken korunur; JSON indirin.",
              "Browser storage is unavailable. Changes survive only while this page is open; export JSON.",
            )}
          </div>
        )}
        {notice && (
          <div className="notice" role="status">
            <Check size={15} />
            {notice}
          </div>
        )}
        {page === "lab" ? (
          <>
            <section className="hero">
              <div>
                <h1>
                  {t("Önemli olanı hatırla.", "Remember what matters.")}
                  <span>
                    {t("Değişeni yeniden doğrula.", "Recheck what changes.")}
                  </span>
                </h1>
              </div>
              <div className="hero-description">
                <p>
                  {t(
                    "Bir ajan neyi saklamalı, ne zaman hatırlamalı ve ne zaman unutmalı? Belleğin davranışını deneyerek keşfet.",
                    "What should an agent keep, recall, or forget? Explore how memory behaves, one experiment at a time.",
                  )}
                </p>
                <span className="mono">
                  {t(
                    "Deterministik deney · Sentetik veri · Yerel kayıt",
                    "Deterministic experiment · Synthetic data · Local storage",
                  )}
                </span>
              </div>
              <button
                className="primary start-button"
                onClick={() => {
                  if (run.cursor === 0) update((r) => step(r, scenario));
                  main.current
                    ?.querySelector("#lab-workspace")
                    ?.scrollIntoView({
                      behavior: window.matchMedia(
                        "(prefers-reduced-motion: reduce)",
                      ).matches
                        ? "instant"
                        : "smooth",
                      block: "start",
                    });
                }}
              >
                {t("İlk deneyi başlat", "Start your first experiment")}
                <ArrowRight size={18} />
              </button>
            </section>
            <div className="lab-topline">
              <div>
                <span className="lime-square" />
                <strong>
                  {t("Ajan Belleği Laboratuvarı", "Agent Memory Laboratory")}
                </strong>
                <span className="muted">/ {scenario.title[lang]}</span>
              </div>
              <span className="storage-label">
                <ShieldCheck size={14} />
                {storageError
                  ? t("Geçici depolama", "Temporary storage")
                  : t("Bu tarayıcıda saklanır", "Saved in this browser")}
              </span>
            </div>
            {creating && (
              <CreateRecord
                lang={lang}
                clock={run.clock}
                sequence={run.sequence}
                project={project}
                onCreate={(c) => {
                  update((r) => write(r, c));
                  setCreating(false);
                  setView("memory");
                }}
                onCancel={() => setCreating(false)}
              />
            )}
            <div className="lab-grid" id="lab-workspace">
              <Controls
                lang={lang}
                run={run}
                scenario={scenario}
                playing={playing}
                query={query}
                project={project}
                budget={budget}
                onScenario={chooseScenario}
                onPolicy={choosePolicy}
                onStep={() => update((r) => step(r, scenario))}
                onPlay={() => setPlaying((v) => !v)}
                onQuery={setCustomQuery}
                onProject={setProject}
                onBudget={setCustomBudget}
                onRetrieve={recall}
                onThreshold={(n) => update((r) => ({ ...r, threshold: n }))}
                onCreate={() => {
                  setPlaying(false);
                  setCreating(true);
                }}
              />
              <Workspace
                lang={lang}
                run={run}
                scenario={scenario}
                view={view}
                onView={setView}
                selected={selected}
                onSelect={setSelected}
              />
              <Inspector
                key={`${key}:${selected}`}
                lang={lang}
                run={run}
                record={run.records.find((r) => r.id === selected)}
                onCorrect={(s) => {
                  update((r) => correct(r, selected!, s));
                  setSelected(null);
                  setView("memory");
                }}
                onDelete={() => {
                  setPlaying(false);
                  update((r) => forget(r, selected!, scenario.events));
                  setSelected(null);
                  setCustomQuery(null);
                  setView("memory");
                }}
                onClose={() => setSelected(null)}
              />
              <div className="timeline-span">
                <Timeline
                  lang={lang}
                  run={run}
                  onSession={() => {
                    setPlaying(false);
                    update(nextSession);
                    setCustomQuery(null);
                    setSelected(null);
                    setView("memory");
                    setNotice(
                      t(
                        "Yeni oturum açıldı. Kalıcı bellek korundu.",
                        "New session started. Persistent memory retained.",
                      ),
                    );
                  }}
                  onTask={() => {
                    update((r) => ({ ...r, context: null }));
                    setCustomQuery(null);
                    setView("memory");
                  }}
                  onAdvance={() => update((r) => advance(r))}
                  onReset={() => {
                    setPlaying(false);
                    update(reset);
                    setSelected(null);
                    setView("memory");
                    setCustomQuery(null);
                  }}
                  onExport={download}
                  onReload={() => setReloadPrompt(true)}
                />
              </div>
            </div>
            <div className="lesson-strip">
              <Database size={20} />
              <p>{scenario.lesson[lang]}</p>
              <button className="quiet" onClick={() => setPage("methods")}>
                {t("Yöntemi incele", "Explore the method")}
                <ArrowRight size={15} />
              </button>
            </div>
          </>
        ) : page === "comparison" ? (
          <Comparison
            key={`${key}:${run.threshold}:${run.tombstones.join(",")}`}
            lang={lang}
            scenario={scenario}
            threshold={run.threshold}
            tombstones={run.tombstones}
          />
        ) : (
          <Methods
            lang={lang}
            onExperiment={(id) => {
              chooseScenario(id);
              setPage("lab");
            }}
          />
        )}
        {reloadPrompt && (
          <section className="confirm-panel panel" role="alert">
            <h2>
              {t("Sentetik veriyi baştan yükle", "Reload synthetic data")}
            </h2>
            <p>
              {t(
                "Bu işlem seçili deneyin mevcut kayıtlarını ve ilerleyişini temizler, silme işaretlerini kaldırır ve kurgusal senaryo adaylarını başa alır. Kendi kayıtlarınız silinir ve geri getirilemez; saklamak için önce JSON dışa aktarın. Diğer deneyler etkilenmez.",
                "This clears the selected experiment’s current records and progress, removes deletion markers and restarts the fictional scenario candidates. Your own records are deleted and cannot be restored; export JSON first to keep a copy. Other experiments are unaffected.",
              )}
            </p>
            <div className="button-pair">
              <button
                onClick={() => {
                  setPlaying(false);
                  update((r) => fresh(r.scenarioId, r.policy, r.threshold));
                  setReloadPrompt(false);
                  setSelected(null);
                }}
              >
                {t("Sentetik veriyi yükle", "Load synthetic data")}
              </button>
              <button onClick={() => setReloadPrompt(false)}>
                {t("Vazgeç", "Cancel")}
              </button>
            </div>
          </section>
        )}
        {clearPrompt && (
          <section className="confirm-panel panel" role="alert">
            <h2>
              {t("Tüm yerel deneyleri sil?", "Delete all local experiments?")}
            </h2>
            <p>
              {t(
                "Altı senaryonun tüm politikaları, kendi kayıtlarınız ve sonuçlar bu tarayıcıdan kaldırılır. İndirdiğiniz dosyalar silinmez.",
                "All policies for all six scenarios, your records and results will be removed from this browser. Downloaded files will not be deleted.",
              )}
            </p>
            <div className="button-pair">
              <button className="danger" onClick={erase}>
                {t("Evet, tüm veriyi sil", "Yes, delete all data")}
              </button>
              <button onClick={() => setClearPrompt(false)}>
                {t("Vazgeç", "Cancel")}
              </button>
            </div>
          </section>
        )}
      </main>
      <footer>
        <div>
          <strong>MEM</strong>
          <span>
            CTX / {t("Ajan Belleği Laboratuvarı", "Agent Memory Laboratory")}
          </span>
          <small>
            {t(
              "mem.aserdargun.com · Deneyler bu tarayıcı ve site adresinde saklanır",
              "mem.aserdargun.com · Experiments are stored in this browser and site origin",
            )}
          </small>
        </div>
        <button
          className="quiet"
          onClick={() => {
            setPlaying(false);
            setClearPrompt(true);
          }}
        >
          <Trash2 size={14} />
          {t("Tüm laboratuvar verisini sil", "Delete all laboratory data")}
        </button>
      </footer>
    </>
  );
}
