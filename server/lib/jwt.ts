// jsonwebtoken 是 CommonJS 包，Node 的 ESM 互操作探测不到它的命名导出，
// 因此这里必须用默认导入（运行时 default === module.exports）。
// 类型侧由 tsconfig.server.json 的 allowSyntheticDefaultImports 兜住。
import jwt from 'jsonwebtoken';
import type { JwtPayload, SignOptions } from 'jsonwebtoken';
import { env } from '../env.ts';

export const TOKEN_TTL = env.jwtExpiresIn;

export function signToken(userId: string, email: string): string {
  const options: SignOptions = {
    subject: userId,
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign({ email }, env.jwtSecret, options);
}

export interface AuthClaims {
  userId: string;
  email: string;
}

export function verifyToken(token: string): AuthClaims | null {
  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    if (!payload.sub) return null;
    return { userId: payload.sub, email: typeof payload.email === 'string' ? payload.email : '' };
  } catch {
    return null;
  }
}
