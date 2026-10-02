import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet'; // npm install helmet
import rateLimit from 'express-rate-limit';

import { createProvider } from './providers/index.js';
import { authRouter } from './routes/auth.js';
import { accountRouter } from './routes/account.js';
import { chatRouter } from './routes/chat.js';
import { legalRouter } from './routes/legal.js';
import { AuthService } from './services/AuthService.js';

const num = (key: string, fallback: number) => {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const PORT = num('PORT', 3001);
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost,https://localhost')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const provider = createProvider(process.env.AI_PROVIDER);
const auth = new AuthService(process.env.AUTH_DATA_PATH, num('AUTH_SESSION_DAYS', 30));

const app = express();

app.disable('x-powered-by'); // Express kullanıldığını gizle (Helmet yapsa da manuel eklemek iyidir)
app.use(helmet()); // XSS, Clickjacking gibi temel web zafiyetlerini engeller
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || ALLOWED_ORIGINS.includes(origin))
}));
app.use(express.json({ limit: '100kb' })); // JSON payload boyutu sınırlandırması

app.use(rateLimit({
  windowMs: num('RATE_LIMIT_WINDOW_MS', 60000),
  limit: num('RATE_LIMIT_MAX', 30),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Çok fazla istek gönderdiniz. Lütfen biraz sonra tekrar deneyin.'
    }
  }
}));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    ai: { provider: provider.name, configured: provider.isConfigured, chatProtocol: 2 }
  });
});

app.use(legalRouter());
app.use('/api', authRouter(auth));
app.use('/api', accountRouter(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY));
app.use('/api', chatRouter(
  provider,
  num('REQUEST_TIMEOUT_MS', 30000),
  num('MAX_MESSAGE_LENGTH', 12000),
  num('MAX_CONVERSATION_MESSAGES', 60)
));

app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'İstenen kaynak bulunamadı.' } });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Express] Beklenmeyen Hata:', err);
  res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Sunucu tarafında beklenmeyen bir hata oluştu.' } });
});

async function bootstrap() {
  try {

    await auth.initialize();


    const server = app.listen(PORT, () => {
      console.info(`🚀 Nova AI backend ready on port ${PORT}`);
    });

    const shutdown = (signal: string) => {
      console.info(`\n[${signal}] Kapanma sinyali alındı. Sunucu durduruluyor...`);
      server.close(() => {
        console.info('HTTP sunucusu kapatıldı, yeni istek alınmıyor.');

        if (typeof auth.close === 'function') {
          auth.close();
        }

        console.info('Güle güle!');
        process.exit(0);
      });

      setTimeout(() => {
        console.error('Zorunlu kapanış (Zaman aşımı)');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));   // Ctrl+C
    process.on('SIGTERM', () => shutdown('SIGTERM')); // Docker/PM2 durdurma komutu

  } catch (error) {
    console.error('Uygulama başlatılırken kritik bir hata oluştu:', error);
    process.exit(1);
  }
}

bootstrap();
