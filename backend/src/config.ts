export interface Config {
  port: number;
  databaseUrl: string;
  adminToken: string;
  corsOrigin: string;
  freePageLimit: number;
}

export function loadConfig(): Config {
  return {
    port: Number(process.env.PORT ?? 8787),
    databaseUrl: process.env.DATABASE_URL ?? './notion-notes.db',
    adminToken: process.env.ADMIN_TOKEN ?? '',
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
    freePageLimit: Number(process.env.FREE_PAGE_LIMIT ?? 5),
  };
}
