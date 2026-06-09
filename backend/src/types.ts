import type { DB } from './db/client.js';
import type { Config } from './config.js';
import type { User } from './db/schema.js';

export interface AppEnv {
  Variables: {
    db: DB;
    config: Config;
    user: User;
  };
}
