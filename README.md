# Nova AI Chat

Nova AI, Android için tasarlanmış, cihazda saklanan sohbet geçmişine ve güvenli backend geçidine sahip modern bir AI sohbet uygulamasıdır. Uygulama **Pi.ai veya Gemini markası/varlıklarını kullanmaz**; özgün "Nova" arayüzü ve adaptive Android ikonu içerir.


Bu proje hazırlanırken `pi.ai`nin açık web sitesi ve resmi yardım merkezi kontrol edildi. Doğrulanabilen kaynaklar son kullanıcı Pi hizmetini, sohbet geçmişini ve gizliliği açıklar; kamuya açık chatbot API endpoint'i, API anahtarı oluşturma yöntemi, auth header'ı, model adı, request/response şeması, streaming sözleşmesi veya rate limit yayımlamamaktadır.

- Resmî Pi destek merkezi: https://help.pi.ai/en/
- Resmî Pi gizlilik politikası: https://pi.ai/privacy

Bu nedenle proje **PiAPI (`piapi.ai`) ile karıştırılmaz** ve Pi.ai için varsayımsal endpoint/anahtar/model kullanmaz. `PiProvider` sınıfları kasıtlı olarak ağ isteği yapmaz. Üretim AI sağlayıcısı OpenAI Responses API'dir; `MockProvider` yalnızca anahtar olmadan arayüz testi için seçilebilir.

Bu ayrım önemlidir: mock yanıtlar gerçek Pi.ai yanıtı olarak sunulmaz ve Pi.ai anahtarı/frontende gönderilmez.

## Proje yapısı

```text
ai-chat-app/
├── client/                  # React + Vite + TypeScript + Tailwind
│   └── src/
│       ├── components/      # sohbet, markdown, sidebar, ayarlar
│       ├── services/ai/     # istemci provider arayüzleri
│       ├── services/        # storage abstraction
│       ├── types/ ve utils/
│       └── App.tsx
├── server/                  # Node.js + Express + TypeScript
│   └── src/providers/       # AiProvider, OpenAIProvider, PiProvider, MockProvider
├── android/                 # Capacitor Android / Gradle projesi
├── capacitor.config.json
├── .env.example
└── package.json
```

## Özellikler

- Yeni sohbet, otomatik başlık, yeniden adlandırma, silme ve cihaz-içi sohbet araması
- `localStorage` tabanlı `ChatStorage` soyutlaması; ileride Supabase/PostgreSQL adapteri eklenebilir
- Sistem/açık/koyu tema, reduced-motion desteği, odak halkaları ve erişilebilir etiketler
- Güvenli Markdown: GFM, başlıklar, listeler, linkler, blockquote, inline/fenced code; HTML render edilmez
- Kod bloklarında syntax highlight, kopyalama ve mobil yatay kaydırma
- Mobil drawer sidebar, safe-area boşlukları, `100dvh`, uygun textarea/Enter/Shift+Enter davranışı
- Backend validation, JSON boyut limiti, timeout, IP rate limit ve kullanıcı dostu hata yanıtları
- Adaptive icon, splash teması, yalnızca `INTERNET` izni, cleartext kapalı Android manifesti

## Ortam değişkenleri

Kök `.env.example` genel bir referanstır. Geliştirme için dosyaları kopyalayın:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

`server/.env`:

```dotenv
PORT=3001
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.2
CORS_ORIGIN=http://localhost:5173,https://localhost
REQUEST_TIMEOUT_MS=30000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=30
MAX_MESSAGE_LENGTH=12000
MAX_CONVERSATION_MESSAGES=60
```

`client/.env`:

```dotenv
# Android emulator geliştirme adresi; gerçek cihazda bilgisayarınızın LAN HTTPS/HTTP adresini kullanın.
VITE_API_URL=http://10.0.2.2:3001
```

Yerel geliştirmede tarayıcı `client/.env.development` üzerinden otomatik olarak `http://localhost:3001` kullanır. Android emülatör build'i için `client/.env` içindeki `http://10.0.2.2:3001` doğrudur. Debug Android manifesti yalnızca emülatör geliştirmesi için HTTP'ye izin verir; release AAB'de cleartext HTTP kapalı kalır.

`VITE_*` değerleri tarayıcı/Android web bundle'ına gömülür. Bu nedenle `VITE_OPENAI_API_KEY` oluşturmayın ve hiçbir secret eklemeyin. `OPENAI_API_KEY` yalnızca `server/.env` veya production secret manager içinde bulunur.

## Local geliştirme

Node.js 20+ kullanın.

```powershell
npm install
npm run build
```

İki ayrı terminalde:

```powershell
npm run dev:server
npm run dev:client
```

Backend health kontrolü: `http://localhost:3001/api/health` → `{ "status": "ok" }`.

Varsayılan backend OpenAI Responses API ile çalışır ve yanıtları SSE üzerinden parça parça iletir. Yeni API anahtarını yalnızca `server/.env` içindeki `OPENAI_API_KEY=` satırına ekleyin. Anahtar olmadan backend başlar fakat kullanıcıya açıkça bağlantının yapılandırılmadığını bildirir; sahte AI yanıtı vermez.

## Android / Capacitor

Ön koşul: Android Studio Meerkat (2024.3.1 Patch 1) veya daha yenisi, Android SDK Platform 36, Android SDK Build-Tools 36.x ve Android Studio'nun JDK'sı kurulu olmalı. Bu proje `compileSdk 36`, `targetSdk 36`, AGP 8.9.1 ve Gradle 8.11.1 kullanır.

```powershell
npm run android:sync
npm run android:open
```

`capacitor.config.json` tek uygulama kimliği kaynağını kullanır:

- Uygulama adı: `Nova AI`
- Package / Application ID: `com.novaai.chat`
- Version: `1.0.2` / `versionCode 3`

Bu değerlerin tek kaynağı kökteki `capacitor.config.json` dosyasıdır. `npm run android:sync` Android manifest/string meta verisini günceller; Gradle da application ID, versionCode ve versionName değerlerini aynı dosyadan okur.

Yayın URL'sini Android paketi oluşturmadan **önce** `client/.env` içinde HTTPS backendinizle değiştirin; sonra yeniden build + sync yapın:

```dotenv
VITE_API_URL=https://api.sirketiniz.example
```

Üretimde HTTP cleartext kullanılmaz (`usesCleartextTraffic="false"`). Android emülatörü için `10.0.2.2` yalnızca geliştirme içindir. Fiziksel cihaz için güvenilir HTTPS sertifikalı bir URL gereklidir.

## Signed AAB üretimi

1. Android Studio’da `android/` klasörünü açın ve Gradle senkronizasyonunun bitmesini bekleyin.
2. **Build → Generate Signed Bundle / APK** seçin.
3. **Android App Bundle** seçin.
4. Yeni bir upload keystore oluşturun veya mevcut upload keystore'u seçin. Keystore/parolayı kaynak depoya koymayın.
5. `release` varyantını seçip imzalama sürecini tamamlayın.
6. AAB `android/app/build/outputs/bundle/release/app-release.aab` altında oluşur. Bundle doğrulamasını Play Console’a yüklemeden önce Android Studio'nun Analyze APK aracında kontrol edin.

Yerel makinede Gradle wrapper oluşturulduktan sonra komut satırı seçeneği:

```powershell
cd android
./gradlew bundleRelease
```

## Play Console yükleme

1. Play Console’da yeni uygulama kaydı oluşturun; package name `com.novaai.chat` ile eşleşmelidir.
2. Privacy policy URL'si ve Data safety formunu gerçek deployment davranışınıza göre doldurun. Bu MVP hesap oluşturmaz ve chat history'yi cihazın web storage'ında tutar; AI isteği için mesajlar backend'e gönderilir.
3. **Testing** kanalında AAB’yi önce internal testing'e yükleyin; Android’in ürettiği app signing akışını tamamlayın.
4. Store listing, içerik derecelendirmesi, hedef kitle ve data safety yanıtlarını tamamlayın.
5. Test raporları ve pre-launch report sorunlarını giderdikten sonra production rollout oluşturun.

Her yeni yayında `versionCode` artırılmalıdır. Google Play'in yayın günündeki target SDK zorunluluğunu Play Console'da kontrol edin; bu proje API 36'ya hedeflenmiştir.

## Production backend deployment

1. Node 20+ çalıştıran HTTPS destekli bir host seçin.
2. `server/` bağımlılıklarını kurup `npm run build` çalıştırın.
3. Secret'ları hostun secret manager'ında tanımlayın; `.env` dosyasını repoya veya istemciye koymayın.
4. `npm start` ile uygulamayı başlatın; reverse proxy/load balancer üzerinden TLS sonlandırın.
5. `CORS_ORIGIN` değerini yalnızca web dağıtım origin'iniz ve Capacitor'ın `https://localhost` origin'iyle sınırlandırın. Varsayılan allow-list bu ikisini içerir.
6. `GET /api/health` endpointini altyapı health check'i olarak kullanın; rate-limit, timeout ve error telemetry'sinde message content veya secret loglamayın.
7. Client'taki `VITE_API_URL` değerini HTTPS URL'nize ayarlayın, `npm run android:sync` ve yeni signed AAB oluşturun.

## Doğrulama kontrol listesi

`npm install`, frontend/backend TypeScript build, Capacitor Android sync ve SDK 36 release AAB bu proje için doğrulandı.

- [x] Frontend ve backend TypeScript build yapılandırması
- [x] API key'in bundle'a girmesini önleyen mimari
- [x] `.env` gitignore'da
- [x] Chat history, search, rename/delete, theme, Markdown ve kopyalama
- [x] Validation, timeout, rate limit, health check ve hata arayüzü
- [x] Adaptive icon, splash, release Gradle yapılandırması
- [ ] Resmî Pi.ai API entegrasyonu — doğrulanmış public API bulunmadığı için uygulanmadı
- [x] SDK 36 release AAB üretildi
