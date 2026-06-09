import { describe, it, expect } from 'vitest';
import { createTestApp, createUserAndToken, authHeader } from './helpers.js';

describe('auth', () => {
  it('issues a token and creates a user', async () => {
    const { app } = createTestApp();
    const res = await app.request('/auth/token', { method: 'POST' });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { token: string; user: { id: string; isPro: boolean } };
    expect(body.token).toBeTruthy();
    expect(body.user.id).toBeTruthy();
    expect(body.user.isPro).toBe(false);
  });

  it('rejects requests without a token', async () => {
    const { app } = createTestApp();
    const res = await app.request('/pages');
    expect(res.status).toBe(401);
  });

  it('rejects invalid tokens', async () => {
    const { app } = createTestApp();
    const res = await app.request('/pages', { headers: authHeader('not-a-real-token') });
    expect(res.status).toBe(401);
  });

  it('accepts valid tokens', async () => {
    const { app } = createTestApp();
    const { token } = await createUserAndToken(app);
    const res = await app.request('/pages', { headers: authHeader(token) });
    expect(res.status).toBe(200);
  });
});
