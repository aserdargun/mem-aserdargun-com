import { L } from "./domain/model";
import type {
  ExclusionReason,
  Language,
  MemoryPolicy,
  MemoryStatus,
} from "./domain/model";
export const policyNames: Record<MemoryPolicy, ReturnType<typeof L>> = {
  session: L("Yalnızca oturum", "Session only"),
  simple: L("Basit kalıcı bellek", "Simple persistent"),
  selective: L("Seçici ve sürümlü", "Selective & versioned"),
};
export const policyInfo: Record<MemoryPolicy, ReturnType<typeof L>> = {
  session: L(
    "Kayıtlar bu oturumla sınırlı. Yeni oturum eyleminden sonra geri çağrılmaz; sayfa yenilemek yeni oturum açmaz.",
    "Records are scoped to this session. The New session action makes them unavailable; reloading the page does not start a session.",
  ),
  simple: L(
    "Kalıcı bilgiler saklanır; sözcük eşleşmesi ve kayıt sırası kullanılır. Tek seferlik istek oturumda kalır.",
    "Durable facts persist; word matching and insertion order rank results. One-off requests stay in the session.",
  ),
  selective: L(
    "Eşik, kaynaklar ve tekrarlar birlikte değerlendirilir. Fazla sıkı eşik yararlı bilgiyi eleyebilir.",
    "Threshold, sources and duplicates are considered together. A strict threshold can discard useful details.",
  ),
};
export const statusNames: Record<MemoryStatus, ReturnType<typeof L>> = {
  candidate: L("Aday", "Candidate"),
  active: L("Etkin", "Active"),
  conflict: L("Çelişkili", "Conflicting"),
  superseded: L("Yerine yenisi geçti", "Superseded"),
  expired: L("Süresi doldu", "Expired"),
  deleted: L("Silindi", "Deleted"),
};
export const reasons: Record<ExclusionReason, ReturnType<typeof L>> = {
  selected: L("Bağlama alındı", "Included in context"),
  scope: L("Yanlış kapsam", "Wrong scope"),
  session: L("Önceki oturum", "Previous session"),
  expired: L("Süresi doldu", "Expired"),
  future: L("Henüz geçerli değil", "Not yet valid"),
  superseded: L("Yerine yeni kayıt geçti", "Superseded"),
  conflict: L("Çözülmeyen çelişki", "Unresolved conflict"),
  irrelevant: L("Sorguyla eşleşmedi", "No query match"),
  budget: L("Bütçe dışında", "Outside budget"),
  deleted: L("Silinmiş içerik", "Deleted content"),
};
export const eventNames: Record<string, ReturnType<typeof L>> = {
  write: L("Kaydedildi", "Stored"),
  reject: L("Aday elendi", "Candidate rejected"),
  merge: L("Tekrar birleştirildi", "Duplicate merged"),
  correct: L("Düzeltme kaydedildi", "Correction stored"),
  session: L("Yeni oturum", "New session"),
  query: L("Bağlam oluşturuldu", "Context assembled"),
  advance: L("Saat ilerletildi", "Clock advanced"),
  delete: L("İçerik silindi", "Content deleted"),
  skip: L("Silinen aday atlandı", "Deleted candidate skipped"),
  reset: L("Deney sıfırlandı", "Experiment reset"),
};
export const retentionNames: Record<string, ReturnType<typeof L>> = {
  session: L(
    "Yalnızca bu oturum için saklandı.",
    "Stored for this session only.",
  ),
  durable: L(
    "Kalıcı bilgi adayı olduğu için saklandı.",
    "Stored because it is a durable candidate.",
  ),
  threshold: L(
    "Önem değeri saklama eşiğini karşıladı.",
    "Importance meets the retention threshold.",
  ),
  correction: L(
    "Açık ve güvenilir kullanıcı düzeltmesi.",
    "Explicit, trusted user correction.",
  ),
  untrusted: L(
    "Kaynak içeriği yönetim talimatı olamaz.",
    "Source content cannot become an administrative instruction.",
  ),
  temporary: L(
    "Tek seferlik istek kalıcı tercih sayılmadı.",
    "A one-off request was not treated as a lasting preference.",
  ),
  "below-threshold": L(
    "Önem değeri saklama eşiğinin altında.",
    "Importance is below the retention threshold.",
  ),
  deleted: L(
    "Silme işareti korundu; içerik geri yüklenmedi.",
    "Deletion marker retained; content was not restored.",
  ),
};
export const kinds = {
  fact: L("Olgu / tercih", "Fact / preference"),
  episode: L("Geçmiş olay", "Past event"),
  procedure: L("İşlem örüntüsü", "Procedure pattern"),
};
export const sourceTypes = {
  user: L("Kullanıcı", "User"),
  document: L("Belge", "Document"),
  note: L("Not", "Note"),
};
export function date(time: number | undefined, lang: Language) {
  return time === undefined
    ? "—"
    : new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      }).format(time);
}
