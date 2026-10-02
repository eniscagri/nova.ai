# Nova AI

Nova AI; Android için tasarlanmış, güvenli backend üzerinden AI yanıtı alan ve Supabase destekli topluluk özellikleri sunan sohbet uygulamasıdır. Uygulama özgün Nova AI kimliğini kullanır; başka bir yapay zekâ ürününün markasını ya da logosunu kullanmaz.

Canlı uygulama uzak backend kullanıyorsa komutu o sunucuda çalıştır veya `AI_INSTRUCTIONS_FILE` ile kalıcı diskteki özel dosyanın yolunu belirt. Yerel dosyayı değiştirmek uzak sunucuyu değiştirmez. Açıkça yapılandırılan dosya okunamıyorsa istek hata verir; sessizce başka role geçmez. Varsayılan dosya yoksa genel asistan davranışı kullanılır.

Bu talimat model sağlayıcısına gönderilir. API anahtarları, şifreler veya kesinlikle açıklanmaması gereken sırlar talimata yazılmaz: modelin talimatları ifşa etmemesi yönündeki yönlendirme mutlak gizlilik garantisi değildir. Dosya erişimi ise uygulama kullanıcılarına açılmaz.
