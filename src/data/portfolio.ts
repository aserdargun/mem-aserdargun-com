import { L } from "../domain/model";
import type { Language } from "../domain/model";

export const portfolioUrl = (lang: Language) =>
  `https://aserdargun.com/${lang === "tr" ? "tr/" : ""}`;
export const contextUrl = (lang: Language) =>
  `https://ctx.aserdargun.com/${lang}/pipeline`;

// Public learning links, verified 2026-09-21. No experiment data is transferred.
export const relatedApps = [
  {
    code: "CTX",
    href: contextUrl,
    title: L("Bağlam ve bilgi mühendisliği", "Context & knowledge engineering"),
    lesson: L(
      "Belleğe alınacak bilginin kaynaktan bağlama yolunu incele.",
      "Trace information from its source into working context.",
    ),
  },
  {
    code: "ARL",
    href: () => "https://arl.aserdargun.com/",
    title: L("Ajan çalışma zamanı", "Agent runtime"),
    lesson: L(
      "Seçilen bağlamın ajan döngüsündeki yerini keşfet.",
      "Explore where selected context fits in the agent loop.",
    ),
  },
  {
    code: "DPL",
    href: () => "https://dpl.aserdargun.com/",
    title: L("Karar düzlemi", "Decision plane"),
    lesson: L(
      "Karar yolu ve değerlendirme çabası arasındaki ilişkiyi dene.",
      "Explore the relationship between decision paths and deliberation effort.",
    ),
  },
  {
    code: "CUL",
    href: () => "https://cul.aserdargun.com/",
    title: L("Bilgisayar kullanımı", "Computer use"),
    lesson: L(
      "Arayüz gözlemlerini eylem ve sonuçtan ayır.",
      "Distinguish interface observations from actions and outcomes.",
    ),
  },
  {
    code: "SEC",
    href: (lang: Language) => `https://sec.aserdargun.com/${lang}`,
    title: L("Güvenlik ve yetki sınırları", "Security & permission boundaries"),
    lesson: L(
      "Hatırlanan bir bilginin neden işlem yetkisi vermediğini incele.",
      "Examine why remembered information does not authorize an action.",
    ),
  },
  {
    code: "EVL",
    href: (lang: Language) => `https://evl.aserdargun.com/${lang}`,
    title: L("Değerlendirme ve güvenilirlik", "Evaluation & reliability"),
    lesson: L(
      "Senaryo beklentisi ile gerçek sistem değerlendirmesini ayır.",
      "Distinguish scenario expectations from real system evaluation.",
    ),
  },
];
