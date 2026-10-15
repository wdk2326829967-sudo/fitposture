import { z } from 'zod';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const password = z
  .string()
  .min(8, '密码至少 8 位')
  .max(72, '密码最长 72 位');

export const registerSchema = z.object({
  email: z.string().trim().regex(EMAIL, '邮箱格式不正确'),
  password,
  nickname: z.string().trim().min(1, '昵称不能为空').max(24, '昵称最长 24 字'),
});

export const loginSchema = z.object({
  email: z.string().trim().regex(EMAIL, '邮箱格式不正确'),
  password: z.string().min(1, '请输入密码'),
});

export const profileSchema = z.object({
  nickname: z.string().trim().min(1).max(24).optional(),
  experience: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  equipment: z.array(z.string()).max(20).optional(),
});

export const TARGET_TYPES = ['muscle', 'part', 'exercise', 'posture', 'symptom'] as const;

export const favoriteCreateSchema = z.object({
  targetType: z.enum(TARGET_TYPES),
  targetId: z.string().trim().min(1).max(120),
  title: z.string().trim().max(120).optional().default(''),
  subtitle: z.string().trim().max(200).optional().default(''),
});

export const workoutEntrySchema = z.object({
  exerciseId: z.string().trim().min(1).max(120),
  exerciseName: z.string().trim().min(1).max(120),
  kind: z.string().trim().max(20).optional().default(''),
  sets: z.string().trim().max(20).optional().default(''),
  reps: z.string().trim().max(40).optional().default(''),
  weight: z.string().trim().max(40).optional().default(''),
  feel: z.number().int().min(1).max(5).nullable().optional().default(null),
});

/** 训练日期：接受 ISO 字符串或毫秒时间戳 */
const doneAt = z
  .union([z.string(), z.number()])
  .transform((v, ctx) => {
    const t = typeof v === 'number' ? v : Date.parse(v);
    if (Number.isNaN(t)) {
      ctx.addIssue({ code: 'custom', message: '训练日期不合法' });
      return z.NEVER;
    }
    return t;
  });

export const workoutCreateSchema = z.object({
  muscleId: z.string().trim().max(60).nullable().optional().default(null),
  partId: z.string().trim().max(120).nullable().optional().default(null),
  problemType: z.string().trim().max(30).nullable().optional().default(null),
  doneAt: doneAt.optional(),
  note: z.string().trim().max(500).optional().default(''),
  entries: z.array(workoutEntrySchema).max(50).optional().default([]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type FavoriteCreateInput = z.infer<typeof favoriteCreateSchema>;
export type WorkoutCreateInput = z.infer<typeof workoutCreateSchema>;
