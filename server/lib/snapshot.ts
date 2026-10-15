import { readFileSync } from 'node:fs';
import {
  execute,
  queryAll,
  queryOne,
  type FavoriteRow,
  type UserRow,
  type WorkoutEntryRow,
  type WorkoutLogRow,
} from '../db.ts';

/**
 * 全库快照。
 *
 * 存在的原因：数据库文件跟着容器走，而平台重建容器时不会保留它——实测两次部署，
 * 一次数据还在、一次账号全部消失。这种不可预期的丢失对有账号的产品是致命的。
 *
 * 于是改成「快照随包发布」：每次部署前把线上最新数据拉下来存成 seed.json 一起上传，
 * 服务端启动时若发现是空库，就用它自动恢复。整个过程用户无感。
 *
 * 注意：快照含 password_hash，属于高敏感数据，只能由受保护的管理接口产出。
 */
export interface DbSnapshot {
  format: 'fitposture-db-snapshot';
  version: 1;
  dumpedAt: number;
  users: UserRow[];
  favorites: FavoriteRow[];
  workoutLogs: WorkoutLogRow[];
  workoutEntries: WorkoutEntryRow[];
}

export function dumpDatabase(): DbSnapshot {
  return {
    format: 'fitposture-db-snapshot',
    version: 1,
    dumpedAt: Date.now(),
    users: queryAll<UserRow>('SELECT * FROM users'),
    favorites: queryAll<FavoriteRow>('SELECT * FROM favorites'),
    workoutLogs: queryAll<WorkoutLogRow>('SELECT * FROM workout_logs'),
    workoutEntries: queryAll<WorkoutEntryRow>('SELECT * FROM workout_entries'),
  };
}

export function countUsers(): number {
  return queryOne<{ n: number }>('SELECT COUNT(*) AS n FROM users')?.n ?? 0;
}

/**
 * 用快照填充空库。
 * 只在库里一个用户都没有时才导入——避免覆盖掉容器里更新的数据。
 * 返回导入的用户数，0 表示跳过了。
 */
export function restoreFromSnapshot(file: string): number {
  if (countUsers() > 0) return 0;

  let snap: DbSnapshot;
  try {
    snap = JSON.parse(readFileSync(file, 'utf8')) as DbSnapshot;
  } catch {
    return 0;
  }
  if (!snap?.users?.length) return 0;

  // 用 OR IGNORE 保证幂等：重复启动或快照与库部分重叠时都不会报错
  for (const u of snap.users) {
    execute(
      `INSERT OR IGNORE INTO users (id, email, password_hash, nickname, experience, equipment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      u.id, u.email, u.password_hash, u.nickname, u.experience, u.equipment, u.created_at,
    );
  }
  for (const f of snap.favorites ?? []) {
    execute(
      `INSERT OR IGNORE INTO favorites (id, user_id, target_type, target_id, title, subtitle, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      f.id, f.user_id, f.target_type, f.target_id, f.title, f.subtitle, f.created_at,
    );
  }
  for (const l of snap.workoutLogs ?? []) {
    execute(
      `INSERT OR IGNORE INTO workout_logs (id, user_id, muscle_id, part_id, problem_type, done_at, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      l.id, l.user_id, l.muscle_id, l.part_id, l.problem_type, l.done_at, l.note, l.created_at,
    );
  }
  for (const e of snap.workoutEntries ?? []) {
    execute(
      `INSERT OR IGNORE INTO workout_entries (id, log_id, exercise_id, exercise_name, kind, sets, reps, weight, feel, sort)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      e.id, e.log_id, e.exercise_id, e.exercise_name, e.kind, e.sets, e.reps, e.weight, e.feel, e.sort,
    );
  }

  return countUsers();
}
