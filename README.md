# Nova AI Chat

Nova AI, Android için tasarlanmış, cihazda saklanan sohbet geçmişine ve güvenli backend geçidine sahip modern bir AI sohbet uygulamasıdır. Uygulama **Pi.ai veya Gemini markası/varlıklarını kullanmaz**; özgün "Nova" arayüzü ve adaptive Android ikonu içerir.

## Hesap modülleri

- E-posta ve şifre ile kayıt olma / giriş yapma
- Ayarlardan güvenli çıkış yapma
- Kayıtta bir kez gösterilen kurtarma kodu ile şifre yenileme
- Şifreler Node.js `scrypt` ile karmalanır; istemciye veya API yanıtlarına geri gönderilmez.
- Oturum belirteçleri süreli, rastgele ve sunucuda yalnızca karma biçiminde saklanır.

Yerel geliştirmede hesap verileri `server/data/auth-users.json` dosyasına yazılır ve Git'e eklenmez. Canlı ortamda `AUTH_DATA_PATH` değerini kalıcı bir diske yönlendirin. Birden fazla backend kopyası kullanacaksanız dosya tabanlı depolama yerine PostgreSQL gibi merkezi bir veritabanı kullanın.

## Ortam değişkenleri

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.2
AUTH_DATA_PATH=./data/auth-users.json
AUTH_SESSION_DAYS=30
```

`OPENAI_API_KEY` yalnızca backend `.env` dosyasında bulunur. `VITE_` ile başlayan değişkenlere gizli bilgi yazmayın.


