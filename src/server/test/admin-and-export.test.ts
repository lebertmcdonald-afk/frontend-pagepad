import { describe, it, expect } from 'vitest';
import { createTestApp, createUserAndToken, authHeader } from './helpers.js';

describe('/me', () => {
  it('returns user info, page count, and limit', async () => {
    const { app } = createTestApp({ freePageLimit: 5 });
    const { token } = await createUserAndToken(app);

    const res = await app.request('/me', { headers: authHeader(token) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { pageCount: number; pageLimit: number | null };
    expect(body.pageCount).toBe(0);
    expect(body.pageLimit).toBe(5);
  });

  it('returns null pageLimit for Pro users', async () => {
    const { app } = createTestApp();
    const { token, userId } = await createUserAndToken(app);

    await app.request(`/admin/users/${userId}/upgrade`, {
      method: 'POST',
      headers: { Authorization: 'Bearer test-admin', 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPro: true }),
    });

    const res = await app.request('/me', { headers: authHeader(token) });
    const body = (await res.json()) as { pageLimit: number | null; user: { isPro: boolean } };
    expect(body.pageLimit).toBe(null);
    expect(body.user.isPro).toBe(true);
  });
});

describe('admin upgrade', () => {
  it('requires admin token', async () => {
    const { app } = createTestApp();
    const { userId } = await createUserAndToken(app);

    const res = await app.request(`/admin/users/${userId}/upgrade`, {
      method: 'POST',
      headers: { Authorization: 'Bearer wrong-admin', 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPro: true }),
    });
    expect(res.status).toBe(403);
  });

  it('returns 503 when ADMIN_TOKEN is unset', async () => {
    const { app } = createTestApp({ adminToken: '' });
    const { userId } = await createUserAndToken(app);

    const res = await app.request(`/admin/users/${userId}/upgrade`, {
      method: 'POST',
      headers: { Authorization: 'Bearer anything', 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPro: true }),
    });
    expect(res.status).toBe(503);
  });

  it('upgrades and downgrades a user', async () => {
    const { app } = createTestApp();
    const { token, userId } = await createUserAndToken(app);

    const up = await app.request(`/admin/users/${userId}/upgrade`, {
      method: 'POST',
      headers: { Authorization: 'Bearer test-admin', 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPro: true }),
    });
    expect(up.status).toBe(200);

    let me = await app.request('/me', { headers: authHeader(token) });
    expect(((await me.json()) as { user: { isPro: boolean } }).user.isPro).toBe(true);

    const down = await app.request(`/admin/users/${userId}/upgrade`, {
      method: 'POST',
      headers: { Authorization: 'Bearer test-admin', 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPro: false }),
    });
    expect(down.status).toBe(200);

    me = await app.request('/me', { headers: authHeader(token) });
    expect(((await me.json()) as { user: { isPro: boolean } }).user.isPro).toBe(false);
  });
});

describe('markdown export', () => {
  it('blocks free users with 403', async () => {
    const { app } = createTestApp();
    const { token } = await createUserAndToken(app);

    const create = await app.request('/pages', {
      method: 'POST',
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Notes', content: 'free user' }),
    });
    const { page } = (await create.json()) as { page: { id: string } };

    const exp = await app.request(`/pages/${page.id}/export`, { headers: authHeader(token) });
    expect(exp.status).toBe(403);
  });

  it('returns markdown for Pro users', async () => {
    const { app } = createTestApp();
    const { token, userId } = await createUserAndToken(app);

    await app.request(`/admin/users/${userId}/upgrade`, {
      method: 'POST',
      headers: { Authorization: 'Bearer test-admin', 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPro: true }),
    });

    const create = await app.request('/pages', {
      method: 'POST',
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'My Page', content: 'Hello there' }),
    });
    const { page } = (await create.json()) as { page: { id: string } };

    const exp = await app.request(`/pages/${page.id}/export`, { headers: authHeader(token) });
    expect(exp.status).toBe(200);
    expect(exp.headers.get('Content-Type')).toContain('text/markdown');
    expect(exp.headers.get('Content-Disposition')).toContain('My Page.md');
    const text = await exp.text();
    expect(text).toBe('# My Page\n\nHello there\n');
  });
});
