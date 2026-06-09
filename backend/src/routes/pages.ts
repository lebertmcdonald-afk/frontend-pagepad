import { Hono } from 'hono';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { and, asc, eq, sql } from 'drizzle-orm';
import { pages } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import type { AppEnv } from '../types.js';

export const pagesRoutes = new Hono<AppEnv>();
pagesRoutes.use('*', requireAuth);

const createSchema = z.object({
  title: z.string().max(500).optional(),
  content: z.string().optional(),
});

const updateSchema = z
  .object({
    title: z.string().max(500).optional(),
    content: z.string().optional(),
    position: z.number().int().optional(),
  })
  .refine((v) => v.title !== undefined || v.content !== undefined || v.position !== undefined, {
    message: 'At least one field is required',
  });

pagesRoutes.get('/', (c) => {
  const db = c.get('db');
  const user = c.get('user');
  const rows = db
    .select()
    .from(pages)
    .where(eq(pages.userId, user.id))
    .orderBy(asc(pages.position), asc(pages.createdAt))
    .all();
  return c.json({ pages: rows });
});

pagesRoutes.post('/', async (c) => {
  const db = c.get('db');
  const user = c.get('user');
  const { freePageLimit } = c.get('config');

  const body = await c.req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }

  if (!user.isPro) {
    const countRow = db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(pages)
      .where(eq(pages.userId, user.id))
      .get();
    const count = countRow?.count ?? 0;
    if (count >= freePageLimit) {
      return c.json(
        {
          error: 'Page limit reached',
          limit: freePageLimit,
          upgradeRequired: true,
        },
        402,
      );
    }
  }

  const maxPositionRow = db
    .select({ max: sql<number>`coalesce(max(position), -1)`.as('max') })
    .from(pages)
    .where(eq(pages.userId, user.id))
    .get();
  const nextPosition = (maxPositionRow?.max ?? -1) + 1;

  const now = new Date();
  const inserted = db
    .insert(pages)
    .values({
      id: randomUUID(),
      userId: user.id,
      title: parsed.data.title ?? '',
      content: parsed.data.content ?? '',
      position: nextPosition,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  return c.json({ page: inserted }, 201);
});

pagesRoutes.get('/:id', (c) => {
  const db = c.get('db');
  const user = c.get('user');
  const id = c.req.param('id');

  const page = db
    .select()
    .from(pages)
    .where(and(eq(pages.id, id), eq(pages.userId, user.id)))
    .get();
  if (!page) return c.json({ error: 'Page not found' }, 404);
  return c.json({ page });
});

pagesRoutes.patch('/:id', async (c) => {
  const db = c.get('db');
  const user = c.get('user');
  const id = c.req.param('id');

  const body = await c.req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }

  const updated = db
    .update(pages)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(pages.id, id), eq(pages.userId, user.id)))
    .returning()
    .get();

  if (!updated) return c.json({ error: 'Page not found' }, 404);
  return c.json({ page: updated });
});

pagesRoutes.delete('/:id', (c) => {
  const db = c.get('db');
  const user = c.get('user');
  const id = c.req.param('id');

  const deleted = db
    .delete(pages)
    .where(and(eq(pages.id, id), eq(pages.userId, user.id)))
    .returning({ id: pages.id })
    .get();

  if (!deleted) return c.json({ error: 'Page not found' }, 404);
  return c.json({ deleted: deleted.id });
});

function sanitizeFilename(title: string): string {
  const trimmed = title.trim() || 'untitled';
  return trimmed.replace(/[^a-z0-9-_ ]/gi, '_').slice(0, 100);
}

pagesRoutes.get('/:id/export', (c) => {
  const db = c.get('db');
  const user = c.get('user');

  if (!user.isPro) {
    return c.json({ error: 'Export requires Pro tier', upgradeRequired: true }, 403);
  }

  const id = c.req.param('id');
  const page = db
    .select()
    .from(pages)
    .where(and(eq(pages.id, id), eq(pages.userId, user.id)))
    .get();
  if (!page) return c.json({ error: 'Page not found' }, 404);

  const title = page.title || 'Untitled';
  const markdown = `# ${title}\n\n${page.content}\n`;
  const filename = `${sanitizeFilename(title)}.md`;

  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
});
