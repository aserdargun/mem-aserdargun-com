# Mimari ve kapsam / Architecture and scope

## Modüller

- `src/domain/model.ts`: Zod şemaları ve TypeScript alan tipleri: MemoryCandidate, MemoryRecord, SourceReference, MemoryScope, MemoryPolicy, MemoryRevision, RetrievalQuery, RetrievalResult, ContextAssembly, MemoryEvent, ExperimentRun.
- `policies.ts`: Yazma kararı. Talimat adayı reddi bütün politikalarda ortak. C politikasında eşik ve kalıcılık değerlendirmesi.
- `engine.ts`: Saf kopya üzerinde yazma, tekrar birleştirme, adımlama, oturum, saat, düzeltme, silme ve reset.
- `validity.ts`: Kapsam eşitliği, geçerlilik ve çelişki durumlarının hesaplanması.
- `retrieval.ts`: İki dilde normalize sözcükler, sabit etiketler, zorunlu filtreler, sıralama ve bütçeli bağlam.
- `persistence.ts`: Sürüm 1 yerel şema, yapısal/ilişkisel yükleme doğrulaması, kurtarma ve JSON dışa aktarımı.
- `comparison.ts`: Aynı başlangıç ve olay dizisini ayrı saf depolarda çalıştırma. Canlı kullanıcı kayıtlarına erişmez.
- `src/data`: Altı sürümlü senaryo, öğrenme bölümleri ve doğrulanmış birincil kaynak metaverisi.
- `src/i18n.ts`: Durum, gerekçe, politika, tür ve UTC zaman yerelleştirmesi. `LocalText` senaryo ve öğretim metnini iki dilde taşır.
- `src/components`: Kontroller, yaşam döngüsü/kayıtlar, ayrıntılar, zaman çizelgesi, karşılaştırma, öğrenme ve kullanıcı adayı formu.
- `src/App.tsx`: Deney deposu, arayüz durumu ve kullanıcı eylemlerinin orkestrasyonu.

## Determinizm ve deney saati

Başlangıç `2026-09-01T09:00:00Z`. Motor `Date.now`, rastgele sayı veya ağ erişimi kullanmaz. Kullanıcı saati tam günlerle ilerletir. Oynatma zamanlayıcısı yalnızca `step` çağrılarını sıraya koyar; alan zamanı ve test sonucu gerçek duvar saatine bağlı değildir. Kaydedilme ve olay zamanları ayrı alanlardır. Olay adımları saati kendiliğinden ilerletmez.

## Yazma ve geçerlilik

Kayıtlar işlem yetkisi taşımayan `authority: data` nesneleridir. Açık, güvenilir kullanıcı düzeltmesi aynı kapsam/iddia içindeki daha eski olay zamanlı kayıtların yerine geçer. Sonradan gelen eski belge yeni düzeltmenin geçmişine bağlanır. Çelişkiler kayıt sırası veya kaynak tekrar sayısıyla çözülmez. Süre sonunda kayıt arşiv niteliğinde kalır ve geri çağrılmaz.

C politikasında eşik üstündeki aynı kapsam/iddia/değer/geçerlilikteki etkin tekrarlar birleşir; bütün kaynak referansları ve aday kimlikleri korunur. Kaynak çokluğu bağımsız doğrulama sayılmaz. A ve B de zorunlu kapsam, çelişki ve düzeltme kurallarına uyar; karşılaştırma uğruna güvenlik zayıflatılmaz.

## Geri çağırma ve sonuç

Kapsam → oturum/durum → sözcük/etiket → geçerlilik/çelişki → puan → kayıt bütçesi → kaynaklı bağlam. Puan `words + 3*tags + insertionPosition/recordCount + (selective ? 4*importance : 0)`. Puan olasılık değildir. Zorunlu eleme nedenleri sıralamadan önce uygulanır. Bağlam tam kayıtlarla kurulur; karakter/token tahmini yoktur.

Yerelleştirilmiş hazır sorular aynı sabit etiket sorgusunu çalıştırır. Kullanıcı soruyu değiştirirse iki dildeki kayıt sözcükleriyle gerçek leksik eşleşme yapılır; hazır etiketler gizlice eklenmez. Eksik bilgi açıklama istemeye, ilgili çözülemeyen çelişki açık çelişki sonucuna gider. Yanıt yalnızca seçilen kayıtların alıntılarını ve kaynak kimliklerini içerir; yeni olgu uydurmaz.

## İzolasyon ve unutma

Yerel anahtar `mem-laboratory:v1`; deney anahtarı `scenarioId:policy`. Karşılaştırma aynı senaryo sürümü/sorgu/bütçe/saat adımlarıyla üç ayrı başlangıç deposu üretir. Silme işaretleri üç karşılaştırma deposuna aynı şekilde uygulanır; diğer hiçbir canlı kayıt paylaşılmaz.

Silme sürüm grafiğinin bağlı bileşenini ve aynı içeriğin tekrarlarını kaldırır. Ham içerik olay günlüğünde bulunmaz. Son bağlam ve sorgu temizlenir. Aday kimliği tombstone'u reset sonrasında otomatik geri yüklemeyi önler. Kullanıcı kayıtlarının yedeği veya geçmiş kopyası tutulmaz. Varsayılan sentetik fixture uygulama kodudur; yeniden yüklemek açık bir kullanıcı eylemidir.

## Tasarım sistemi

Koyu nötr zemin `#111512`, yüzey `#171c18`, lime `#c5f277`, cyan `#71d7db`; DM Sans Variable ve JetBrains Mono Variable yerel dosyalardan. İnce sınırlar, 5–7px köşe, durum adı + renk. Masaüstünde sol kontrol/merkez bellek/sağ kaynak; küçük ekranda tek sütun. Yaşam döngüsü iki ayrı çerçeve ve çerçeveler arasındaki yönlü oklarla canlı deney sayılarını gösterir. Güncelleme ilişkileri ayrıntı panelinde `eski → yeni` olarak açıklanır.

Klavye odakları, ana içeriğe atlama, tab ok tuşları, form etiketleri, metinsel diyagram karşılığı ve reduced-motion sağlanır. Küçük ekranda seçilen kayıt ayrıntısına odak taşınır. Görsel konsept referans olarak üretildi; uygulama ve diyagram HTML/CSS/SVG bileşenleridir, raster maket değildir.

## Dağıtım sınırı

Bu sürüm yalnızca yerel tamamlanmış statik ürün hazırlığıdır. Kimlik doğrulama, sunucu verisi, model eğitimi, entegrasyon, anlamsal arama, cihazlar arası senkronizasyon ve gerçek dünyanın doğruluğunu teyit eden hizmet içermez.
