import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import { users } from '../db/schema.js';
import type { AppEnv } from '../types.js';

export const authRoutes = new Hono<AppEnv>();

authRoutes.post('/token', (c) => {
  const db = c.get('db');
  const id = randomUUID();
  const token = randomUUID();
  const now = new Date();

  const inserted = db
    .insert(users)
    .values({ id, token, isPro: false, createdAt: now })
    .returning()
    .get();

  return c.json(
    {
      token: inserted.token,
      user: {
        id: inserted.id,
        isPro: inserted.isPro,
        createdAt: inserted.createdAt,
      },
    },
    201,
  );
});
