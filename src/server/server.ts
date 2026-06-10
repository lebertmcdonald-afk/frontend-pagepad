import { serve } from '@hono/node-server';
import { buildApp } from './app.js';
import { createDb } from './db/client.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const db = createDb(config.databaseUrl);
const app = buildApp({ db, config });

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Notion Notes backend listening on http://localhost:${info.port}`);
});
