import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth.tsx';

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, ready, logout } = useAuth();

  // 子路由也要让父级高亮：进到 /posture/xxx 详情时，「体态问题库」应仍处于选中态
  const isActive = (to: string) =>
    to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`);
  const nav = (to: string) =>
    `rounded-lg px-3 py-1.5 ${
      isActive(to) ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <Link to="/" className="flex min-w-0 flex-col leading-tight">
        <span className="text-base font-semibold text-slate-900">体态实验室</span>
        <span className="truncate text-xs text-slate-500">
          点击 3D 人体上的任意肌肉，查看针对它的训练与改善方案
        </span>
      </Link>
      <nav className="flex shrink-0 items-center gap-1 text-sm">
        <Link to="/" className={nav('/')}>
          3D 人体
        </Link>
        <Link to="/symptoms" className={nav('/symptoms')}>
          症状反查
        </Link>
        <Link to="/posture" className={nav('/posture')}>
          体态问题库
        </Link>
        {ready && !user && (
          <Link
            to="/login"
            className="ml-1 rounded-lg bg-teal-600 px-3 py-1.5 text-white hover:bg-teal-700"
          >
            登录
          </Link>
        )}
        {user && (
          <>
            <Link to="/me" className={`${nav('/me')} ml-1`}>
              {user.nickname}
            </Link>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="rounded-lg px-2 py-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="退出登录"
            >
              退出
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
