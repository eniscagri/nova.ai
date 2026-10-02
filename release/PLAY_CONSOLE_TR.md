# Nova AI — Play Console yayın bilgileri

Bu belge, Play Console'a girilecek bilgileri Nova AI'nın mevcut işlevlerine göre hazırlar. Yayına göndermeden önce gizlilik politikası bağlantısının ve hesap silme bağlantısının canlı olduğunu doğrula.

## Mağaza girişi

- Uygulama adı: **Nova AI**
- Geliştirici adı: **EnCa Studios**
- Destek e-postası: **eniscagrigilik1@gmail.com**
- Kategori: **Verimlilik**
- Hedef yaş: **13 yaş ve üzeri**
- Reklam: **Hayır, uygulama reklam içermez.**
- Gizlilik politikası: `https://nova-ai-3lfh.onrender.com/privacy-policy`
- Hesap silme: `https://nova-ai-3lfh.onrender.com/account-deletion`

## Kısa açıklama

Nova AI ile yaz, öğren, üret ve fikirlerini toplulukla paylaş.

## Tam açıklama

Nova AI; düşünmek, yazmak, öğrenmek ve plan yapmak için tasarlanmış modern bir yapay zekâ sohbet uygulamasıdır.

Sohbetlerini düzenle, uzun yanıtları Markdown ve kod bloklarıyla kolayca oku, fikirlerini adım adım geliştir. İstersen profilini oluşturup ilgi alanlarını seçebilir; yalnızca senin seçtiğin notları Nova topluluğunda herkese açık veya takipçilerine özel olarak paylaşabilirsin.

Öne çıkanlar:

- Akıcı yapay zekâ sohbeti ve yanıtı durdurma
- Markdown ve kod bloğu desteği
- Cihazda saklanan sohbet geçmişi
- Koyu, açık ve sistem teması
- Kullanıcı profili, ilgi alanları ve sohbet tonu
- Nova tonu içinde Türkiye ekonomisi, vergi ve İİBF için Nova Ekonomist
- Hesaba bağlı, cihazlar arasında kullanılan ve düzenlenip silinebilen kişisel bellek
- Keşfet alanında seçerek paylaşım yapma
- Takip etme, beğenme, bildirme ve engelleme araçları
- Hesabı uygulama içinden kalıcı olarak silme seçeneği

Nova AI 13 yaş ve üzerindeki kullanıcılar içindir. Uygulama reklam içermez.

## Data Safety beyanı için doğru cevaplar

Bu cevaplar, uygulamanın mevcut Supabase, Render ve yapay zekâ sağlayıcı mimarisine göre hazırlanmıştır. Play Console formu yayımdan önce yeniden okunmalı ve uygulamaya eklenen her SDK sonrasında güncellenmelidir.

### Toplanan veriler

| Veri türü | Örnek | Amaç | Aktarım |
| --- | --- | --- | --- |
| Kişisel bilgiler | e-posta adresi, görünen ad, kullanıcı adı; isteğe bağlı bellek bilgileri | Hesap yönetimi, kişiselleştirme ve uygulama işlevi | Supabase kimlik doğrulama/altyapı hizmeti; etkin bellek AI yanıtı için Render ve AI sağlayıcısına aktarılır |
| Kullanıcı içeriği | sohbet istemleri, topluluk gönderileri, profil biyografisi | AI yanıtı ve topluluk işlevi | Render sunucusu, AI sağlayıcısı, Supabase |
| Uygulama içi etkinlik | takip, beğeni, engelleme, bildirme | Topluluk işlevi ve güvenlik | Supabase |

### Beyan seçenekleri

- Veri şifreli aktarılır: **Evet**
- Veri satılır: **Hayır**
- Reklam için kullanılır: **Hayır**
- Kullanıcı hesabı oluşturulabilir: **Evet**
- Kullanıcı hesap ve ilişkili verileri silebilir: **Evet**
- Silme yöntemi: **uygulama içi Ayarlar → Hesap silme** ve herkese açık hesap silme sayfası
- Cihazın konumuna, kişilerine, fotoğraflarına, mikrofonuna, kamerasına, SMS/call log veya ödeme bilgilerine erişilmez. Kullanıcının belleğe yazdığı şehir gibi bilgiler kişiselleştirme verisidir; güncellemenin Data Safety formu buna göre yeniden incelenmelidir.
- Reklam SDK'sı veya analiz SDK'sı: **Yok**

## App content beyanları

- Reklamlar: **Hayır**
- Uygulamaya erişim: **Giriş gerekir.** İnceleme için Play Console'a ayrı test hesabı bilgisi eklenmelidir.
- Hedef kitle: **13 yaş ve üzeri; çocuklara yönelik değildir.**
- Bildirimler: isteğe bağlı kullanım hatırlatmaları için `POST_NOTIFICATIONS`; yeniden başlatma sonrası hatırlatmalar için `RECEIVE_BOOT_COMPLETED` ve bildirim teslimi için `WAKE_LOCK` kullanılır. AI bağlantısı için `INTERNET` gerekir.
- İçerik derecelendirmesi: IARC anketini, kullanıcı üretimli içerik ve AI sohbet olduğu bilgisiyle doğru şekilde tamamla.

## Yüklenmesi gereken mağaza varlıkları

- İmzalı AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- 512 × 512 PNG uygulama simgesi
- En az 2 telefon ekran görüntüsü (PNG/JPEG)
- 1024 × 500 özellik grafiği
- Gizlilik politikası bağlantısı ve destek e-postası

## Yayından önce zorunlu ortam değişkenleri

Render backend ortam değişkenleri:

```text
AI_PROVIDER=openai
OPENAI_API_KEY=geçerli_yeni_anahtar
OPENAI_MODEL=gpt-5.2
SUPABASE_URL=https://ghlunukpohjhbaniuibg.supabase.co
SUPABASE_SECRET_KEY=Supabase_secret_key
```

`SUPABASE_SECRET_KEY` yalnızca hesap silme işlemi için sunucuda kullanılır; Android uygulamasına, Vite değişkenlerine veya GitHub'a eklenmez.

## 2 Ekim 2026 güncellemesi

Supabase hesap belleği migration uygulandı. Eski canlı backend için uyumluluk eklendi; normal AI sohbeti ve Ekonomist yanıtı doğrulandı. Web araştırması için yeni backend dağıtılmalıdır; bu dağıtım yapılana kadar mağaza metninde web araştırması vaat edilmez. Yayından önce gerçek hesapla bellek, giriş ve hesap silme akışlarını kontrol et; mevcut upload anahtarıyla AAB imzala ve versionCode değerini Play Console’daki en yüksek sürümden büyük seç.

Yerel güncelleme: `com.novaai.chat`, sürüm `1.1.0`, versionCode `6`, minSdk `24`, targetSdk `36`. Kullanıcı eski yayının 4 (1.0.3) olduğunu bildirdi. 5 numaralı paket minSdk 23 nedeniyle otomatik koruma koşulunu sağlamadı. Kullanıcının açık onayıyla Android 6.0 desteği kaldırılıp minSdk 24 yapıldı. `D:/eniscagri/aab/key.jks` içindeki `novaai` alias’ı v5 paketini başarıyla imzaladı; yeni v6 paketi de yerel parola istemiyle yeniden imzalanmalıdır.

Android Studio: Build → Generate Signed App Bundle / APK → Android App Bundle → mevcut key.jks dosyasını seç → alias novaai → mevcut parolaları Studio içinde gir → release. Yeni bir anahtar oluşturma. Sonuç `android/app/build/outputs/bundle/release/app-release.aab` olur. İmzasız derleme doğrudan Play Console’a yüklenemez.

Play Console: mevcut Nova AI uygulaması → Test ve yayın → Üretim → Yeni sürüm oluştur → imzalı AAB yükle → RELEASE_NOTES_TR.txt içeriğini tr-TR sürüm notlarına ekle → inceleme öncesi uyarıları çöz. Paket/sertifika/versionCode kontrolü tamamlanmadan yayın başlatılmaz.
