import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema.js';
import { requireAdmin } from '../middleware/auth.js';
import type { AppEnv } from '../types.js';

export const adminRoutes = new Hono<AppEnv>();
adminRoutes.use('*', requireAdmin);

const upgradeSchema = z.object({
  isPro: z.boolean(),
});

adminRoutes.post('/users/:id/upgrade', async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');

  const body = await c.req.json().catch(() => ({}));
  const parsed = upgradeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }

  const updated = db
    .update(users)
    .set({ isPro: parsed.data.isPro })
    .where(eq(users.id, id))
    .returning()
    .get();

  if (!updated) return c.json({ error: 'User not found' }, 404);
  return c.json({
    user: { id: updated.id, isPro: updated.isPro, createdAt: updated.createdAt },
  });
});
