import { compare, hash } from 'bcryptjs';

const ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hashValue: string): Promise<boolean> {
  return compare(plain, hashValue);
}
