import { ArrowUpRight, ArrowRight, BookOpen } from "lucide-react";
import { lessons, references } from "../data/methods";
import { relatedApps, portfolioUrl } from "../data/portfolio";
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
            "Sayfa yenileme deneyleri ve dili korur. Yeni oturum, uygulama içindeki bir eylemdir; sekmeyi kapatıp açmak değildir. Depolama bu tarayıcı ve site adresiyle sınırlıdır: özel alan adı, Azure adresi ve yerel önizleme arasında kayıtlar eşitlenmez. JSON dışa aktarılabilir; içe aktarma yoktur. Yeni oturum kalıcı kayıtları korur; silme sürüm zincirini ve türevleri kaldırır. Bozuk veya eski şema için kurtarma bildirimi gösterilir. Serbest kullanıcı metni çevrilmez; iki dilde de aynen görünür.",
            "Reloading preserves experiments and language. New session is an in-app action, not closing and reopening a tab. Storage is limited to this browser and site origin: the custom domain, Azure hostname and local preview do not synchronize records. JSON export is available; import is not. New sessions keep persistent records; deletion removes revision chains and derivatives. Corrupt or old schemas show a recovery notice. User-entered text is not translated and appears verbatim in both languages.",
          )}
        </p>
      </section>
      <section className="method-block">
        <h2>
          {t(
            "Deney saati ve geri çağırma puanı",
            "Experiment clock and retrieval score",
          )}
        </h2>
        <p>
          {t(
            "Senaryolar 1 Eylül 2026, 09.00 UTC’de başlar; bu tarih bugünün tarihi değildir. Adımlama ve sayfa yenileme deney saatini ilerletmez. Saati +1 gün ilerlet eylemi tam 24 saat ekler. Süreli atama 2 Eylül 09.00 UTC’de sona erer.",
            "Scenarios start at 09:00 UTC on 1 September 2026; this is not today’s date. Stepping and reloading do not advance the experiment clock. Advance +1 day adds exactly 24 hours. The time-limited assignment expires at 09:00 UTC on 2 September.",
          )}
        </p>
        <p>
          {t(
            "Puan = eşleşen farklı sözcük sayısı + 3 × eşleşen etiket sayısı + kayıt sırası / toplam kayıt sayısı. Seçici politika ayrıca 4 × önem ekler. Kayıt sırası, olayın güncelliğini veya doğruluğunu kanıtlamaz. Kapsam, oturum, süre ve çelişki kontrollerinden elenen kayıtlar yüksek puanla bile bağlama giremez.",
            "Score = distinct matching words + 3 × matching tags + insertion position / total records. Selective memory also adds 4 × importance. Insertion order does not prove an event is current or true. Records excluded by scope, session, validity or conflict checks cannot enter context even with a high score.",
          )}
        </p>
        <p>
          {t(
            "Hazır soru iki dilde aynı senaryo etiketlerini kullanır. Soruyu düzenlediğinizde iki dildeki kayıt metinleri ve etiketler üzerinde sözcük eşleşmesi yapılır; anlamsal çıkarım yapılmaz. Karşılaştırma, laboratuvarda değiştirdiğiniz soru veya bütçe yerine senaryonun hazır sorusunu ve kayıt bütçesini kullanır; seçili eşik ve silme işaretleri aktarılır.",
            "The preset question uses the same scenario tags in both languages. Editing it switches to word matching against both languages’ record text and tags, without semantic inference. Comparison uses the scenario’s preset query and record budget rather than your edited question or budget; the selected threshold and deletion markers carry over.",
          )}
        </p>
      </section>
      <section className="method-block">
        <h2>{t("CTX içindeki yeri", "Within CTX")}</h2>
        <p>
          {t(
            "MEM, aserdargun.com öğrenme sisteminde CTX altındaki ajan belleği laboratuvarıdır. CTX kaynaklardan çalışma bağlamına uzanan bilgi akışını, MEM ise oturumlar arası bilginin yaşam döngüsünü inceler. Aşağıdaki bağlantılar ayrı öğrenme uygulamalarını açar; deneyleriniz, kayıtlarınız ve sorularınız aktarılmaz.",
            "MEM is the agent memory laboratory under CTX in the aserdargun.com learning system. CTX explores information flow from sources to working context; MEM studies the lifecycle of cross-session information. The links below open separate learning applications; your experiments, records and queries are not transferred.",
          )}
        </p>
        <div className="ecosystem">
          {relatedApps.map((app) => (
            <a key={app.code} href={app.href(lang)}>
              <b>{app.code}</b>
              <span>
                {app.title[lang]}
                <small>{app.lesson[lang]}</small>
              </span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          ))}
        </div>
        <p>
          <a href={portfolioUrl(lang)}>
            {t(
              "Tüm öğrenme sistemini keşfet",
              "Explore the full learning system",
            )}{" "}
            →
          </a>
        </p>
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
