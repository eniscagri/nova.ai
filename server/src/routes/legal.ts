import { Router } from 'express';

const page = (title: string, body: string) => `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | Nova AI</title><style>body{margin:0;background:#fafafa;color:#201d29;font:16px/1.65 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{max-width:760px;margin:0 auto;padding:52px 22px 72px}header{padding-bottom:24px;border-bottom:1px solid #e5e1ed}.brand{color:#633ad6;font-size:13px;font-weight:800;letter-spacing:1.2px}h1{margin:6px 0;font-size:34px;letter-spacing:-1px}h2{margin:34px 0 8px;font-size:20px}p,li{color:#514d5c}a{color:#5934c7;font-weight:700}small{color:#777180}</style></head><body><main><header><div class="brand">ENCA STUDIOS · NOVA AI</div><h1>${title}</h1><small>Son güncelleme: 15 Eylül 2026</small></header>${body}</main></body></html>`;

export function legalRouter() {
  const router = Router();
  router.get('/', (_req, res) => res.type('html').send(`<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="google-site-verification" content="-G7rN76ieb25pLiCucw1WYM25htm6Ht2i2thTX7KWL0">
<meta name="description" content="Nova AI, EnCa Studios tarafından sunulan yapay zekâ sohbet ve topluluk uygulamasıdır.">
<title>Nova AI — EnCa Studios</title>
<style>body{margin:0;background:#faf9ff;color:#211b35;font:17px/1.7 system-ui,sans-serif}main{max-width:800px;margin:auto;padding:64px 24px}header{border-bottom:1px solid #ddd5ee;padding-bottom:36px}small{color:#655879;letter-spacing:2px}h1{font-size:clamp(48px,10vw,80px);line-height:1.1;margin:20px 0;color:#633ad6}h2{margin-top:36px;font-size:24px}p{max-width:650px;color:#51465f}a{color:#5934c7;text-underline-offset:4px}nav{display:flex;flex-wrap:wrap;gap:20px;margin-top:32px}footer{margin-top:44px;border-top:1px solid #ddd5ee;padding-top:24px;font-size:14px}</style>
</head><body><main><header><small>ENCA STUDIOS</small><h1>Nova AI</h1><p>Fikirlerini geliştir, yazılarına destek al ve yapay zekâyla sohbet et.</p></header>
<section><h2>Sohbet ve topluluk bir arada</h2><p>Nova AI, Android için bir yapay zekâ sohbet ve topluluk uygulamasıdır. Sorularını sorabilir, fikir üretebilir ve toplulukta içerik paylaşabilirsin.</p></section>
<section><h2>Google ile giriş</h2><p>Google ile giriş yaptığında adın, profil resmin ve e-posta adresin hesabını oluşturmak ve giriş yapmanı sağlamak için kullanılır. Kimlik doğrulama hizmeti Supabase üzerinden sağlanır.</p><p>Hangi bilgilerin işlendiğini ve hesap silme seçeneklerini gizlilik politikamızda bulabilirsin.</p></section>
<nav aria-label="Yasal bilgiler"><a href="/privacy-policy">Gizlilik Politikası</a><a href="/terms">Kullanım Koşulları</a><a href="/account-deletion">Hesap Silme</a></nav>
<footer>Nova AI · EnCa Studios<br>Destek: <a href="mailto:eniscagrigilik1@gmail.com">eniscagrigilik1@gmail.com</a></footer></main></body></html>`));
  router.get('/privacy-policy', (_req, res) => res.type('html').send(page('Gizlilik Politikası', `
    <p>Nova AI, EnCa Studios tarafından sunulan bir yapay zekâ sohbet ve topluluk uygulamasıdır. Bu politika, uygulamanın hangi verileri işlediğini ve bu veriler üzerindeki seçeneklerini açıklar.</p>
    <h2>İşlediğimiz veriler</h2><p>Hesap oluştururken e-posta adresi, görünen ad ve kullanıcı adı işlenir. Profil bilgilerin, ilgi alanların, toplulukta paylaşmayı seçtiğin içerikler ve takip ilişkilerin; uygulama işlevlerini sağlamak için saklanır. Nova AI'ya gönderdiğin sohbet mesajları yanıt oluşturulması için güvenli bağlantıyla sunucumuza ve yapay zekâ hizmeti sağlayıcısına aktarılır. Sohbet geçmişin cihazında saklanır; topluluk gönderileri ise seçtiğin görünürlük seçeneğine göre yayınlanır.</p>
    <h2>Verilerin kullanımı ve paylaşımı</h2><p>Veriler yalnızca hesap, güvenlik, sohbet yanıtı, topluluk ve destek işlevlerini sağlamak için kullanılır. Kimlik doğrulama ve topluluk verileri Supabase üzerinde; uygulama sunucusu Render üzerinde; sohbet yanıtı işlemesi ise yapay zekâ hizmeti sağlayıcısı üzerinden yürütülür. Reklam ağı, davranışsal reklamcılık veya satış amacıyla veri paylaşımı yapmayız.</p>
    <h2>Görünürlük ve saklama</h2><p>Herkese açık seçtiğin gönderiler diğer kullanıcılar tarafından görülebilir. Takipçi veya yalnızca ben seçenekli içerikler ilgili görünürlük ayarına göre işlenir. Hesap verilerin hesabın açık kaldığı sürece saklanır. Güvenlik ve yasal zorunluluklar dışında, hesap silme isteğin tamamlandığında ilişkili hesap ve topluluk verilerin silinir.</p>
    <h2>Güvenlik</h2><p>Veri aktarımı HTTPS ile korunur. Uygulamada yalnızca düşük yetkili istemci anahtarları bulunur; yönetici anahtarları kullanıcı cihazına veya uygulama paketine konmaz.</p>
    <h2>13 yaş ve üzeri</h2><p>Nova AI 13 yaşın altındaki kişiler için tasarlanmamıştır. 13 yaşın altında olduğunu tespit ettiğimiz hesapları kaldırabiliriz.</p>
    <h2>Hakların ve hesap silme</h2><p>Hesabını uygulama içindeki Ayarlar bölümünden kalıcı olarak silebilirsin. Silme işlemi geri alınamaz. Bu sayfadaki adımlar: Nova AI'ya giriş yap → Ayarlar → Hesap silme → onay metnini gir. Yardım için <a href="mailto:eniscagrigilik1@gmail.com">eniscagrigilik1@gmail.com</a> adresine ulaşabilirsin.</p>
    <h2>İletişim</h2><p>Gizlilik soruların için: <a href="mailto:eniscagrigilik1@gmail.com">eniscagrigilik1@gmail.com</a></p>`)));
  router.get('/terms', (_req, res) => res.type('html').send(page('Kullanım Koşulları', `
    <p>Nova AI'yı kullanarak bu koşulları kabul etmiş olursun. Nova AI, EnCa Studios tarafından sunulur ve 13 yaş ile üzerindeki kullanıcılar içindir.</p>
    <h2>Hizmetin kullanımı</h2><p>Nova AI, bilgi, fikir geliştirme, yazma ve sohbet desteği sunar. Yanıtlar bilgilendirme amaçlıdır; tıbbi, hukuki, finansal veya başka bir profesyonel tavsiye yerine geçmez. Kritik kararları bağımsız kaynaklarla doğrulamalısın.</p>
    <h2>Topluluk</h2><p>Paylaştığın içeriklerden sen sorumlusun. Başkalarının haklarını ihlal eden, yasa dışı, tehditkâr, nefret içerikli, cinsel istismar içeren veya kişisel verileri izinsiz yayımlayan içerikler yasaktır. Uygunsuz içerikleri bildirebilir; ihlal durumunda içerik veya hesap kaldırılabilir.</p>
    <h2>Hesap ve güvenlik</h2><p>Hesap bilgilerini doğru tutmalı ve giriş bilgilerini korumalısın. Hesabını istediğin zaman Ayarlar bölümünden kalıcı olarak silebilirsin.</p>
    <h2>Değişiklikler ve iletişim</h2><p>Hizmeti veya bu koşulları yasal gereklilikler ve ürün geliştirmeleri doğrultusunda güncelleyebiliriz. Soruların için <a href="mailto:eniscagrigilik1@gmail.com">eniscagrigilik1@gmail.com</a> adresine ulaşabilirsin.</p>`)));
  router.get('/account-deletion', (_req, res) => res.type('html').send(page('Hesap Silme', `
    <p>Nova AI hesabını ve ilişkili profil/topluluk verilerini kalıcı olarak silmek için uygulamaya giriş yapıp <strong>Ayarlar → Hesap silme</strong> seçeneğini kullan.</p>
    <p>Silme işlemi geri alınamaz. Uygulamaya erişemiyorsan, kayıtlı e-posta adresinden <a href="mailto:eniscagrigilik1@gmail.com?subject=Nova%20AI%20hesap%20silme%20talebi">eniscagrigilik1@gmail.com</a> adresine “Nova AI hesap silme talebi” konusu ile yaz. Kimliğini doğruladıktan sonra isteğin en geç 30 gün içinde işlenir.</p>`)));
  return router;
}
