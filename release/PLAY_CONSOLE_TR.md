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
- Keşfet alanında seçerek paylaşım yapma
- Takip etme, beğenme, bildirme ve engelleme araçları
- Hesabı uygulama içinden kalıcı olarak silme seçeneği

Nova AI 13 yaş ve üzerindeki kullanıcılar içindir. Uygulama reklam içermez.

## Data Safety beyanı için doğru cevaplar

Bu cevaplar, uygulamanın mevcut Supabase, Render ve yapay zekâ sağlayıcı mimarisine göre hazırlanmıştır. Play Console formu yayımdan önce yeniden okunmalı ve uygulamaya eklenen her SDK sonrasında güncellenmelidir.

### Toplanan veriler

| Veri türü | Örnek | Amaç | Aktarım |
| --- | --- | --- | --- |
| Kişisel bilgiler | e-posta adresi, görünen ad, kullanıcı adı | Hesap yönetimi ve uygulama işlevi | Supabase kimlik doğrulama/altyapı hizmeti |
| Kullanıcı içeriği | sohbet istemleri, topluluk gönderileri, profil biyografisi | AI yanıtı ve topluluk işlevi | Render sunucusu, AI sağlayıcısı, Supabase |
| Uygulama içi etkinlik | takip, beğeni, engelleme, bildirme | Topluluk işlevi ve güvenlik | Supabase |

### Beyan seçenekleri

- Veri şifreli aktarılır: **Evet**
- Veri satılır: **Hayır**
- Reklam için kullanılır: **Hayır**
- Kullanıcı hesabı oluşturulabilir: **Evet**
- Kullanıcı hesap ve ilişkili verileri silebilir: **Evet**
- Silme yöntemi: **uygulama içi Ayarlar → Hesap silme** ve herkese açık hesap silme sayfası
- Konum, kişiler, fotoğraflar, mikrofon, kamera, SMS/call log, ödeme bilgisi: **Toplanmaz**
- Reklam SDK'sı veya analiz SDK'sı: **Yok**

## App content beyanları

- Reklamlar: **Hayır**
- Uygulamaya erişim: **Giriş gerekir.** İnceleme için Play Console'a ayrı test hesabı bilgisi eklenmelidir.
- Hedef kitle: **13 yaş ve üzeri; çocuklara yönelik değildir.**
- Yüksek riskli izinler: **Yok.** Uygulama yalnızca `INTERNET` iznini ister.
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
OPENAI_MODEL=gpt-5
SUPABASE_URL=https://ghlunukpohjhbaniuibg.supabase.co
SUPABASE_SECRET_KEY=Supabase_secret_key
```

`SUPABASE_SECRET_KEY` yalnızca hesap silme işlemi için sunucuda kullanılır; Android uygulamasına, Vite değişkenlerine veya GitHub'a eklenmez.
