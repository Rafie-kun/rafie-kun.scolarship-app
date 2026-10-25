import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema/index.js';

let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export function db() {
  if (!_db) {
    if (!process.env.DATABASE_URL_UNPOOLED) {
      throw new Error('DATABASE_URL_UNPOOLED is not set');
    }
    if (!_pool) {
      _pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED });
    }
    _db = drizzle(_pool, { schema });
  }
  return _db;
}

export function pool() {
  if (!_pool) {
    if (!process.env.DATABASE_URL_UNPOOLED) {
      throw new Error('DATABASE_URL_UNPOOLED is not set');
    }
    _pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED });
  }
  return _pool;
}

export { schema };
