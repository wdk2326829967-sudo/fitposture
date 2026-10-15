import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi, setToken, type User } from './api';

interface AuthContextValue {
  user: User | null;
  /** 是否已经确认过登录态（避免刷新时闪一下未登录） */
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => void;
  patchUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // 启动时用会话（Cookie）换一次用户信息。
  // 这里不看本地 token：登录态的权威在服务端 Cookie，只看 localStorage 会在
  // Cookie 仍在、本地被清的情况下误判成未登录。
  useEffect(() => {
    let alive = true;
    authApi
      .session()
      .then((r) => {
        if (alive) setUser(r.user);
      })
      .catch(() => {
        if (alive) setUser(null);
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await authApi.login(email, password);
    setToken(r.token);
    setUser(r.user);
  }, []);

  const register = useCallback(async (email: string, password: string, nickname: string) => {
    const r = await authApi.register(email, password, nickname);
    setToken(r.token);
    setUser(r.user);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    // 服务端 Cookie 不清，刷新后又会回到登录态
    void authApi.logout().catch(() => {});
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, ready, login, register, logout, patchUser: setUser }),
    [user, ready, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用');
  return ctx;
}
