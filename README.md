# Nova AI

Nova AI; Android için tasarlanmış, güvenli backend üzerinden AI yanıtı alan ve Supabase destekli topluluk özellikleri sunan sohbet uygulamasıdır. Uygulama özgün Nova AI kimliğini kullanır; başka bir yapay zekâ ürününün markasını ya da logosunu kullanmaz.

## Neler var?

- Supabase e-posta/şifre ile kayıt, giriş, çıkış ve şifre yenileme
- Hesap başına cihazda saklanan sohbet geçmişi
- Markdown, kod bloğu, kopyalama, yanıtı durdurma ve güvenli otomatik kaydırma
- Her açılışta yeni sohbet alanı
- Koyu / açık / sistem teması
- Keşfet: herkese açık veya takipçilere açık not paylaşımı
- Takip etme, beğenme, paylaşım silme, bildirme ve engelleme
- Sohbet içinden yalnızca kullanıcı seçerse Keşfet’e metin gönderme
- Profil, ilgi alanları ve Nova sohbet tonu seçimi
- Android API 36, adaptive icon, HTTPS backend ve Play Store için release AAB akışı

## Gizlilik ve güvenlik

- AI anahtarı yalnızca backend `.env` dosyasındadır. `VITE_` ile başlayan hiçbir değişkene gizli anahtar yazılmaz.
- `VITE_SUPABASE_PUBLISHABLE_KEY` istemci için tasarlanmış açık anahtardır; Supabase Row Level Security veriyi korur.
- Sohbet geçmişi Supabase’e otomatik yüklenmez. Kullanıcı bir mesajda **Keşfet'te paylaş** seçeneğini kullanıp son onayı verirse paylaşılır.
- Supabase şeması ve RLS kuralları: [20260915_social.sql](supabase/migrations/20260915_social.sql)

## Ortam değişkenleri

`client/.env`:

```env
VITE_API_URL=https://api.example.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

`server/.env`:

```env
PORT=3001
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5
CORS_ORIGIN=https://app.example.com
REQUEST_TIMEOUT_MS=30000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=30
MAX_MESSAGE_LENGTH=12000
MAX_CONVERSATION_MESSAGES=60
```

`OPENAI_API_KEY` yalnızca backend ortam değişkenidir; Android paketi veya web paketi içine girmez.

## Supabase kurulumu

1. Supabase SQL Editor’da sırasıyla [20260915_social.sql](supabase/migrations/20260915_social.sql), [20260915_profile_usernames.sql](supabase/migrations/20260915_profile_usernames.sql) ve [20260923_profile_avatars.sql](supabase/migrations/20260923_profile_avatars.sql) dosyalarını bir kez çalıştır.
2. Project Settings → API’den Project URL ve **publishable key** değerlerini `client/.env` içine yaz.
3. Authentication → URL Configuration → Redirect URLs listesine şunu ekle:

   ```text
   com.novaai.chat://auth
   ```

Bu adres e-posta doğrulama ve şifre yenileme bağlantılarının Android uygulamasına güvenli dönüşünü sağlar.

Profil görselleri `profile-avatars` Storage alanında tutulur. Yalnızca kullanıcı kendi klasörüne JPG, PNG, WebP veya GIF yükleyebilir; dosya sınırı 5 MB'dır. Görseller profilin herkese açık parçasıdır.

## Yerelde çalıştırma

```powershell
npm install
npm run dev:server
```

Yeni bir terminalde:

```powershell
npm run dev:client
```

Android emülatöründe yerel backend için:

```powershell
npm run android:sync:local
```

Canlı backend için Android paketi:

```powershell
npm run android:sync
```

## Android Studio ve AAB

Bu proje Java 21 LTS ile çalışacak şekilde ayarlı. Derleme:

```powershell
$env:JAVA_HOME = 'C:\Users\enisc\.jdks\ms-21.0.12.1'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
cd android
.\gradlew.bat :app:bundleRelease
```

İmzalı AAB için önce [keystore.properties.example](android/keystore.properties.example) dosyasını `android/keystore.properties` adıyla kopyala. Kopyadaki `storeFile`, `storePassword`, `keyAlias` ve `keyPassword` alanlarını kendi keystore bilgilerinle doldur. Bu dosya ve `.jks` dosyaları Git tarafından yok sayılır.

Çıktı:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

Keystore tanımlanmadan oluşturulan AAB imzasızdır ve Play Console’a yüklenmez. Keystore tanımlandıktan sonra aynı komut imzalı AAB üretir.

### Play Store yayın öncesi kontrol

- `VITE_API_URL` yayınlanmış HTTPS backend adresi olmalı; yerel adres kullanma.
- Render ortam değişkenlerinde `AI_PROVIDER=openai`, `OPENAI_API_KEY` ve `OPENAI_MODEL=gpt-5` bulunmalı. Anahtarı istemciye, Android paketine veya Supabase'e koyma.
- Supabase Authentication → URL Configuration içinde `com.novaai.chat://auth` kalmalı.
- Google girişinde Google Auth Platform ile Supabase Google Provider etkin olmalı.
- `android/keystore.properties` ve `.jks` dosyanı güvenli, yedekli bir yerde tut. Aynı anahtar tüm sonraki Play Store güncellemeleri için gereklidir.
- Play Console'da uygulamanın veri güvenliği formunda sohbetlerin cihazda tutulduğunu, topluluk paylaşımının yalnızca kullanıcı isteğiyle yapıldığını ve AI isteği için metnin backend'e gönderildiğini doğru şekilde beyan et.

## Kontrol komutları

```powershell
npm run build
npm run android:sync
```

Ardından Android Studio’dan emülatörü seçip `Run` düğmesine basabilir veya debug APK’yı kurabilirsin.

## Yalnızca sahibinin düzenlediği AI talimatları

Proje terminalinde aşağıdaki komutu çalıştır:

```powershell
npm run ai:talimat -- "Bir stilist gibi çalış. Önce kullanıcının bütçesini, tarzını ve hangi etkinlik için giyineceğini öğren. Sonra gerekçeleriyle üç kombin öner. Fiyat veya stok bilgisi uydurma."
```

Genel asistana dönmek için:

```powershell
npm run ai:talimat -- "Kullanıcının ihtiyacına göre yardımcı olan genel amaçlı bir asistan olarak çalış."
```

Talimat `server/data/ai-instructions.txt` dosyasına kaydedilir ve her yeni AI isteğinde sunucu tarafından okunur. Yeniden derleme gerekmez. Dosya Git'e ve Android/web paketine dahil edilmez. Okuma veya düzenleme için herkese açık HTTP uç noktası yoktur; yalnızca sunucu dosyalarına erişimi olan yönetici değiştirebilir. Sohbet üzerinden gönderilen system/developer rolleri ve ek ayar alanları reddedilir. Sohbet tonu yönetici rolünü değiştirmez.

Canlı uygulama uzak backend kullanıyorsa komutu o sunucuda çalıştır veya `AI_INSTRUCTIONS_FILE` ile kalıcı diskteki özel dosyanın yolunu belirt. Yerel dosyayı değiştirmek uzak sunucuyu değiştirmez. Açıkça yapılandırılan dosya okunamıyorsa istek hata verir; sessizce başka role geçmez. Varsayılan dosya yoksa genel asistan davranışı kullanılır.

Bu talimat model sağlayıcısına gönderilir. API anahtarları, şifreler veya kesinlikle açıklanmaması gereken sırlar talimata yazılmaz: modelin talimatları ifşa etmemesi yönündeki yönlendirme mutlak gizlilik garantisi değildir. Dosya erişimi ise uygulama kullanıcılarına açılmaz.
