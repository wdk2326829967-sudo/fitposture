import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth.tsx';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, nickname.trim() || email.split('@')[0]);
      }
      navigate('/me');
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请重试');
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400';

  return (
    <>
      <Header />
      <main className="flex min-h-0 flex-1 items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          <div className="mb-5 text-center">
            <div className="text-xl font-semibold text-slate-800">
              {mode === 'login' ? '登录' : '注册账号'}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              {mode === 'login'
                ? '登录后可以收藏肌肉与动作、记录训练'
                : '注册后自动登录，数据保存在你自己的浏览器与本地数据库'}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 p-4">
            {mode === 'register' && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">昵称</label>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="怎么称呼你"
                  maxLength={24}
                  className={inputCls}
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? '至少 8 位' : '请输入密码'}
                required
                minLength={mode === 'register' ? 8 : 1}
                className={inputCls}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {busy ? '处理中…' : mode === 'login' ? '登录' : '注册并登录'}
            </button>

            <div className="text-center text-xs text-slate-500">
              {mode === 'login' ? '还没有账号？' : '已经有账号了？'}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError(null);
                }}
                className="ml-1 text-teal-700 hover:underline"
              >
                {mode === 'login' ? '去注册' : '去登录'}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600">
              先随便看看 →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
