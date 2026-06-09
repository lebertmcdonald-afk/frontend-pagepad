import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../db/schema.js';
import type { DB } from '../db/client.js';
import { buildApp } from '../app.js';
import type { Config } from '../config.js';

export function createTestDb(): DB {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: './drizzle' });
  return db;
}

export function createTestApp(overrides: Partial<Config> = {}) {
  const db = createTestDb();
  const config: Config = {
    port: 0,
    databaseUrl: ':memory:',
    adminToken: 'test-admin',
    corsOrigin: '*',
    freePageLimit: 5,
    ...overrides,
  };
  const app = buildApp({ db, config });
  return { app, db, config };
}

export async function createUserAndToken(app: ReturnType<typeof buildApp>) {
  const res = await app.request('/auth/token', { method: 'POST' });
  const body = (await res.json()) as { token: string; user: { id: string } };
  return { token: body.token, userId: body.user.id };
}

export function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}
