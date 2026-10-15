import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** 数据库文件位置，可用 DB_PATH 覆盖；:memory: 便于测试 */
export const DB_PATH = process.env.DB_PATH ?? resolve(here, 'data/app.db');

if (DB_PATH !== ':memory:') {
  mkdirSync(dirname(DB_PATH), { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nickname      TEXT NOT NULL,
  experience    TEXT NOT NULL DEFAULT 'beginner',
  equipment     TEXT NOT NULL DEFAULT '[]',
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS favorites (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id   TEXT NOT NULL,
  title       TEXT NOT NULL DEFAULT '',
  subtitle    TEXT NOT NULL DEFAULT '',
  created_at  INTEGER NOT NULL,
  UNIQUE (user_id, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS workout_logs (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  muscle_id    TEXT,
  part_id      TEXT,
  problem_type TEXT,
  done_at      INTEGER NOT NULL,
  note         TEXT NOT NULL DEFAULT '',
  created_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_logs_user ON workout_logs (user_id, done_at DESC);

CREATE TABLE IF NOT EXISTS workout_entries (
  id            TEXT PRIMARY KEY,
  log_id        TEXT NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  exercise_id   TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  kind          TEXT NOT NULL DEFAULT '',
  sets          TEXT NOT NULL DEFAULT '',
  reps          TEXT NOT NULL DEFAULT '',
  weight        TEXT NOT NULL DEFAULT '',
  feel          INTEGER,
  sort          INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_entries_log ON workout_entries (log_id, sort);
`);

// ---------- 行类型 ----------

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  nickname: string;
  experience: string;
  equipment: string;
  created_at: number;
}

export interface FavoriteRow {
  id: string;
  user_id: string;
  target_type: string;
  target_id: string;
  title: string;
  subtitle: string;
  created_at: number;
}

export interface WorkoutLogRow {
  id: string;
  user_id: string;
  muscle_id: string | null;
  part_id: string | null;
  problem_type: string | null;
  done_at: number;
  note: string;
  created_at: number;
}

export interface WorkoutEntryRow {
  id: string;
  log_id: string;
  exercise_id: string;
  exercise_name: string;
  kind: string;
  sets: string;
  reps: string;
  weight: string;
  feel: number | null;
  sort: number;
}

// ---------- 查询辅助 ----------

export function queryAll<T>(sql: string, ...params: unknown[]): T[] {
  return db.prepare(sql).all(...(params as never[])) as T[];
}

export function queryOne<T>(sql: string, ...params: unknown[]): T | undefined {
  return db.prepare(sql).get(...(params as never[])) as T | undefined;
}

export function execute(sql: string, ...params: unknown[]): { changes: number } {
  const r = db.prepare(sql).run(...(params as never[]));
  return { changes: Number(r.changes) };
}

export function newId(): string {
  return globalThis.crypto.randomUUID();
}
