import { L } from "../domain/model";
export const lessons = [
  {
    scenario: "preferences",
    title: L(
      "Bağlam, kalıcı bellek değildir.",
      "Context is not persistent memory.",
    ),
    body: L(
      "Çalışma bağlamı, bu görev için seçilen bilgi kümesidir. Oturum durumu etkileşimin geçici ilerleyişidir. Kalıcı bellek, kapsamı izin veriyorsa sonraki oturumda da kullanılabilir. MEM bu üçünü ayrı tutar.",
      "Working context is the information selected for this task. Session state tracks temporary interaction progress. Persistent memory can be used in later sessions when its scope permits. MEM keeps these three separate.",
    ),
  },
  {
    scenario: "noise",
    title: L(
      "Her bilgiyi saklamanın bedeli",
      "The cost of remembering everything",
    ),
    body: L(
      "Daha fazla kayıt, sınırlı bağlamda daha çok rekabet demektir. Tekrarları birleştirmek kaynakları koruyarak yer açabilir. Ancak yüksek bir saklama eşiği, daha sonra önemli olacak ayrıntıyı silebilir.",
      "More records mean more competition for limited context. Merging duplicates can save space while preserving sources. But a high retention threshold may discard a detail that becomes important later.",
    ),
  },
  {
    scenario: "conflict",
    title: L(
      "Geri çağırma, doğrulama değildir.",
      "Retrieval is not verification.",
    ),
    body: L(
      "Bir sorguyla eşleşmek bir iddiayı doğru yapmaz. MEM eşleşme puanını doğruluk olasılığı olarak kullanmaz. İki farklı kaynakta aynı iddianın bulunması, kaynakların bağımsız olduğunu tek başına göstermez.",
      "Matching a query does not make a claim true. MEM does not treat a matching score as a probability of truth. Two sources repeating a claim are not necessarily independent evidence.",
    ),
  },
  {
    scenario: "project",
    title: L("Kaynak ve zaman", "Source and time"),
    body: L(
      "Kaydedilme zamanı, olay zamanı ve geçerlilik aralığı farklıdır. Geç gelen bir belge eski bir olayı anlatabilir. MEM açık düzeltmelerin geçmişini korur; yalnızca son yazılanı doğru kabul etmez.",
      "Recording time, event time and the validity interval are different. A late document can describe an old event. MEM preserves explicit correction history instead of assuming the latest write is true.",
    ),
  },
  {
    scenario: "conflict",
    title: L("Çelişki ve düzeltme", "Conflict and correction"),
    body: L(
      "Çözülemeyen iddialar görünür kalır ve bağlama alınmaz. Kullanıcı açık bir düzeltme yaptığında eski kayıt yeni sürüme bağlanır. Bu, dış dünyadaki doğruluğun kanıtlandığı anlamına gelmez.",
      "Unresolved claims remain visible and are excluded from context. An explicit user correction links the old record to a new revision. This does not prove truth in the outside world.",
    ),
  },
  {
    scenario: "expiry",
    title: L("Unutma ve silme", "Forgetting and deletion"),
    body: L(
      "Süre sonu kaydı geçmişte bırakır; yeni görevde kullanmaz. Silme ise içeriği, ilişkili sürümleri, kaynakları ve türetilmiş bağlamı yerel deneyden çıkarır. Daha önce indirilmiş dosyalar etkilenmez.",
      "Expiry preserves a historical record but excludes it from new tasks. Deletion removes content, related revisions, sources and derived context from the local experiment. Previously downloaded files are unaffected.",
    ),
  },
  {
    scenario: "scope",
    title: L(
      "Bellek, talimat veya yetki değildir.",
      "Memory is neither instruction nor authority.",
    ),
    body: L(
      "Kaynak metni, kendisini yönetim talimatına yükseltemez. Kayıtlar yalnızca veri olarak işlenir; kod veya işlem yürütülmez. Kullanıcı ve proje sınırları bütün politikalarda eşittir.",
      "Source text cannot promote itself into an administrative instruction. Records are treated as data only; no code or action is executed. User and project boundaries apply to every policy.",
    ),
  },
];
export const references = [
  {
    title: "Effective context engineering for AI agents",
    publisher: "Anthropic",
    url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents",
    published: "2025-09-29",
    accessed: "2026-09-21",
    note: L(
      "Bağlam seçimi ve yapılandırılmış not tutma üzerine birincil kaynak. MEM’nin kuralları kendi öğretim tasarımıdır.",
      "Primary source for context selection and structured note-taking. MEM’s rules are its own educational design.",
    ),
  },
  {
    title: "Memory overview",
    publisher: "LangChain",
    url: "https://docs.langchain.com/oss/javascript/concepts/memory",
    published: null,
    accessed: "2026-09-21",
    note: L(
      "Oturum kapsamlı ve oturumlar arası bellek; olgu, deneyim ve işlem örüntüsü kategorileri. İnsan belleğiyle birebir eşdeğerlik veya zorunlu mimari değildir.",
      "Session-scoped and cross-session memory; facts, experiences and procedure patterns. These are neither exact human-memory equivalents nor a mandatory architecture.",
    ),
  },
  {
    title: "Persistence",
    publisher: "LangChain / LangGraph",
    url: "https://docs.langchain.com/oss/javascript/langgraph/persistence",
    published: null,
    accessed: "2026-09-21",
    note: L(
      "Durum kalıcılığı ve kontrol noktası kavramları. MEM LangGraph kullanmaz; tarayıcıda sürümlü JSON saklar.",
      "State persistence and checkpoint concepts. MEM does not use LangGraph; it stores versioned JSON in the browser.",
    ),
  },
];
