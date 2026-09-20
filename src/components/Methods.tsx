import { ArrowUpRight, ArrowRight, BookOpen } from "lucide-react";
import { lessons, references } from "../data/methods";
import type { Language } from "../domain/model";
export function Methods({
  lang,
  onExperiment,
}: {
  lang: Language;
  onExperiment: (id: string) => void;
}) {
  const t = (tr: string, en: string) => (lang === "tr" ? tr : en);
  return (
    <section className="methods">
      <div className="page-heading">
        <div>
          <h1>
            {t(
              "Hatırlamanın arkasındaki kurallar.",
              "The rules behind remembering.",
            )}
          </h1>
          <p>
            {t(
              "Kavramlar, tasarım tercihleri ve doğrulanmış kaynaklar.",
              "Concepts, design decisions and verified sources.",
            )}
          </p>
        </div>
        <BookOpen size={40} />
      </div>
      <div className="method-intro panel">
        <h2>
          {t(
            "Bir kayıt neyi garanti etmez?",
            "What does a record not guarantee?",
          )}
        </h2>
        <p>
          {t(
            "Bellekte bulunmak; doğru, güncel, ilgili, onaylanmış veya işlem yapmaya yetki veren bilgi olmak değildir. Belleğe yazmak model ağırlıklarını güncellemez. MEM içinde Astra veya başka bir model çalışmaz; eğitim ya da gerçek çevrim içi öğrenme yapılmaz.",
            "Being in memory does not mean a record is true, current, relevant, approved, or authorizes an action. Writing memory does not update model weights. MEM runs neither Astra nor any other model; there is no training or real online learning.",
          )}
        </p>
      </div>
      <div className="concept-separation">
        {[
          [
            t("Çalışma bağlamı", "Working context"),
            t(
              "Bu görevde seçilen kayıtlar.",
              "Records selected for this task.",
            ),
          ],
          [
            t("Oturum durumu", "Session state"),
            t(
              "Oturum numarası, soru ve geçici ilerleyiş.",
              "Session number, query and temporary progress.",
            ),
          ],
          [
            t("Kalıcı bellek", "Persistent memory"),
            t(
              "Sonraki oturumlarda kapsamla erişilen kayıtlar.",
              "Scoped records accessible in later sessions.",
            ),
          ],
          [
            t("Kaynak deposu", "Source repository"),
            t(
              "Belge ve materyaller. MEM’de sentetik kaynak referansları.",
              "Documents and materials. MEM uses synthetic source references.",
            ),
          ],
          [
            t("Önbellek", "Cache"),
            t(
              "Tekrar işi azaltan sonuçlar. MEM’de ayrı bir sonuç önbelleği yoktur.",
              "Results kept to reduce repeated work. MEM has no separate result cache.",
            ),
          ],
        ].map(([a, b], i) => (
          <div key={a}>
            <span className="mono">0{i + 1}</span>
            <h3>{a}</h3>
            <p>{b}</p>
          </div>
        ))}
      </div>
      <div className="lessons">
        {lessons.map((l, i) => (
          <article key={l.title.en}>
            <span className="lesson-number">0{i + 1}</span>
            <div>
              <h2>{l.title[lang]}</h2>
              <p>{l.body[lang]}</p>
            </div>
            <button onClick={() => onExperiment(l.scenario)}>
              {t("Deneyi aç", "Open experiment")}
              <ArrowRight size={15} />
            </button>
          </article>
        ))}
      </div>
      <section className="method-block">
        <h2>
          {t("Yöntem ve ölçüm sınırı", "Method and measurement boundaries")}
        </h2>
        <p>
          {t(
            "Bütün senaryolar kurgusaldır. Aday çıkarımı ve yanıtlar senaryo kurallarıyla üretilir. Arama sözcük ve etiket eşleştirmesidir. Bütçe kayıt sayısıdır; token, gerçek model başarısı veya üretim performansı ölçülmez. Uyum, beklenen sonuç türü ve gerekli değerlerin bulunmasıdır; precision/recall raporlanmaz.",
            "All scenarios are fictional. Candidate extraction and answers use scenario rules. Search matches words and tags. The budget counts records; it does not measure tokens, real model ability or production performance. Alignment checks outcome type and required values; no precision/recall is reported.",
          )}
        </p>
        <p>
          {t(
            "Sayfa yenileme deneyleri ve dili korur. Depolama bu tarayıcı ve origin ile sınırlıdır. Yeni oturum kalıcı kayıtları korur; silme sürüm zincirini ve türevleri kaldırır. Bozuk veya eski şema için kurtarma bildirimi gösterilir. Serbest kullanıcı metni çevrilmez; iki dilde de aynen görünür.",
            "Reloading preserves experiments and language. Storage is limited to this browser and origin. New sessions keep persistent records; deletion removes revision chains and derivatives. Corrupt or old schemas show a recovery notice. User-entered text is not translated and appears verbatim in both languages.",
          )}
        </p>
      </section>
      <section className="method-block">
        <h2>{t("CTX içindeki yeri", "Within CTX")}</h2>
        <p>
          {t(
            "CTX kaynaklardan çalışma bağlamına uzanan bilgi akışını inceler. MEM, bu akışta oturumlar arası bilginin yaşam döngüsüne odaklanır. Aşağıdaki ilişkiler kavramsaldır; bağlı servis veya veri alışverişi yoktur.",
            "CTX studies information flow from sources to working context. MEM focuses on the lifecycle of cross-session information in that flow. These relationships are conceptual; there are no connected services or data exchanges.",
          )}
        </p>
        <div className="ecosystem">
          {[
            [
              "CTX",
              t(
                "Bağlam ve bilgi mühendisliği",
                "Context & knowledge engineering",
              ),
            ],
            ["ARL", t("Ajan çalışma zamanı", "Agent runtime")],
            [
              "DPL",
              t(
                "Karar yolu ve değerlendirme çabası",
                "Decision path & deliberation effort",
              ),
            ],
            [
              "CUL",
              t("Arayüz üzerinden eylemler", "Actions through interfaces"),
            ],
            [
              "SEC",
              t(
                "Güvenlik ve yetki sınırları",
                "Security & permission boundaries",
              ),
            ],
            [
              "EVL",
              t("Değerlendirme ve güvenilirlik", "Evaluation & reliability"),
            ],
          ].map(([code, desc]) => (
            <div key={code}>
              <b>{code}</b>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="method-block">
        <h2>{t("Birincil kaynaklar", "Primary sources")}</h2>
        {references.map((r) => (
          <article className="reference" key={r.url}>
            <div>
              <a href={r.url} target="_blank" rel="noreferrer">
                {r.title}
                <ArrowUpRight size={16} />
              </a>
              <p>{r.note[lang]}</p>
              <small>
                {r.publisher} · {t("Yayın", "Published")}:{" "}
                {r.published ?? t("Belirtilmemiş", "Not stated")} ·{" "}
                {t("Erişim", "Accessed")}: {r.accessed}
              </small>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
