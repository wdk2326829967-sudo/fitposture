import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Scene from '@/three/Scene';
import ExerciseCard from '@/components/ExerciseCard';
import FavoriteButton from '@/components/FavoriteButton';
import Header from '@/components/Header';
import { useSelection } from '@/store/useSelection';
import { getPosture, POSTURE_CATEGORY_CN } from '@/kb/postures';
import { symptomsByPosture } from '@/kb/symptoms';
import { muscleCn } from '@/kb/mesh/registry';
import { EXERCISES } from '@/kb/exercises';
import type { Exercise } from '@/kb/types';

/** 与 AnatomyModel 里的 COLOR 保持一致，图例才不会和模型上的颜色对不上 */
const TIGHT_COLOR = '#ff7043';
const WEAK_COLOR = '#42a5f5';

const STEP_GROUPS: { key: 'relax' | 'stretch' | 'activate' | 'strengthen'; title: string; hint: string; color: string }[] = [
  { key: 'relax', title: '① 放松', hint: '先把长期缩短的组织松开', color: 'text-emerald-700' },
  { key: 'stretch', title: '② 拉伸', hint: '恢复被限制的活动范围', color: 'text-sky-700' },
  { key: 'activate', title: '③ 激活', hint: '唤醒被抑制的无力肌', color: 'text-amber-700' },
  { key: 'strengthen', title: '④ 强化', hint: '把新的体位稳住', color: 'text-rose-700' },
];

export default function PostureDetail() {
  const { id } = useParams();
  const posture = id ? getPosture(id) : undefined;

  const setPostureHighlight = useSelection((s) => s.setPostureHighlight);
  const clearPostureHighlight = useSelection((s) => s.clearPostureHighlight);

  // 进入即点亮双色高亮；离开页面必须清掉，否则回到首页肌肉还是红的
  useEffect(() => {
    if (!posture) return;
    setPostureHighlight(posture.tight, posture.weak);
    return () => clearPostureHighlight();
  }, [posture, setPostureHighlight, clearPostureHighlight]);

  if (!posture) {
    return (
      <div className="flex h-full flex-col">
        <Header />
        <main className="flex min-h-0 flex-1 items-center justify-center px-6">
          <div className="text-center">
            <p className="mb-2 text-slate-600">没有找到这个体态问题。</p>
            <Link to="/posture" className="text-sm text-teal-600 hover:underline">
              ← 回到体态问题库
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const pick = (ids: string[] | undefined): Exercise[] =>
    (ids ?? []).map((x) => EXERCISES[x]).filter((e): e is Exercise => !!e);

  const groups = STEP_GROUPS.map((g) => ({ ...g, list: pick(posture.plan[g.key]) })).filter(
    (g) => g.list.length > 0,
  );

  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="relative h-[42vh] min-h-0 shrink-0 md:h-auto md:flex-1">
          <Scene />
          <div className="pointer-events-none absolute left-3 top-3 space-y-1 rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] leading-tight text-slate-600 shadow">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: TIGHT_COLOR }} />
              紧张肌 · 需要放松与拉伸
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: WEAK_COLOR }} />
              无力肌 · 需要激活与强化
            </div>
          </div>
        </div>

        <aside className="min-h-0 w-full flex-1 overflow-y-auto border-t border-slate-200 bg-white md:w-[440px] md:flex-none md:border-l md:border-t-0">
          <div className="space-y-5 p-4">
            <div>
              <Link to="/posture" className="text-xs text-teal-600 hover:underline">
                ← 体态问题库
              </Link>
              <div className="mt-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-slate-900">{posture.cn}</h2>
                  <div className="text-xs text-slate-500">{posture.en}</div>
                  <div className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                    {POSTURE_CATEGORY_CN[posture.category]}
                  </div>
                </div>
                <FavoriteButton
                  targetType="posture"
                  targetId={posture.id}
                  title={posture.cn}
                  subtitle={POSTURE_CATEGORY_CN[posture.category]}
                />
              </div>
            </div>

            <section>
              <div className="mb-1 text-sm font-semibold text-slate-800">这是什么</div>
              <p className="text-xs leading-relaxed text-slate-600">{posture.description}</p>
            </section>

            <section>
              <div className="mb-1 text-sm font-semibold text-slate-800">紧张与无力</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border p-2.5" style={{ borderColor: `${TIGHT_COLOR}55` }}>
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium" style={{ color: TIGHT_COLOR }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: TIGHT_COLOR }} />
                    紧张（缩短）
                  </div>
                  <div className="space-y-0.5">
                    {posture.tight.map((m) => (
                      <Link
                        key={m}
                        to={`/muscle/${m}`}
                        className="block text-xs text-slate-700 hover:text-teal-700 hover:underline"
                      >
                        {muscleCn(m)}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border p-2.5" style={{ borderColor: `${WEAK_COLOR}55` }}>
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium" style={{ color: WEAK_COLOR }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: WEAK_COLOR }} />
                    无力（拉长）
                  </div>
                  <div className="space-y-0.5">
                    {posture.weak.map((m) => (
                      <Link
                        key={m}
                        to={`/muscle/${m}`}
                        className="block text-xs text-slate-700 hover:text-teal-700 hover:underline"
                      >
                        {muscleCn(m)}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                点肌肉名可跳到该肌肉的解剖与训练详情。
              </p>
            </section>

            <section>
              <div className="mb-1.5 text-sm font-semibold text-slate-800">怎么自测</div>
              <p className="mb-2 text-xs leading-relaxed text-slate-600">{posture.howToSelfCheck}</p>
              {posture.selfTest.map((t) => (
                <div key={t.id} className="rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800">{t.name}</span>
                    {t.needsPartner && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                        需要他人协助
                      </span>
                    )}
                  </div>
                  <ol className="mt-1.5 space-y-1">
                    {t.steps.map((s, i) => (
                      <li key={i} className="flex gap-1.5 text-[11px] leading-relaxed text-slate-600">
                        <span className="shrink-0 text-slate-400">{i + 1}.</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-2 space-y-1 border-t border-slate-200 pt-2 text-[11px]">
                    <div className="text-slate-500">看哪里：{t.whatToLook}</div>
                    <div className="text-emerald-700">正常：{t.normal}</div>
                    <div className="text-rose-700">异常：{t.abnormal}</div>
                    {t.threshold && <div className="text-slate-500">参考界值：{t.threshold}</div>}
                  </div>
                </div>
              ))}
            </section>

            <section>
              <div className="mb-2 text-sm font-semibold text-slate-800">矫正方案</div>
              <p className="mb-3 rounded-lg bg-teal-50 p-2.5 text-[11px] leading-relaxed text-teal-800">
                顺序是有讲究的：先放松、再拉伸，把受限的组织松开；然后激活无力的肌肉，
                最后才是强化。跳过前面两步直接练力量，往往练到的还是原本就紧张的那一侧。
              </p>
              <div className="space-y-4">
                {groups.map((g) => (
                  <div key={g.key}>
                    <div className="mb-1.5 flex items-baseline gap-2">
                      <span className={`text-xs font-semibold ${g.color}`}>{g.title}</span>
                      <span className="text-[11px] text-slate-400">{g.hint}</span>
                    </div>
                    <div className="space-y-2">
                      {g.list.map((ex) => (
                        <ExerciseCard key={ex.id} ex={ex} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {symptomsByPosture(posture.id).length > 0 && (
              <section>
                <div className="mb-1.5 text-sm font-semibold text-slate-800">
                  它可能表现为这些不适
                </div>
                <div className="space-y-1.5">
                  {symptomsByPosture(posture.id).map((s) => (
                    <Link
                      key={s.id}
                      to={`/symptoms/${s.id}`}
                      className="block rounded-lg border border-slate-200 bg-white p-2.5 transition hover:border-teal-300"
                    >
                      <div className="text-xs font-semibold text-slate-900">{s.cn}</div>
                      <div className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                        {s.summary}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {posture.cautions?.length ? (
              <section>
                <div className="mb-1 text-sm font-semibold text-slate-800">注意</div>
                <ul className="space-y-1">
                  {posture.cautions.map((c, i) => (
                    <li key={i} className="flex gap-1.5 text-[11px] leading-relaxed text-slate-500">
                      <span className="text-slate-400">·</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
