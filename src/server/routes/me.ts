import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import { pages } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import type { AppEnv } from '../types.js';

export const meRoutes = new Hono<AppEnv>();
meRoutes.use('*', requireAuth);

meRoutes.get('/', (c) => {
  const db = c.get('db');
  const user = c.get('user');
  const { freePageLimit } = c.get('config');

  const countRow = db
    .select({ count: sql<number>`count(*)`.as('count') })
    .from(pages)
    .where(eq(pages.userId, user.id))
    .get();
  const pageCount = countRow?.count ?? 0;

  return c.json({
    user: {
      id: user.id,
      isPro: user.isPro,
      createdAt: user.createdAt,
    },
    pageCount,
    pageLimit: user.isPro ? null : freePageLimit,
  });
});
