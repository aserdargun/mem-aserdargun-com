# MEM — Agent Memory Laboratory

**Önemli olanı hatırla. Değişeni yeniden doğrula.** / **Remember what matters. Recheck what changes.**

CTX araştırma alanı altında, ajan belleğinin yaşam döngüsünü öğreten bağımsız TR/EN web laboratuvarı. Altı sentetik senaryo, üç ayrı bellek politikası, gerçek yerel kalıcılık, kaynak/sürüm ilişkileri, açıklanabilir geri çağırma, düzeltme, süre sonu, silme ve JSON dışa aktarımı içerir.

**Bağımsız statik uygulama.** Yayın adresi [mem.aserdargun.com](https://mem.aserdargun.com/). [aserdargun.com öğrenme sistemi](https://aserdargun.com/tr/) içinde [CTX](https://ctx.aserdargun.com/tr/pipeline) altında yer alır. Arayüzden CTX, ARL, DPL, CUL, SEC ve EVL öğrenme uygulamalarına geçilebilir; bağlantılar deney verisi aktarmaz ve servis entegrasyonu oluşturmaz. Özel alan adı ve Azure adresinin aynı MEM sürümünü sunduğu 21 Eylül 2026 tarihinde HTTPS üzerinden doğrulandı.

## Çalıştırma

Node.js 22.12+ ve npm gerektirir; geliştirmede Node 22.23.1 kullanıldı.

```sh
npm ci
npm run dev:codex
```

Önizleme: **http://127.0.0.1:8041**. Ön planda çalıştırmak için `npm run dev` kullanılabilir. Yazı tipleri paket içindedir; çalışma anında üçüncü taraf font isteği yapılmaz. API anahtarı, hesap, backend veya model erişimi gerekmez.

```sh
npm run test             # Deterministik alan testleri
npm run build            # TypeScript kontrolü + dist/ statik üretim paketi
npm run test:e2e         # Chromium ile dist/ üzerinde gerçek tarayıcı testleri
npm run validate:codex   # Alan + derleme + tarayıcı kontrolleri
npm run stop:codex       # Yalnızca bu checkout'un 8041 portundaki Vite sürecini durdurur
```

Playwright Chromium bulunmayan bir bilgisayarda ilk kurulum: `npx playwright install chromium`. Tarayıcı testleri 8042 portunda kendi üretim önizlemesini başlatıp durdurur. Bu port meşgulse mevcut servisi kapatmadan hata verir. `npm run preview` aynı portu elle açar; bitirmek için Ctrl+C kullanılır. `scripts/server.mjs` 8041 portunda yabancı bir checkout bulursa başlatma ve durdurmayı reddeder. Durum dosyaları ve günlük `.local/` altındadır.

## İlk uçtan uca deney

1. **İlk deneyi başlat** ile Ada'nın kısa Türkçe rapor tercihini kaydet.
2. **Yeni oturum** aç; **Geri çağır ve bağlam oluştur** eylemini çalıştır.
3. Bağlamdaki kaydı seç. Kaynak, zaman, saklama ve kullanım gerekçesini incele.
4. **Bilgiyi düzelt** ile yeni tercihi yaz. Yeniden sorgula; eski sürüm elenir.
5. Yeni kaydı seçip **Kaydı ve sürümlerini sil**. Yeniden sorgula: açıklama istenir.
6. JSON indir ve deneyi sıfırla. Silinen içerik geri dönmez.

## Senaryolar

| Senaryo | İncelenen davranış |
| --- | --- |
| Tercih hatırlama | Kalıcı tercih / tek seferlik istek; yeni oturum |
| Değişen proje | Açık düzeltme, eski sürüm, geç gelen eski belge |
| Çelişkili kaynaklar | Çözülmeyen çelişki, tekrarın doğrulama olmaması |
| Süresi dolan bilgi | Kontrollü saatte +1 gün, geçersiz atama, açıklama isteme |
| Bellek gürültüsü | Bütçe, tekrarlar, sıkı eşikle yararlı bilginin elenmesi |
| Kapsam ve unutma | Atlas/Nova ayrımı, güvenilmeyen talimatın reddi, silme |

Politikalar bağımsız `senaryo:politika` depolarındadır. **Yalnızca oturum** kayıtları yeni oturumda kullanmaz; **basit kalıcı** dayanıklı bilgiyi tutar; **seçici ve sürümlü** eşik ve tekrar birleştirme uygular. Geçerlilik, kapsam, açık düzeltme ve yetki kontrolleri her politikada zorunludur.

## Deney saati ve puanlama

Senaryolar 1 Eylül 2026 09.00 UTC’de başlar; tarihler sentetik deney zamanıdır. Adımlama veya gerçek günün değişmesi saati ilerletmez. **Saati +1 gün ilerlet** tam 24 saat ekler. **Yeni oturum** uygulama içi bir deney eylemidir; tarayıcı sekmesini kapatıp açmak değildir.

Hazır sorular iki dilde aynı etiketleri kullanır; düzenlenen soru iki dildeki kayıt metinleri ve etiketlerde sözcük eşleşmesi yapar. Puan, eşleşen farklı sözcükler + 3 × eşleşen etiketler + kayıt sırası / kayıt sayısıdır; seçici politika 4 × önem ekler. Kapsam ve geçerlilik filtreleri her zaman önceliklidir. Karşılaştırma, değiştirilen soru/bütçe yerine senaryonun hazır sorusunu ve bütçesini kullanır; seçili eşik ve silme işaretlerini taşır.

## Kalıcılık ve silme sözleşmesi

- `localStorage`, anahtar `mem-laboratory:v1`, şema sürümü 1. Aynı tarayıcı/origin'de dil, seçili senaryo/politika ve deney durumları yenilemeden sonra kalır. Önizlemenin 8041, testin 8042, özel alan adı ve Azure adresinin origin'leri ayrıdır; aralarında otomatik aktarım veya eşitleme yoktur. JSON dışa aktarımı bir inceleme/yedek dosyasıdır; uygulama JSON içe aktarmayı desteklemez.
- Soru taslağı, açık ayrıntı paneli ve oynatma geçicidir. Son oluşturulmuş bağlam ve sorgusu deneyle saklanır. Sayfa yenilemek oynatmayı sürdürmez.
- Yeni görev belleği korur, son bağlamı temizler. Yeni oturum bağlamı temizler, kalıcı kayıtları korur; eski oturum kayıtları incelenebilir ama geri çağrılamaz.
- Deneyi sıfırla, seçili deneyin kullanıcı kayıtlarını ve ilerleyişini temizler; silme işaretleri korunur. Senaryo adayları başlangıca döner; silinmiş olanlar atlanır.
- Silme seçili deneyde kayıt içeriğini, sürüm zincirini, aynı içerikteki tekrarları, kaynak referanslarını ve türetilmiş bağlamı kaldırır. Günlüklerde içerik tutulmaz; yalnızca kimlik ve işlem türü vardır. Arama indeksi kalıcı değildir; kalan kayıtlardan her sorguda yeniden hesaplanır.
- **Sentetik senaryoyu yeniden yükle** seçili deneyin mevcut kayıtlarını, ilerleyişini ve silme işaretlerini temizler; paket içindeki kurgusal senaryo adaylarını başa alır. Mevcut kullanıcı kayıtları da silinir; saklamak için önce JSON dışa aktarılmalıdır. Diğer senaryo/politika depolarını etkilemez.
- **Tüm laboratuvar verisini sil** bütün senaryo/politika deneylerini ve uygulamanın depolama anahtarını kaldırır. Başka uygulama anahtarlarına dokunmaz. Önceden indirilen JSON ve tarayıcı dışındaki kopyalar etkilenmez.
- Bozuk/eski şema güvenli boş durum ve açık kurtarma bildirimi üretir. Depolama engellenirse uygulama geçici çalışır ve JSON indirmeyi önerir. Gizli, şifrelenmiş veya çok kullanıcılı sunucu depolaması değildir.
- Serbest kullanıcı metni otomatik çevrilmez; TR/EN'de aynen korunur. Senaryo metinleri iki dilde hazırlanmıştır; sabit etiketler aynı mantıksal sorguyu korur.

## Sınırlar

Aday çıkarımı ve yanıt birleştirme deterministik senaryo kurallarıdır. Astra veya başka bir model çalıştırılmaz; model eğitimi, embedding, anlamsal arama, gerçek online öğrenme veya gerçek ajan benchmark'ı yoktur. Eşik ve önem değerleri öğretim tasarımıdır. Puan doğruluk olasılığı değildir. Bağlam bütçesi **kayıt sayısıdır**, token sayısı değildir. Kaynak metni asla kod, yönetim talimatı veya işlem yetkisi olarak yürütülmez.

Yerel JSON tarayıcı kullanıcısı tarafından değiştirilebilir; kapsam denetimleri deney motorunun davranışıdır, gerçek bir kimlik doğrulama/güvenlik altyapısı değildir. Çok sekmeli eşzamanlı düzenleme için birleştirme/çatışma protokolü bulunmaz; deneyleri tek sekmede yürütün.

## Azure dağıtımı

Birincil adres: [mem.aserdargun.com](https://mem.aserdargun.com/). Azure uygulama adresi: [MEM](https://yellow-pebble-060d84e03.1.azurestaticapps.net). Dağıtım ve canlı kontroller [GitHub Actions](https://github.com/aserdargun/mem-aserdargun-com/actions/workflows/deploy-swa-mem-aserdargun-com.yml) üzerinden izlenir.

`npm run build` sonucu **dist/** statik pakettir; `release.json` commit kimliğini ve dosya SHA-256 değerlerini içerir. `main` push ve `workflow_dispatch`, `.github/workflows/deploy-swa-mem-aserdargun-com.yml` üzerinden kilitli bağımlılıklar, alan testleri, derleme/paket kontrolü ve tarayıcı testlerini çalıştırır. Başarılı paketi Free Azure Static Web Apps uygulamasına gönderir; ardından canlı commit/dosya eşleşmesini ve aynı tarayıcı testlerini üretim URL’sinde doğrular. Dağıtımlar sırayla çalışır.

Hedef: `aserdargun subscription 4` / `rg-mem-aserdargun-com` / `swa-mem-aserdargun-com`, West Europe, Free. Secret yalnızca GitHub Actions içinde tutulur. Mevcut Azure kaynağı GitHub/main bağlantısını gösterir; tek yetkili workflow korunur, ikinci dağıtım akışı üretilmez. Canlı kontrol için `MEM_BASE_URL=https://yellow-pebble-060d84e03.1.azurestaticapps.net npm run verify:live` ve aynı değişkenle `npm run test:e2e` kullanılır. Tarayıcı testleri yalnızca kendi izole tarayıcı bağlamında sentetik veri üretir.

Mimari ve tasarım kararları: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Kaynaklar: [docs/SOURCES.md](docs/SOURCES.md). Gerçekte çalıştırılmış kontroller: [docs/VALIDATION.md](docs/VALIDATION.md).

## English

MEM is a standalone, bilingual deterministic memory laboratory. Install with `npm ci`, start with `npm run dev:codex`, and open http://127.0.0.1:8041. Validate using `npm run validate:codex`; stop only this checkout with `npm run stop:codex`.

All six scenarios and three policies work locally without a model, API key, backend, account or vector database. Memory records, source references, revisions, scoped lexical retrieval, context budgets, corrections, conflicts, expiry, deletion, comparison and versioned JSON exports are functional. The public address is [mem.aserdargun.com](https://mem.aserdargun.com/), linked under CTX in the [aserdargun.com learning system](https://aserdargun.com/). The portfolio navigation and six related-app links open separate learning tools without transferring experiments. The release artifact is `dist/`. GitHub Actions deploys the validated package to a Free Azure Static Web App on subscription 4 and verifies release hashes and browser flows. HTTPS on the custom domain and the generated Azure hostname returned the same MEM release on 21 September 2026. These addresses have separate browser storage; there is no automatic migration or synchronization.

Persistent data belongs to this browser and origin. Reset preserves deletion markers; explicit synthetic reload clears the selected experiment’s records, progress and deletion markers, then restarts the packaged fictional scenario candidates. Export your own records first if you need a copy; JSON import is not supported. Deletion clears record/revision content and derived context within the selected experiment. Previously downloaded files remain untouched. Use one browser tab for editing; there is no multi-tab merge protocol. User-entered text is kept verbatim in both languages. In-app **Concepts & method** provides the full English learning content and sources.
