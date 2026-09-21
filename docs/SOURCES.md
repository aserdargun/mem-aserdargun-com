# Kaynak defteri / Source ledger

Erişim ve doğrulama tarihi: **2026-09-21**. Aşağıdaki sayfalar bu çalışma sırasında açılarak incelendi. Kaynak kavramları ile MEM'nin kendi deterministik öğretim kuralları ayrıdır. Kaynaklar hiçbir politika sonucu için genel başarı iddiası oluşturmaz.

| Başlık | Yayıncı | Yayın tarihi | URL | Kullanımı |
| --- | --- | --- | --- | --- |
| Effective context engineering for AI agents | Anthropic | 2025-09-29 | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents | Bağlam seçimi ve structured note-taking |
| Memory overview | LangChain | Sayfada belirtilmemiş | https://docs.langchain.com/oss/javascript/concepts/memory | Oturum kapsamlı / oturumlar arası bellek; olgu, deneyim ve işlem örüntüsü kategorileri |
| Persistence | LangChain / LangGraph | Sayfada belirtilmemiş | https://docs.langchain.com/oss/javascript/langgraph/persistence | Kalıcı durum ve kontrol noktası kavramları |

MEM, bu framework'leri çalıştırmaz. Kaynakların anlattığı üretim mimarileri MEM içinde kurulmuş sayılmaz. İnsan belleği benzetmeleri tam eşdeğerlik veya tüm ajanlar için zorunlu şema değildir.

## Kanıt türlerinin ayrımı

- **Kaynak bilgisi:** Yukarıdaki teknik yayınlarda incelenen kavramlar.
- **Ürün tasarımı:** MEM'nin üç politikası, 0.65 varsayılan eşik, puan formülü, kayıt bütçesi, silme sözleşmesi ve kullanıcı deneyimi.
- **Sentetik veri:** Ada, Ece, Can, Deniz; Atlas/Nova projeleri; tarihler, oda adları ve erişim kodu. Gerçek kişi/proje entegrasyonu değildir.
- **Kullanıcı girdisi:** Açıkça oluşturulan/düzeltilen yerel kayıt metni; iki dilde aynen gösterilir ve dışarı gönderilmez.
- **Deney sonucu:** Gerçek alan motorunun kayıtları, eleme gerekçeleri ve bağlam sayımları. Gerçek model zekâsı, token tasarrufu veya üretim performansı değildir.

## Portföy bağlantıları

21 Eylül 2026 tarihinde `aserdargun.com` (EN kök ve `/tr/`), `mem.aserdargun.com`, CTX (`/en/pipeline`, `/tr/pipeline`), ARL, DPL, CUL, SEC (`/en`, `/tr`) ve EVL (`/en`, `/tr`) HTTPS adresleri açılarak 200 yanıtları doğrulandı. MEM ve Azure adresinin `release.json` kimlikleri eşleşti.

MEM → CTX ilişkisi ana portföyün `data/system-focus.json` kaydıyla uyumludur. `src/data/portfolio.ts` bu uygulamadaki öğrenme bağlantılarını tutar. CTX/SEC/EVL bağlantıları seçili dilde açılır; ARL/DPL/CUL kendi dil seçicilerini kullanır. Bağlantılar servis entegrasyonu veya veri alışverişi değildir; deney kayıtları URL’ye eklenmez.
