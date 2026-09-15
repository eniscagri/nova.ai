import { Router } from 'express';
import { z } from 'zod';

const deletionSchema = z.object({ confirmation: z.literal('SİL') });
const safeError = (status: number, code: string, message: string) => ({ status, body: { error: { code, message } } });

export function accountRouter(supabaseUrl: string | undefined, secretKey: string | undefined) {
  const router = Router();
  router.delete('/account', async (req, res) => {
    const parsed = deletionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(safeError(400, 'VALIDATION_ERROR', 'Silme işlemini onaylaman gerekiyor.').body);
    const accessToken = req.header('authorization')?.replace(/^Bearer\s+/i, '');
    if (!accessToken) return res.status(401).json(safeError(401, 'UNAUTHORIZED', 'Giriş yapman gerekiyor.').body);
    if (!supabaseUrl || !secretKey) return res.status(503).json(safeError(503, 'ACCOUNT_DELETE_UNAVAILABLE', 'Hesap silme şu anda kullanılamıyor. Destek ekibiyle iletişime geçebilirsin.').body);
    try {
      const userResult = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, { headers: { apikey: secretKey, authorization: `Bearer ${accessToken}` } });
      const user = await userResult.json().catch(() => null) as { id?: unknown } | null;
      if (!userResult.ok || typeof user?.id !== 'string') return res.status(401).json(safeError(401, 'UNAUTHORIZED', 'Oturumun doğrulanamadı. Yeniden giriş yapıp tekrar dene.').body);
      const deletion = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users/${encodeURIComponent(user.id)}`, { method: 'DELETE', headers: { apikey: secretKey, authorization: `Bearer ${secretKey}` } });
      if (!deletion.ok) return res.status(502).json(safeError(502, 'ACCOUNT_DELETE_ERROR', 'Hesap silme tamamlanamadı. Lütfen tekrar dene.').body);
      return res.status(204).end();
    } catch {
      return res.status(503).json(safeError(503, 'ACCOUNT_DELETE_UNAVAILABLE', 'Hesap silme şu anda kullanılamıyor. Destek ekibiyle iletişime geçebilirsin.').body);
    }
  });
  return router;
}
