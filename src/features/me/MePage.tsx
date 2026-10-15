import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth.tsx';
import { useFavorites, useWorkoutStats, useWorkouts } from '@/lib/hooks.ts';
import { authApi, meApi, type Favorite } from '@/lib/api';
import { EQUIPMENT_CN } from '@/kb/exercises';

const EQUIPMENT_OPTIONS = ['none', 'dumbbell', 'barbell', 'machine', 'cable', 'band'] as const;
const EXPERIENCE_CN: Record<string, string> = {
  beginner: '新手',
  intermediate: '有基础',
  advanced: '进阶',
};

const TARGET_CN: Record<string, string> = {
  muscle: '肌肉',
  part: '亚部',
  exercise: '动作',
  posture: '体态问题',
  symptom: '症状',
};

function favHref(f: Favorite): string {
  if (f.target_type === 'muscle') return `/muscle/${f.target_id}`;
  if (f.target_type === 'part') {
    const [g, p] = f.target_id.split(':');
    return g && p ? `/muscle/${g}/${p}` : `/muscle/${g ?? ''}`;
  }
  if (f.target_type === 'posture') return `/posture/${f.target_id}`;
  if (f.target_type === 'symptom') return `/symptoms/${f.target_id}`;
  return '';
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function MePage() {
  const { user, ready, patchUser } = useAuth();
  const logged = !!user;
  const fav = useFavorites(logged);
  const workouts = useWorkouts(logged);
  const { stats } = useWorkoutStats(logged);

  const [equipment, setEquipment] = useState<string[]>([]);
  useEffect(() => {
    if (user) setEquipment(user.equipment);
  }, [user]);

  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const onExport = async () => {
    setExporting(true);
    setExportMsg(null);
    try {
      const name = await meApi.exportData();
      setExportMsg(`已导出 ${name}`);
    } catch (e) {
      setExportMsg(e instanceof Error ? e.message : '导出失败');
    } finally {
      setExporting(false);
    }
  };

  const equipmentDirty = useMemo(() => {
    if (!user) return false;
    const a = [...equipment].sort();
    const b = [...user.equipment].sort();
    return a.length !== b.length || a.some((v, i) => v !== b[i]);
  }, [equipment, user]);

  if (ready && !user) {
    return (
      <>
        <Header />
        <main className="flex min-h-0 flex-1 items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <div className="text-xl font-semibold text-slate-800">登录后使用</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              收藏肌肉、保存训练记录需要登录后才能同步保存。
            </p>
            <Link
              to="/login"
              className="mt-4 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              去登录 / 注册
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto max-w-3xl space-y-5">
          <div>
            <div className="text-lg font-semibold text-slate-900">{user?.nickname}</div>
            <div className="text-xs text-slate-400">{user?.email}</div>
          </div>

          {/* 统计 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: '训练次数', value: stats?.totalLogs ?? 0 },
              { label: '动作条目', value: stats?.totalEntries ?? 0 },
              { label: '连续打卡', value: `${stats?.streak ?? 0} 天` },
              { label: '近 30 天', value: `${stats?.activeDays30 ?? 0} 天` },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-slate-200 p-3">
                <div className="text-xl font-semibold text-slate-800">{c.value}</div>
                <div className="mt-0.5 text-xs text-slate-500">{c.label}</div>
              </div>
            ))}
          </div>

          {/* 档案 */}
          <section className="rounded-xl border border-slate-200 p-4">
            <div className="mb-2 text-sm font-semibold text-slate-800">训练档案</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-semibold text-slate-500">训练经验</div>
                <div className="flex gap-1.5">
                  {Object.entries(EXPERIENCE_CN).map(([k, cn]) => (
                    <button
                      key={k}
                      onClick={async () => {
                        const r = await authApi.updateProfile({ experience: k as never });
                        patchUser(r.user);
                      }}
                      className={[
                        'rounded-lg border px-2.5 py-1 text-xs',
                        user?.experience === k
                          ? 'border-teal-500 bg-teal-500 text-white'
                          : 'border-slate-200 text-slate-600 hover:border-teal-300',
                      ].join(' ')}
                    >
                      {cn}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>可用器械</span>
                  {equipmentDirty && (
                    <button
                      onClick={async () => {
                        const r = await authApi.updateProfile({ equipment });
                        patchUser(r.user);
                      }}
                      className="rounded bg-teal-600 px-2 py-0.5 text-[11px] text-white hover:bg-teal-700"
                    >
                      保存
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {EQUIPMENT_OPTIONS.map((e) => {
                    const on = equipment.includes(e);
                    return (
                      <button
                        key={e}
                        onClick={() =>
                          setEquipment((prev) => (on ? prev.filter((x) => x !== e) : [...prev, e]))
                        }
                        className={[
                          'rounded border px-1.5 py-0.5 text-[11px]',
                          on
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-slate-200 text-slate-600',
                        ].join(' ')}
                      >
                        {EQUIPMENT_CN[e] ?? e}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* 收藏 */}
          <section className="rounded-xl border border-slate-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">
                我的收藏（{fav.items.length}）
              </div>
            </div>
            {fav.isLoading && <div className="text-xs text-slate-400">加载中…</div>}
            {!fav.isLoading && fav.items.length === 0 && (
              <div className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
                还没有收藏。在肌肉详情页点「收藏」即可保存，下次直接打开。
              </div>
            )}
            <div className="space-y-1.5">
              {fav.items.map((f) => {
                const href = favHref(f);
                return (
                  <div
                    key={f.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2"
                  >
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                      {TARGET_CN[f.target_type] ?? f.target_type}
                    </span>
                    <div className="min-w-0 flex-1">
                      {href ? (
                        <Link to={href} className="block truncate text-sm text-slate-800 hover:text-teal-700">
                          {f.title || f.target_id}
                        </Link>
                      ) : (
                        <div className="truncate text-sm text-slate-800">{f.title || f.target_id}</div>
                      )}
                      {f.subtitle && (
                        <div className="truncate text-[11px] text-slate-400">{f.subtitle}</div>
                      )}
                    </div>
                    <button
                      onClick={() => fav.remove.mutate({ targetType: f.target_type, targetId: f.target_id })}
                      className="shrink-0 rounded px-2 py-1 text-[11px] text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      移除
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 训练记录 */}
          <section className="rounded-xl border border-slate-200 p-4">
            <div className="mb-2 text-sm font-semibold text-slate-800">
              训练记录（{workouts.items.length}）
            </div>
            {workouts.isLoading && <div className="text-xs text-slate-400">加载中…</div>}
            {!workouts.isLoading && workouts.items.length === 0 && (
              <div className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
                还没有训练记录。在肌肉详情页底部可以「记一次训练」。
              </div>
            )}
            <div className="space-y-2">
              {workouts.items.map((w) => (
                <div key={w.id} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-600">{fmtDate(w.done_at)}</div>
                    <button
                      onClick={() => {
                        if (confirm('删除这条训练记录？')) workouts.remove.mutate(w.id);
                      }}
                      className="rounded px-2 py-0.5 text-[11px] text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      删除
                    </button>
                  </div>
                  {w.note && <div className="mt-1 text-xs text-slate-500">{w.note}</div>}
                  <div className="mt-1.5 space-y-1">
                    {w.entries.map((e) => (
                      <div key={e.id} className="flex items-baseline gap-2 text-xs">
                        <span className="text-slate-700">{e.exercise_name}</span>
                        {(e.sets || e.reps) && (
                          <span className="text-slate-400">
                            {e.sets ? `${e.sets} 组` : ''}
                            {e.sets && e.reps ? ' × ' : ''}
                            {e.reps || ''}
                          </span>
                        )}
                        {e.weight && <span className="text-slate-400">{e.weight}</span>}
                        {e.feel != null && <span className="text-amber-600">感受 {e.feel}/5</span>}
                      </div>
                    ))}
                    {w.entries.length === 0 && (
                      <div className="text-[11px] text-slate-400">（没有记录具体动作）</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 数据导出 */}
          <section className="rounded-xl border border-slate-200 p-4">
            <div className="mb-2 text-sm font-semibold text-slate-800">我的数据</div>
            <p className="text-xs leading-relaxed text-slate-500">
              收藏与训练记录保存在服务器上。数据库跟着应用实例走，虽然常规更新不会清除，
              但没有额外的异地备份——建议每隔一段时间导出一份留底。
              导出的 JSON 含档案、收藏和全部训练记录，是明文格式，可自行保存或迁移。
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={onExport}
                disabled={exporting}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-teal-500 hover:text-teal-700 disabled:opacity-50"
              >
                {exporting ? '导出中…' : '导出全部数据（JSON）'}
              </button>
              {exportMsg && <span className="text-[11px] text-slate-500">{exportMsg}</span>}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
