import { Router, type Response } from 'express';
import { z } from 'zod';
import { AuthError, type AuthService } from '../services/AuthService.js';

const registrationSchema = z.object({ name: z.string().trim().min(2).max(60), email: z.string().trim().email().max(254), password: z.string().min(10).max(128) });
const loginSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128) });
const resetSchema = z.object({ email: z.string().trim().email().max(254), recoveryCode: z.string().trim().min(8).max(40), password: z.string().min(10).max(128) });

const readToken = (authorization: string | undefined) => authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
const sendError = (res: Response, error: unknown) => {
  if (error instanceof AuthError) return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  return res.status(500).json({ error: { code: 'AUTH_ERROR', message: 'Hesap işlemi şu anda tamamlanamıyor.' } });
};

export function authRouter(auth: AuthService) {
  const router = Router();
  router.post('/auth/register', async (req, res) => { const parsed = registrationSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Lütfen adınızı, geçerli e-posta adresinizi ve en az 10 karakterlik şifrenizi kontrol edin.' } }); try { return res.status(201).json(await auth.register(parsed.data)); } catch (error) { return sendError(res, error); } });
  router.post('/auth/login', async (req, res) => { const parsed = loginSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'E-posta ve şifre gerekli.' } }); try { return res.json(await auth.login(parsed.data)); } catch (error) { return sendError(res, error); } });
  router.post('/auth/reset-password', async (req, res) => { const parsed = resetSchema.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Kurtarma kodunu ve en az 10 karakterlik yeni şifreyi kontrol edin.' } }); try { return res.json(await auth.resetPassword(parsed.data)); } catch (error) { return sendError(res, error); } });
  router.get('/auth/session', async (req, res) => { const token = readToken(req.header('authorization')); if (!token) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Giriş yapmanız gerekiyor.' } }); try { return res.json({ user: await auth.session(token) }); } catch (error) { return sendError(res, error); } });
  router.post('/auth/logout', async (req, res) => { const token = readToken(req.header('authorization')); if (token) await auth.logout(token); return res.status(204).end(); });
  return router;
}
