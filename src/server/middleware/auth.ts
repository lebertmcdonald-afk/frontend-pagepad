import { createMiddleware } from 'hono/factory';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema.js';
import type { AppEnv } from '../types.js';

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or malformed Authorization header' }, 401);
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return c.json({ error: 'Empty token' }, 401);
  }

  const db = c.get('db');
  const user = db.select().from(users).where(eq(users.token, token)).get();
  if (!user) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  c.set('user', user);
  await next();
});

export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header('Authorization');
  const adminToken = c.get('config').adminToken;
  if (!adminToken) {
    return c.json({ error: 'Admin endpoints disabled (ADMIN_TOKEN unset)' }, 503);
  }
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or malformed Authorization header' }, 401);
  }
  const token = header.slice('Bearer '.length).trim();
  if (token !== adminToken) {
    return c.json({ error: 'Invalid admin token' }, 403);
  }
  await next();
});
