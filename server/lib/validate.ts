import type { ZodType } from 'zod';
import { badRequest } from '../middleware.ts';

/** 校验请求体，失败直接抛 400（Express 5 会自动交给 errorHandler） */
export function parse<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    throw badRequest(first?.message ?? '请求参数有误');
  }
  return result.data;
}
