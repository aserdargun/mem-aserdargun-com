# Yerel doğrulama / Local validation

## 21 Eylül 2026 — İçerik ve portföy uyumu

- `npm run test`: **33/33** alan testi geçti.
- `npm run build`: TypeScript, Vite ve 12 dosyalı statik paket/manifest doğrulaması geçti.
- `npm run test:e2e`: üretim paketi üzerinde **27/27** Chromium testi geçti; altı senaryo, TR/EN, üç politika, kalıcılık, düzeltme/silme ve kurtarma akışları korundu.
- Ek Chromium kontrolü: `http://127.0.0.1:8041` üzerinde 320/390/768/1440 px ve iki dilde portföy/CTX adresleri, altı ilgili uygulama bağlantısı, yeni yöntem bölümü, dil/sayfa değişiminde kayıt korunması ve yeniden yükleme açıklaması doğrulandı. Sayfa kimliği doğru; boş ekran, Vite hata katmanı, yatay taşma, console.error, console.warning veya pageerror görülmedi. Browser plugin/skill listelenmediği için mevcut Playwright kullanıldı.
- Masaüstü laboratuvarı, TR portföy bölümü ve EN mobil portföy bölümü ekran görüntüleri incelendi; kesilme/örtüşme görülmedi. Görseller depo dışında `/tmp/mem-content-*.png` dosyalarındadır.
- Canlı adresler: MEM özel alan adı, Azure adresi, ana portföy ve altı ilgili uygulama HTTPS 200 döndürdü. MEM'in iki adresinde mevcut sürüm kimliği `3336e63b05a5231032c7d7269eb79a3306186bda` eşleşti. Kaynak defterindeki üç teknik yayın tekrar açıldı.
- Bu kontroller yerel içerik değişikliklerini ve mevcut canlı adresleri kapsar. Yeni değişiklikler yayımlanmadı; Azure/DNS yapılandırması değiştirilmedi. Safari, Firefox ve fiziksel telefon bu turda sınanmadı. Aşağıdaki 20 Eylül kaydı tarihsel kanıttır; kurulum/audit/sunucu durdurma kontrolleri bu turda tekrarlanmadı.

## 20 Eylül 2026 — İlk doğrulama kaydı

Tarih: **2026-09-20**. Ortam: macOS, Node.js 22.23.1, npm 10.9.8. Uygulama: `http://127.0.0.1:8041`; üretim paketi tarayıcı testleri: `http://127.0.0.1:8042`.

## Sonuç

| Kontrol | Gerçekte yapılan işlem | Sonuç |
| --- | --- | --- |
| Tekrarlanabilir kurulum | Son package-lock ile `npm ci` | Geçti |
| Alan motoru | `npm run test` / Vitest 5.0.1 | **33/33 geçti** |
| Tip ve statik paket | `npm run build` / TypeScript + Vite | Geçti; `dist/` üretildi |
| Gerçek tarayıcı | `npm run test:e2e` / Playwright Chromium, `dist/` üzerinden | **27/27 geçti** |
| Uygulama içi tarayıcı | Codex IAB: tercih → yeni oturum → geri çağırma; proje düzeltmesi → eski belge → sorgu → kaynak/sürüm ayrıntıları | Geçti |
| Sayfa kimliği ve içerik | Doğru MEM başlığı, boş olmayan arayüz, Vite hata katmanı kontrolü | Geçti |
| Konsol sağlığı | Her Chromium testi için console.error ve pageerror; IAB error/warn günlüğü | Hata görülmedi |
| Görsel kanıt | Dört genişlikte tam sayfa ekran görüntüsü; masaüstü ve mobil görüntüler incelendi | Taşma/örtüşme görülmedi |
| Responsive | 320, 390, 768, 1440 px; laboratuvar, karşılaştırma ve yöntem | Yatay sayfa taşması yok |
| Diyagram | İki ayrı çerçeve ve arada kalan okların sınır kutuları | Çerçeve/ok çakışması yok |
| Klavye | İçeriğe atlama, Enter, görünür odak ve sekmelerde ok tuşları | Geçti |
| Reduced motion | Medya tercihi açıkken animasyon/geçiş kontrolü | Geçti |
| Ağ bağımsızlığı | Yenilemede istek URL'leri kontrol edildi | Çalışma anında harici istek yok; fontlar yerel |
| Bağımlılıklar | `npm audit` ve `npm audit --omit=dev` | Bildirilen açık: 0 |
| Sunucu yaşam döngüsü | Durdur → başlat → tekrar başlat | Geçti; önizleme açık bırakıldı |
| Yabancı süreç koruması | 8031'de mevcut başka proje nedeniyle start reddi; 8041'de `/tmp` cwd'li kontrollü yabancı listener ile stop reddi ve listener'ın hayatta kalması | Geçti; başka proje kapatılmadı |
| HTTP | Yerel önizleme yanıtı | 200 |

## Doğrulanan kullanıcı akışları

- Kaydet → yeni oturum → geri çağır → düzelt → tekrar sorgula → sil → artık kullanılmadığını kontrol et → indir → reset → yenile.
- Altı senaryo Türkçe ve İngilizce. Her senaryoda üç politika karşılaştırmasının beklenen sonuç matrisi.
- Adımlama, oynatma, duraklatma, yeni görev, yeni oturum, deney sıfırlama.
- Kalıcılık ve dil değişiminden sonra veri korunması; dil değiştirme deneyi sıfırlamıyor.
- Proje kapsamı değiştirme; yanlış proje kaydının elenmesi; kaynak talimatının reddi.
- Kontrollü saati +1 gün ilerletme; sona eren atamanın ve kullanıcı kaydının kullanılmaması.
- Çözülmeyen çelişkinin görünür olması; açık düzeltmeyle sürüm ilişkisi.
- Düşük seçici eşik ile erişim kodunun kalması; yüksek eşik ile elenmesi; beş tekrar kaynağının ayrıntıda korunması.
- Kullanıcı adayı oluşturma, gerçek sözcük arama, JSON indirme ve tüm yerel veriyi temizleme.
- Bozuk JSON, eski/geçersiz şema, eksik kaynak, geçersiz kimlik, silinmiş durum ve zaman aralığı için kurtarma.
- Depolama kullanılamadığında görünür uyarı ve geçici çalışma.
- Silme sonrasında sürümler, geçmiş içerik, bağlam, export, reset ve henüz işlenmemiş sentetik tekrarlar üzerinden içeriğin geri gelmemesi. Sonuncusu ayrıca alan regresyon testiyle doğrulandı.
- Sentetik senaryoyu açık yeniden yükleme işlemi. Kullanıcı kayıtlarını geri getirmez.

## Giderilen bulgular

- Başlangıç portu başka uygulamaya aitti; MEM 8041'e taşındı.
- Form etiketlerindeki bölüm numaraları/seçenek metinleri test ve erişilebilir ad eşleşmesini etkiliyordu; açık combobox adları eklendi.
- Politika değişince eski bağlam sekmesi boş görünerek belleğin kaybolduğu izlenimini veriyordu; yeni deponun bellek görünümü açılıyor.
- Reset sonrası silinmiş kullanıcı aday kimliğinin tekrar kullanılabilmesi önlendi.
- Gelecek sentetik tekrarların silinen içeriği yeniden yazması önlendi.
- Yalnızca oturum politikasındaki diyagram kalıcı yazma olmadığını açıkça gösteriyor.
- İlk test bağımlılığının bilinen uyarısı giderildi; son audit temiz.

## Sınırlar

Bu sonuçlar yerel Chromium ve Codex uygulama içi tarayıcıya aittir. Safari, Firefox, fiziksel telefon, ekran okuyucu ile tam denetim, bütün WCAG ölçütleri, çok sekmeli eşzamanlı düzenleme, üretim barındırma, alan adı, TLS ve DNS doğrulanmadı. Karşılaştırma gerçek ajan/model benchmark'ı değildir.

Vite derlemesi Zod bağımlılığındaki iki `@__PURE__` yorum konumu için zararsız uyarı verdi; derleme ve tarayıcı testleri başarıyla tamamlandı. Playwright çalıştırıcısı ortamın NO_COLOR/FORCE_COLOR tercihi hakkında uyarı verdi; uygulama konsolu hatası değildir.
