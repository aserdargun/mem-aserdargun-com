import { useState } from "react";
import type { Language, MemoryCandidate } from "../domain/model";
export function CreateRecord({
  lang,
  clock,
  sequence,
  project,
  onCreate,
  onCancel,
}: {
  lang: Language;
  clock: number;
  sequence: number;
  project: string;
  onCreate: (c: MemoryCandidate) => void;
  onCancel: () => void;
}) {
  const [content, setContent] = useState(""),
    [tag, setTag] = useState(""),
    [duration, setDuration] = useState("none");
  const t = (tr: string, en: string) => (lang === "tr" ? tr : en);
  return (
    <div className="create-record panel">
      <h2>
        {t("Kendi bellek adayını oluştur", "Create your own memory candidate")}
      </h2>
      <p>
        {t(
          "Metin aynen saklanır; otomatik çıkarım veya çeviri yoktur. Seçili politika adayı değerlendirir.",
          "Text is stored verbatim; there is no automatic extraction or translation. The selected policy evaluates the candidate.",
        )}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onCreate({
            id: `custom-${sequence + 1}`,
            kind: "fact",
            content: { tr: content.trim(), en: content.trim() },
            scope: { user: "Ada", project },
            source: {
              id: `SRC-custom-${sequence + 1}`,
              type: "user",
              title: { tr: "Kullanıcı kaydı", en: "User record" },
              version: 1,
              trusted: true,
            },
            claim: `custom-claim-${sequence + 1}`,
            value: content.trim(),
            tags: tag
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            importance: 0.9,
            durable: true,
            occurredAt: clock,
            validFrom: clock,
            ...(duration === "day" ? { validUntil: clock + 86_400_000 } : {}),
          });
        }}
      >
        <label htmlFor="custom-content">{t("İçerik", "Content")}</label>
        <textarea
          autoFocus
          id="custom-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          maxLength={1000}
          rows={3}
        />
        <div className="field-pair">
          <label>
            {t("Etiketler (virgülle)", "Tags (comma separated)")}
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              maxLength={100}
            />
          </label>
          <label>
            {t("Geçerlilik", "Validity")}
            <select
              aria-label={t("Geçerlilik", "Validity")}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              <option value="none">{t("Süresiz", "No expiry")}</option>
              <option value="day">{t("Bir gün", "One day")}</option>
            </select>
          </label>
        </div>
        <p className="hint">
          Ada / {project} · {t("Önem", "Importance")}: 0.90 ·{" "}
          {t(
            "Kayıt yalnızca veri olarak saklanır.",
            "Record is stored only as data.",
          )}
        </p>
        <div className="button-pair">
          <button className="primary" disabled={!content.trim()}>
            {t("Adayı kaydet", "Store candidate")}
          </button>
          <button type="button" onClick={onCancel}>
            {t("Vazgeç", "Cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}
