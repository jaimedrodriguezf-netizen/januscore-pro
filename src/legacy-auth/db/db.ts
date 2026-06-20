import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const connectionString =
  import.meta.env?.DATABASE_URL || process.env.DATABASE_URL || '';

export const pool = mysql.createPool({
  uri: connectionString,
});

export const db = drizzle(pool, { schema, mode: 'default' });
