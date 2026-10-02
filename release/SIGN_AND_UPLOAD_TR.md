# Nova AI 1.1.0 güncellemesi

Release AAB derlemesi ve lintRelease başarılı. Mevcut çıktı henüz **imzasızdır**; doğrudan Play Console’a yüklenemez.

- Paket: com.novaai.chat
- Sürüm: 1.1.0
- versionCode: 6 (eski yayın 4 / 1.0.3; 5 numaralı paket minSdk 23 içeriyordu)
- minSdk: 24 / Android 7.0; Google Play otomatik koruması için yükseltildi. Android 6.0 cihazları bu güncellemeyi alamaz.
- targetSdk: 36
- Anahtar adayı: D:/eniscagri/aab/key.jks
- Alias: novaai
- Paket: android/app/build/outputs/bundle/release/app-release.aab

## İmzalama

Alternatif olarak PowerShell’de `./release/Sign-AAB.ps1` çalıştır. Mevcut anahtar parolasını Java’nın yerel istemine gir; başarılı imzalama sonrası `release/Nova-AI-1.1.0-v6.aab` oluşur. Parolayı sohbete yazma. `IMZASIZ` adı içeren paket Console’a yüklenmez. Eski v5 AAB yerine bu yeni v6 dosyasını seç.

1. Android Studio’da mevcut Nova android projesinde Build → Generate Signed App Bundle / APK aç.
2. Android App Bundle seç. Key store path olarak D:/eniscagri/aab/key.jks, Key alias olarak novaai kullan.
3. Mevcut keystore ve key parolalarını yalnızca Android Studio’ya gir. Yeni anahtar oluşturma.
4. Release seçip oluştur. İmzalı çıktı app-release.aab dosyasının yerine yazılır.
5. Play Console → Nova AI → Uygulama bütünlüğü bölümündeki **upload anahtarı sertifikası** ile bu anahtarın sertifikasını karşılaştır. App signing sertifikası farklı olabilir.

## Mevcut uygulamayı güncelleme

1. https://play.google.com/console/ adresini açıp mevcut Nova AI uygulamasını seç; yeni uygulama oluşturma.
2. En yüksek versionCode 6 veya daha büyükse capacitor.config.json dosyasındaki versionCode değerini bu koddan büyük yap, imzalama betiğini güncelle ve paketi yeniden oluştur.
3. Test ve yayın → Üretim → Yeni sürüm oluştur. İmzalı AAB yükle.
4. RELEASE_NOTES_TR.txt içeriğini Türkçe sürüm notlarına ekle.
5. Veri güvenliği beyanını hesaba bağlı kişisel bellek ve AI sağlayıcısına aktarım için güncelle; ayrıntılar PLAY_CONSOLE_TR.md dosyasındadır. İnceleme için ayrı test hesabını Console’a gir.
6. Giriş, AI yanıtı, bellek, bildirim izni ve hesap silme akışlarını imzalı paketle kontrol et. Console’daki uyarıları çöz, ardından incelemeye gönder.

Web araştırması canlı backend’de henüz etkin değildir; yeni backend dağıtılana kadar mağazada bu özellik vaat edilmez. Normal AI sohbeti ve Ekonomist yanıtı canlı sunucuda doğrulandı. Gizlilik ve hesap silme sayfaları HTTP 200 döndürüyor; hesap silmenin kendisi canlıda test edilmedi.

Bu çalışma sırasında Console erişimi otomatik güvenlik incelemesince engellendi. Console’daki sürüm kodu, upload sertifikası, taslak sürüm ve yayın durumu doğrulanmadı. Paket henüz yüklenmedi veya yayımlanmadı.
