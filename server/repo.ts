import { db, execute, newId, queryAll, queryOne, type FavoriteRow, type UserRow, type WorkoutEntryRow, type WorkoutLogRow } from './db.ts';
import { conflict, notFound } from './middleware.ts';
import type { FavoriteCreateInput, ProfileInput, WorkoutCreateInput } from './schemas.ts';

export const EXPERIENCES = ['beginner', 'intermediate', 'advanced'] as const;

export interface PublicUser {
  id: string;
  email: string;
  nickname: string;
  experience: string;
  equipment: string[];
  createdAt: number;
}

export function toPublicUser(row: UserRow): PublicUser {
  let equipment: string[] = [];
  try {
    const parsed = JSON.parse(row.equipment);
    if (Array.isArray(parsed)) equipment = parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    equipment = [];
  }
  return {
    id: row.id,
    email: row.email,
    nickname: row.nickname,
    experience: row.experience,
    equipment,
    createdAt: row.created_at,
  };
}

// ---------- 用户 ----------

export function findUserByEmail(email: string): UserRow | undefined {
  return queryOne<UserRow>('SELECT * FROM users WHERE email = ?', email.toLowerCase());
}

export function findUserById(id: string): UserRow | undefined {
  return queryOne<UserRow>('SELECT * FROM users WHERE id = ?', id);
}

export function createUser(email: string, passwordHash: string, nickname: string): UserRow {
  const now = Date.now();
  const row: UserRow = {
    id: newId(),
    email: email.toLowerCase(),
    password_hash: passwordHash,
    nickname,
    experience: 'beginner',
    equipment: '[]',
    created_at: now,
  };
  try {
    execute(
      `INSERT INTO users (id, email, password_hash, nickname, experience, equipment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      row.id, row.email, row.password_hash, row.nickname, row.experience, row.equipment, row.created_at,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('UNIQUE')) throw conflict('该邮箱已注册');
    throw e;
  }
  return row;
}

export function updateUser(userId: string, patch: ProfileInput): UserRow {
  const sets: string[] = [];
  const params: unknown[] = [];
  if (patch.nickname !== undefined) { sets.push('nickname = ?'); params.push(patch.nickname); }
  if (patch.experience !== undefined) { sets.push('experience = ?'); params.push(patch.experience); }
  if (patch.equipment !== undefined) { sets.push('equipment = ?'); params.push(JSON.stringify(patch.equipment)); }
  if (sets.length === 0) {
    const cur = findUserById(userId);
    if (!cur) throw notFound('用户不存在');
    return cur;
  }
  params.push(userId);
  execute(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, ...params);
  const updated = findUserById(userId);
  if (!updated) throw notFound('用户不存在');
  return updated;
}

// ---------- 收藏 ----------

export function listFavorites(userId: string): FavoriteRow[] {
  return queryAll<FavoriteRow>(
    'SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC',
    userId,
  );
}

export function addFavorite(userId: string, input: FavoriteCreateInput): FavoriteRow {
  const existing = queryOne<FavoriteRow>(
    'SELECT * FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?',
    userId, input.targetType, input.targetId,
  );
  if (existing) return existing;

  const row: FavoriteRow = {
    id: newId(),
    user_id: userId,
    target_type: input.targetType,
    target_id: input.targetId,
    title: input.title,
    subtitle: input.subtitle,
    created_at: Date.now(),
  };
  execute(
    `INSERT INTO favorites (id, user_id, target_type, target_id, title, subtitle, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    row.id, row.user_id, row.target_type, row.target_id, row.title, row.subtitle, row.created_at,
  );
  return row;
}

export function removeFavorite(userId: string, targetType: string, targetId: string): boolean {
  const r = execute(
    'DELETE FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?',
    userId, targetType, targetId,
  );
  return r.changes > 0;
}

// ---------- 训练记录 ----------

export interface WorkoutWithEntries extends WorkoutLogRow {
  entries: WorkoutEntryRow[];
}

export function createWorkout(userId: string, input: WorkoutCreateInput): WorkoutWithEntries {
  const now = Date.now();
  const logId = newId();
  const tx = db.prepare('BEGIN');
  tx.run();
  try {
    execute(
      `INSERT INTO workout_logs (id, user_id, muscle_id, part_id, problem_type, done_at, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      logId, userId, input.muscleId, input.partId, input.problemType,
      input.doneAt ?? now, input.note, now,
    );
    input.entries.forEach((e, i) => {
      execute(
        `INSERT INTO workout_entries (id, log_id, exercise_id, exercise_name, kind, sets, reps, weight, feel, sort)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        newId(), logId, e.exerciseId, e.exerciseName, e.kind, e.sets, e.reps, e.weight, e.feel, i,
      );
    });
    db.prepare('COMMIT').run();
  } catch (e) {
    db.prepare('ROLLBACK').run();
    throw e;
  }
  return getWorkout(userId, logId);
}

export function getWorkout(userId: string, logId: string): WorkoutWithEntries {
  const log = queryOne<WorkoutLogRow>('SELECT * FROM workout_logs WHERE id = ? AND user_id = ?', logId, userId);
  if (!log) throw notFound('训练记录不存在');
  const entries = queryAll<WorkoutEntryRow>(
    'SELECT * FROM workout_entries WHERE log_id = ? ORDER BY sort ASC', logId,
  );
  return { ...log, entries };
}

export function listWorkouts(userId: string, limit = 50): WorkoutWithEntries[] {
  const logs = queryAll<WorkoutLogRow>(
    'SELECT * FROM workout_logs WHERE user_id = ? ORDER BY done_at DESC LIMIT ?', userId, limit,
  );
  if (logs.length === 0) return [];
  const ids = logs.map((l) => l.id);
  const placeholders = ids.map(() => '?').join(',');
  const entries = queryAll<WorkoutEntryRow>(
    `SELECT * FROM workout_entries WHERE log_id IN (${placeholders}) ORDER BY sort ASC`, ...ids,
  );
  const byLog = new Map<string, WorkoutEntryRow[]>();
  for (const e of entries) {
    const arr = byLog.get(e.log_id) ?? [];
    arr.push(e);
    byLog.set(e.log_id, arr);
  }
  return logs.map((l) => ({ ...l, entries: byLog.get(l.id) ?? [] }));
}

export function deleteWorkout(userId: string, logId: string): boolean {
  const r = execute('DELETE FROM workout_logs WHERE id = ? AND user_id = ?', logId, userId);
  return r.changes > 0;
}

export interface WorkoutStats {
  totalLogs: number;
  totalEntries: number;
  /** 最近 30 天内有训练的天数 */
  activeDays30: number;
  /** 连续打卡天数（含今天则计入） */
  streak: number;
  lastDoneAt: number | null;
}

export function workoutStats(userId: string): WorkoutStats {
  const total = queryOne<{ logs: number; entries: number }>(
    `SELECT
       (SELECT COUNT(*) FROM workout_logs WHERE user_id = ?) AS logs,
       (SELECT COUNT(*) FROM workout_entries e JOIN workout_logs l ON l.id = e.log_id WHERE l.user_id = ?) AS entries`,
    userId, userId,
  );
  const days = queryAll<{ d: string }>(
    `SELECT DISTINCT date(done_at / 1000, 'unixepoch', 'localtime') AS d
     FROM workout_logs WHERE user_id = ? ORDER BY d DESC`,
    userId,
  );
  const daySet = new Set(days.map((r) => r.d));

  const today = new Date();
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;

  let streak = 0;
  const cursor = new Date(today);
  // 今天没练的话从昨天开始算，避免刚过午夜就把连续天数清零
  if (!daySet.has(fmt(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (daySet.has(fmt(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 29);
  let activeDays30 = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (daySet.has(fmt(d))) activeDays30++;
  }

  const last = queryOne<{ done_at: number }>(
    'SELECT done_at FROM workout_logs WHERE user_id = ? ORDER BY done_at DESC LIMIT 1', userId,
  );

  return {
    totalLogs: total?.logs ?? 0,
    totalEntries: total?.entries ?? 0,
    activeDays30,
    streak,
    lastDoneAt: last?.done_at ?? null,
  };
}

// ---------- 数据导出 ----------

/**
 * 用户全部数据的可移植快照。
 *
 * 存在的理由：数据库文件跟着应用实例走，平台一旦回收或迁移，账号与训练记录就没了，
 * 而用户此前没有任何把数据拿走的手段。导出成明文 JSON 后，至少数据不再被锁在这里。
 *
 * 注意：绝不能包含 password_hash，导出文件一旦泄露不应危及账号。
 */
export interface UserDataExport {
  format: 'fitposture-user-data';
  version: 1;
  exportedAt: number;
  profile: PublicUser;
  stats: WorkoutStats;
  favorites: Array<{
    type: string;
    id: string;
    title: string;
    subtitle: string;
    favoritedAt: number;
  }>;
  workouts: Array<{
    id: string;
    muscleId: string | null;
    partId: string | null;
    problemType: string | null;
    doneAt: number;
    note: string;
    entries: Array<{
      exerciseId: string;
      exerciseName: string;
      kind: string;
      sets: string;
      reps: string;
      weight: string;
      feel: number | null;
    }>;
  }>;
}

/** 组装导出快照。上限取一个大数，确保导出的是全部记录而非最近 50 条。 */
export function exportUserData(userId: string): UserDataExport {
  const user = findUserById(userId);
  if (!user) throw notFound('用户不存在');

  return {
    format: 'fitposture-user-data',
    version: 1,
    exportedAt: Date.now(),
    profile: toPublicUser(user),
    stats: workoutStats(userId),
    favorites: listFavorites(userId).map((f) => ({
      type: f.target_type,
      id: f.target_id,
      title: f.title,
      subtitle: f.subtitle,
      favoritedAt: f.created_at,
    })),
    workouts: listWorkouts(userId, 100000).map((w) => ({
      id: w.id,
      muscleId: w.muscle_id,
      partId: w.part_id,
      problemType: w.problem_type,
      doneAt: w.done_at,
      note: w.note,
      entries: w.entries.map((e) => ({
        exerciseId: e.exercise_id,
        exerciseName: e.exercise_name,
        kind: e.kind,
        sets: e.sets,
        reps: e.reps,
        weight: e.weight,
        feel: e.feel,
      })),
    })),
  };
}
