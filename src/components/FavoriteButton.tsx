import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth.tsx';
import { useFavorites } from '@/lib/hooks.ts';
import type { Favorite } from '@/lib/api';

interface Props {
  targetType: Favorite['target_type'];
  targetId: string;
  title?: string;
  subtitle?: string;
  /** 紧凑模式只显示图标 */
  compact?: boolean;
}

export default function FavoriteButton({ targetType, targetId, title, subtitle, compact }: Props) {
  const { user, ready } = useAuth();
  const logged = !!user;
  const { isFav, add, remove } = useFavorites(logged);

  if (!ready) return null;

  if (!user) {
    return (
      <Link
        to="/login"
        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:border-teal-300 hover:bg-teal-50"
        title="登录后才能收藏"
      >
        {compact ? '☆' : '☆ 收藏'}
      </Link>
    );
  }

  const on = isFav(targetType, targetId);
  const busy = add.isPending || remove.isPending;

  return (
    <button
      disabled={busy}
      onClick={() => {
        if (on) remove.mutate({ targetType, targetId });
        else add.mutate({ targetType, targetId, title, subtitle });
      }}
      className={[
        'rounded-lg border px-2.5 py-1 text-xs transition disabled:opacity-50',
        on
          ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
          : 'border-slate-200 text-slate-500 hover:border-teal-300 hover:bg-teal-50',
      ].join(' ')}
      title={on ? '取消收藏' : '收藏'}
    >
      {compact ? (on ? '★' : '☆') : on ? '★ 已收藏' : '☆ 收藏'}
    </button>
  );
}
