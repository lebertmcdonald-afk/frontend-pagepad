import { describe, it, expect } from 'vitest';
import { createTestApp, createUserAndToken, authHeader } from './helpers.js';

async function createPage(
  app: ReturnType<typeof createTestApp>['app'],
  token: string,
  body: Record<string, unknown> = {},
) {
  return app.request('/pages', {
    method: 'POST',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('pages CRUD', () => {
  it('creates and lists pages', async () => {
    const { app } = createTestApp();
    const { token } = await createUserAndToken(app);

    const create = await createPage(app, token, { title: 'First', content: 'hello' });
    expect(create.status).toBe(201);
    const created = (await create.json()) as { page: { id: string; title: string } };
    expect(created.page.title).toBe('First');

    const list = await app.request('/pages', { headers: authHeader(token) });
    const body = (await list.json()) as { pages: unknown[] };
    expect(body.pages).toHaveLength(1);
  });

  it('updates page content (autosave)', async () => {
    const { app } = createTestApp();
    const { token } = await createUserAndToken(app);

    const create = await createPage(app, token, { title: 'Notes' });
    const { page } = (await create.json()) as { page: { id: string } };

    const patch = await app.request(`/pages/${page.id}`, {
      method: 'PATCH',
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'updated body' }),
    });
    expect(patch.status).toBe(200);
    const patched = (await patch.json()) as { page: { content: string } };
    expect(patched.page.content).toBe('updated body');
  });

  it('deletes a page', async () => {
    const { app } = createTestApp();
    const { token } = await createUserAndToken(app);
    const create = await createPage(app, token);
    const { page } = (await create.json()) as { page: { id: string } };

    const del = await app.request(`/pages/${page.id}`, {
      method: 'DELETE',
      headers: authHeader(token),
    });
    expect(del.status).toBe(200);

    const get = await app.request(`/pages/${page.id}`, { headers: authHeader(token) });
    expect(get.status).toBe(404);
  });

  it('isolates pages between users', async () => {
    const { app } = createTestApp();
    const a = await createUserAndToken(app);
    const b = await createUserAndToken(app);

    const create = await createPage(app, a.token, { title: 'A only' });
    const { page } = (await create.json()) as { page: { id: string } };

    const otherGet = await app.request(`/pages/${page.id}`, { headers: authHeader(b.token) });
    expect(otherGet.status).toBe(404);

    const list = await app.request('/pages', { headers: authHeader(b.token) });
    const body = (await list.json()) as { pages: unknown[] };
    expect(body.pages).toHaveLength(0);
  });

  it('rejects empty PATCH bodies', async () => {
    const { app } = createTestApp();
    const { token } = await createUserAndToken(app);
    const create = await createPage(app, token);
    const { page } = (await create.json()) as { page: { id: string } };
    const patch = await app.request(`/pages/${page.id}`, {
      method: 'PATCH',
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(patch.status).toBe(400);
  });
});

describe('freemium limit', () => {
  it('blocks the 6th page for free users with 402', async () => {
    const { app } = createTestApp({ freePageLimit: 5 });
    const { token } = await createUserAndToken(app);

    for (let i = 0; i < 5; i++) {
      const res = await createPage(app, token, { title: `Page ${i + 1}` });
      expect(res.status).toBe(201);
    }

    const blocked = await createPage(app, token, { title: 'Sixth' });
    expect(blocked.status).toBe(402);
    const body = (await blocked.json()) as { upgradeRequired: boolean; limit: number };
    expect(body.upgradeRequired).toBe(true);
    expect(body.limit).toBe(5);
  });

  it('allows unlimited pages for Pro users', async () => {
    const { app } = createTestApp({ freePageLimit: 2 });
    const { token, userId } = await createUserAndToken(app);

    await app.request(`/admin/users/${userId}/upgrade`, {
      method: 'POST',
      headers: { Authorization: 'Bearer test-admin', 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPro: true }),
    });

    for (let i = 0; i < 5; i++) {
      const res = await createPage(app, token, { title: `Page ${i + 1}` });
      expect(res.status).toBe(201);
    }
  });
});
