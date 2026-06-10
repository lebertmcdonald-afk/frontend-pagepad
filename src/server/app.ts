import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createMiddleware } from 'hono/factory';
import { serveStatic } from '@hono/node-server/serve-static';
import type { Config } from './config.js';
import type { DB } from './db/client.js';
import type { AppEnv } from './types.js';
import { authRoutes } from './routes/auth.js';
import { pagesRoutes } from './routes/pages.js';
import { meRoutes } from './routes/me.js';
import { adminRoutes } from './routes/admin.js';

export interface BuildAppOptions {
  db: DB;
  config: Config;
}

export function buildApp({ db, config }: BuildAppOptions) {
  const app = new Hono<AppEnv>();

  app.use(
    '*',
    cors({
      origin: config.corsOrigin,
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Authorization', 'Content-Type'],
      maxAge: 600,
    }),
  );

  const contextMiddleware = createMiddleware<AppEnv>(async (c, next) => {
    c.set('db', db);
    c.set('config', config);
    await next();
  });
  app.use('*', contextMiddleware);

  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.route('/auth', authRoutes);
  app.route('/me', meRoutes);
  app.route('/pages', pagesRoutes);
  app.route('/admin', adminRoutes);

  // Serve built frontend in production (dist/client/ from project root)
  app.use('/*', serveStatic({ root: './dist/client' }));
  app.get('/*', serveStatic({ path: 'index.html', root: './dist/client' }));

  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: 'Internal server error' }, 500);
  });

  return app;
}
