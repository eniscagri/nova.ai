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

1. Supabase SQL Editor’da [20260915_social.sql](supabase/migrations/20260915_social.sql) dosyasının tamamını bir kez çalıştır.
2. Project Settings → API’den Project URL ve **publishable key** değerlerini `client/.env` içine yaz.
3. Authentication → URL Configuration → Redirect URLs listesine şunu ekle:

   ```text
   com.novaai.chat://auth
   ```

Bu adres e-posta doğrulama ve şifre yenileme bağlantılarının Android uygulamasına güvenli dönüşünü sağlar.

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
