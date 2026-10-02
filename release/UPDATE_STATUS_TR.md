# Nova AI güncelleme durumu — 2 Ekim 2026

Mevcut com.novaai.chat Android uygulamasının kodu güncellendi. Nova Ekonomist, Ayarlar → Nova’nın tonu içindedir; ayrı sekme yoktur. Telefon için çekmece, geniş ekran için yan menü; açık/koyu tema, 44 piksel dokunma alanları, klavye resize ve Android sistem çubukları için kenar payları eklendi.

Supabase nova-ai projesinde 20261002_account_memory_economist.sql uygulandı. user_memories ve user_memory_settings tabloları hesap genelinde çalışır. Canlı katalog kontrolünde RLS etkin, anonim SELECT yetkisi kapalı ve politikalar auth.uid() = owner_id olarak doğrulandı. Bellek kapatma, düzenleme ve silme aynı hesaptaki tüm cihazlar için geçerlidir. Bellek her sohbet öncesi, panel açılışında ve uygulamaya dönüldüğünde yenilenir.

Ekonomist, mevcut AI modelinin uzmanlık talimatlarıyla çalışır; yeni bir model eğitilmedi. Türkiye vergileri, BIST ve İİBF konularında resmi kaynaklara öncelik verir. Responses web_search aracı, arama açma/kapama ve kaynak bağlantıları uygulandı.

İstemci ve sunucu derlendi; altı test geçti. Testler iki cihaz/hesap belleği, kapatma/silme, bağlantı hatasında eski bellek kullanmama, web araç yapılandırması, kaynaklar, SSE ve yönetici talimat güvenliğini kapsar. Gerçek kullanıcı hesabıyla cihazlar arası canlı test yapılmadı. Tarayıcıda 540 ve 1280 piksel genişliklerde görsel kontrol yapıldı; fiziksel cihaz/emülatör testi bekliyor.

Canlı backend https://nova-ai-3lfh.onrender.com sağlıklı ve OpenAI yapılandırılmış. Yeni alanlara 400 VALIDATION_ERROR döndüren eski sunucu için istemci uyumluluğu eklendi. Health chatProtocol=2 olduğunda yeni protokol kullanılır; eski sunucuya desteklediği alanlar gönderilir. Ekonomist ve etkin hesap belleği mesaj bağlamına eklenir. Web araması eski sunucuda çalışmaz ve kullanıcıya bildirilir. Yeni sunucu kodu henüz canlıda değil. Üretim ve geliştirme bağlantıları canlı backend ve mevcut Supabase projesine bağlandı. Başlatma betiği emülatöre üretim bağlantısını kurar; açıkça seçilen android-local modu yerel backend için 10.0.2.2 kullanır. Gizli anahtar istemciye eklenmedi.

Yayın için kalanlar: güncellenen backend’i dağıtmak, gerçek hesapla canlı AI/web/bellek testi, mevcut Play upload imzası ve son versionCode kontrolü. İmza dosyası yerel projede bulunamadı. Test APK’sı Play Store güncellemesi olarak yayınlanmadı.

Nova_API_36 AVD ve Android SDK hazır. SVM artık açık, WHPX kullanılabilir ve emülatör çalışıyor. Test APK’sı emülatöre yüklendi.

Ana sayfadaki öneri kartları mesaj kutusundaki + menüsüne taşındı. Öneriler profil ilgi alanları, Nova tonu ve açık hesaba ait etkin bellekten üretilir. Bellek kapalıyken öneriler için kullanılmaz. Karşılama görünen adla kişiselleşir. Öneri seçimi mesajı taslak olarak ekler; otomatik göndermez. Yedi test geçti.

Android 35+ için sistem çubuklarıyla birlikte IME/klavye kenar payı işlenir; mesaj kutusu görünen WebView yüksekliğinde kalır. Eski Android sürümleri adjustResize kullanır. Klavye görünürken mesaj alanının ekran içinde ve WebView altının klavyenin üstünde kaldığı emülatör testi geçti.

Yerel kullanım hatırlatmaları haftada iki defa tekrar eder: salı 18.00 ve cumartesi 12.00 (cihaz yerel saati). Kullanıcı bildirim iznini verip hatırlatmaları açabilir; kapatma bekleyen bildirimleri iptal eder. Ayarlarda test bildirimi düğmesi vardır; dokunulan bildirim yeni sohbet açar. Gerçek Android bildirim teslim testi geçti. Bunlar cihazdaki kullanım hatırlatmalarıdır; merkezi uzaktan push kampanyası kurulmadı.

İlk connectedDebugAndroidTest çalıştırmasının Gradle temizlik adımı emülatör uygulamasını kaldırdı; emülatör oturumu yeniden giriş gerektirir. Son APK, kaldırma yapmayan adb install -r ve doğrudan am instrument yöntemiyle tekrar kurulur.

AI bağlantı düzeltmesi: 9 test ve istemci/sunucu derlemeleri geçti. Gerçek HttpAiProvider ile canlı sunucudan Ekonomist tonunda SSE yanıtı alındı; tüm delta parçalarının nihai yanıtla eşleştiği doğrulandı. Android WebView içinden canlı AI yanıtı testi de geçti. Tasarım önizlemesi (?preview=1) AI göndermeyi kapalı tutar; gerçek sohbet hesapla giriş yapılan uygulamada çalışır. Düzeltilmiş APK emülatöre veriler silinmeden yüklendi ve uygulama açıldı.

Nova tonları yenilendi: Günlük yaşam (Günlük sohbet, Sakin rehber), Öğrenme ve üretim (Öğrenme ve anlatım, Yaratıcı fikirler, Teknoloji ve çözüm), İş ve ekonomi (İş ve üretkenlik, Nova Ekonomist). Eski veritabanı kimlikleri korundu; profil, ayarlar ve üst çubuk aynı yeni etiketleri kullanır. Canlı eski backend için yeni davranış talimatları mesaj bağlamında gönderilir; güncellenen backend talimatları da yeniden yazıldı. Ayarlar ton seçimi açıklamalı radyo kartlarına dönüştürüldü; tema renkleri ve kontrastlar düzenlendi. Üretim ayarlarından test bildirimi düğmesi kaldırıldı, gerçek hatırlatmalar korunur. 9 test ve istemci/sunucu derlemeleri geçti; açık/koyu tarayıcı görünümü ve seçilen tonun üst çubuğa yansıması doğrulandı. Son APK emülatöre yüklendi.
