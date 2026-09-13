import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { createProvider } from './providers/index.js';
import { chatRouter } from './routes/chat.js';

const num = (key: string, fallback: number) => { const value = Number(process.env[key]); return Number.isFinite(value) && value > 0 ? value : fallback; };
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,https://localhost').split(',').map((origin) => origin.trim()).filter(Boolean);
const app = express();
const provider = createProvider(process.env.AI_PROVIDER);
app.disable('x-powered-by');
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)) }));
app.use(express.json({ limit: '100kb' }));
app.use(rateLimit({ windowMs: num('RATE_LIMIT_WINDOW_MS', 60000), limit: num('RATE_LIMIT_MAX', 30), standardHeaders: 'draft-8', legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Çok fazla istek gönderdiniz. Lütfen biraz sonra tekrar deneyin.' } } }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ai: { provider: provider.name, configured: provider.isConfigured } }));
app.use('/api', chatRouter(provider, num('REQUEST_TIMEOUT_MS', 30000), num('MAX_MESSAGE_LENGTH', 12000), num('MAX_CONVERSATION_MESSAGES', 60)));
app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'İstenen kaynak bulunamadı.' } }));
app.listen(num('PORT', 3001), () => console.info('Nova AI backend ready'));
