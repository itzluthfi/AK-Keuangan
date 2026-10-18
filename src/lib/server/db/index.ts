import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import * as schema from './schema';
import { runMigrations } from './migrate';

const dbPath = process.env.DB_PATH ?? './data/pantau_mbg.db';
mkdirSync(dirname(dbPath), { recursive: true });

export const sqlite = new Database(dbPath);
// Aktifkan WAL mode untuk performa baca/tulis konkuren yang sangat cepat
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Jalankan migrasi tabel roles, invoices, dan kolom tambahan secara aman
try {
	runMigrations();
} catch (e) {
	console.error('Migration warning (non-fatal):', e);
}

export const db = drizzle(sqlite, { schema });

