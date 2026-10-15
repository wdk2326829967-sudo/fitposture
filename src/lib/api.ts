const TOKEN_KEY = 'fitposture.token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // 无痕模式下 localStorage 不可用，忽略
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** 是否携带 token，默认 true */
  auth?: boolean;
  signal?: AbortSignal;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, signal } = options;
  const token = auth ? getToken() : null;

  const res = await fetch(`/api${path}`, {
    method,
    signal,
    headers: {
      'Content-Type': 'application/json',
      // 走自定义头而不仅是 Authorization：托管网关会占用 Authorization 放自己的凭据。
      // 两个都发，服务端优先取 X-Auth-Token。
      ...(token ? { Authorization: `Bearer ${token}`, 'X-Auth-Token': token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : `请求失败（${res.status}）`;
    throw new ApiError(res.status, message);
  }

  return payload as T;
}

// ---------- 类型 ----------

export interface User {
  id: string;
  email: string;
  nickname: string;
  experience: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  createdAt: number;
}

export interface Favorite {
  id: string;
  user_id: string;
  target_type: 'muscle' | 'part' | 'exercise' | 'posture' | 'symptom';
  target_id: string;
  title: string;
  subtitle: string;
  created_at: number;
}

export interface WorkoutEntry {
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

export interface WorkoutLog {
  id: string;
  user_id: string;
  muscle_id: string | null;
  part_id: string | null;
  problem_type: string | null;
  done_at: number;
  note: string;
  created_at: number;
  entries: WorkoutEntry[];
}

export interface WorkoutStats {
  totalLogs: number;
  totalEntries: number;
  activeDays30: number;
  streak: number;
  lastDoneAt: number | null;
}

// ---------- 接口 ----------

export const authApi = {
  register: (email: string, password: string, nickname: string) =>
    api<{ token: string; user: User }>('/auth/register', {
      method: 'POST', body: { email, password, nickname }, auth: false,
    }),
  login: (email: string, password: string) =>
    api<{ token: string; user: User }>('/auth/login', {
      method: 'POST', body: { email, password }, auth: false,
    }),
  me: () => api<{ user: User }>('/auth/me'),
  /** 探活：未登录返回 { user: null }，不产生 401 */
  session: () => api<{ user: User | null }>('/auth/session', { auth: false }),
  logout: () => api<{ ok: true }>('/auth/logout', { method: 'POST' }),
  updateProfile: (patch: Partial<Pick<User, 'nickname' | 'experience' | 'equipment'>>) =>
    api<{ user: User }>('/auth/profile', { method: 'PATCH', body: patch }),
};

export const favoritesApi = {
  list: () => api<{ items: Favorite[] }>('/favorites'),
  add: (input: { targetType: Favorite['target_type']; targetId: string; title?: string; subtitle?: string }) =>
    api<{ item: Favorite }>('/favorites', { method: 'POST', body: input }),
  remove: (targetType: string, targetId: string) =>
    api<{ ok: true }>(`/favorites?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`, {
      method: 'DELETE',
    }),
};

/**
 * 个人数据导出。
 *
 * 不走通用 api() 是因为它总是按 JSON 解析，而这里要保持原始响应体并触发浏览器下载。
 * 走 Cookie 之外的自定义头，是为了和其余接口保持一致的鉴权链路。
 */
export const meApi = {
  async exportData(): Promise<string> {
    const token = getToken();
    const res = await fetch('/api/me/export', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}`, 'X-Auth-Token': token } : {}),
      },
    });

    if (!res.ok) {
      let message = `导出失败（${res.status}）`;
      try {
        const j = await res.json();
        if (j && typeof j === 'object' && 'error' in j) message = String((j as { error: unknown }).error);
      } catch {
        // 非 JSON 响应就用状态码兜底
      }
      throw new ApiError(res.status, message);
    }

    const disposition = res.headers.get('Content-Disposition') ?? '';
    const matched = disposition.match(/filename="([^"]+)"/);
    const filename = matched?.[1] ?? `fitposture-${new Date().toISOString().slice(0, 10)}.json`;

    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    return filename;
  },
};

export const workoutsApi = {
  list: (limit = 50) => api<{ items: WorkoutLog[] }>(`/workouts?limit=${limit}`),
  stats: () => api<{ stats: WorkoutStats }>('/workouts/stats'),
  create: (input: {
    muscleId?: string | null;
    partId?: string | null;
    problemType?: string | null;
    doneAt?: string | number;
    note?: string;
    entries?: {
      exerciseId: string;
      exerciseName: string;
      kind?: string;
      sets?: string;
      reps?: string;
      weight?: string;
      feel?: number | null;
    }[];
  }) => api<{ item: WorkoutLog }>('/workouts', { method: 'POST', body: input }),
  remove: (id: string) => api<{ ok: true }>(`/workouts/${id}`, { method: 'DELETE' }),
};
