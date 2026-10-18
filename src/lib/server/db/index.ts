import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import * as schema from './schema';

const dbPath = process.env.DB_PATH ?? './data/pantau_mbg.db';
mkdirSync(dirname(dbPath), { recursive: true });

export const sqlite = new Database(dbPath);
// Aktifkan WAL mode untuk performa baca/tulis konkuren yang sangat cepat
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
