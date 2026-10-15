import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Scene from '@/three/Scene';
import ExerciseCard from '@/components/ExerciseCard';
import PartPlanView from '@/components/PartPlanView';
import FavoriteButton from '@/components/FavoriteButton';
import LogWorkoutPanel from '@/components/LogWorkoutPanel';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useSelection } from '@/store/useSelection';
import { getMuscle } from '@/kb/muscles';
import { MUSCLE_META, REGION_CN } from '@/kb/mesh/registry';
import { PROBLEM_CN, PROBLEM_ORDER, availableProblems, buildSolution } from '@/kb/engine';
import { symptomsByMuscle } from '@/kb/symptoms';
import { EQUIPMENT_CN } from '@/kb/exercises';
import { getPart, listParts, partColor } from '@/kb/subparts';
import type { Equipment, Exercise, ProblemType } from '@/kb/types';

const EQUIPMENT_OPTIONS: Equipment[] = ['none', 'dumbbell', 'barbell', 'machine', 'cable', 'band'];

export default function MuscleDetail() {
  const { id = '', part } = useParams();
  const muscle = getMuscle(id);
  const meta = MUSCLE_META[id];
  const parts = useMemo(() => listParts(id), [id]);
  const activePart = useMemo(
    () => (part ? getPart(`${id}:${part}`) : undefined),
    [id, part],
  );

  // 进入页面时同步 3D 模型：整块选中 / 带亚部参数时展开到亚部
  useEffect(() => {
    const s = useSelection.getState();
    if (part) {
      s.select(id);
      s.setExpanded(id);
      s.selectPart(`${id}:${part}`);
    } else {
      s.select(id);
    }
  }, [id, part]);

  // 亚部视图完全由「亚部方案 + 肌群恢复动作」驱动，六类问题都有内容；
  // 整块肌群则只列出已录入专属方案的问题类型。
  const problems = useMemo(
    () => (activePart ? PROBLEM_ORDER : availableProblems(id)),
    [id, activePart],
  );
  const [problemType, setProblemType] = useState<ProblemType>('hypertrophy');
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [equipment, setEquipment] = useState<Equipment[]>([]);


  useEffect(() => {
    if (problems.length && !problems.includes(problemType)) setProblemType(problems[0]);
  }, [problems, problemType]);

  const built = useMemo(
    () => buildSolution(id, problemType, { experience, equipment }),
    [id, problemType, experience, equipment],
  );

  if (!muscle || !meta) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-slate-600">这块肌肉的资料还在录入中。</p>
          <Link to="/" className="text-teal-600 hover:underline">
            ← 回到 3D 人体
          </Link>
        </div>
      </div>
    );
  }

  const groups: { title: string; list: Exercise[]; color: string }[] = built
    ? [
        { title: '放松', list: built.relax, color: 'text-emerald-700' },
        { title: '拉伸', list: built.stretch, color: 'text-sky-700' },
        { title: '激活', list: built.activate, color: 'text-amber-700' },
        { title: '强化', list: built.strengthen, color: 'text-rose-700' },
      ].filter((g) => g.list.length > 0)
    : [];

  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="h-[42vh] min-h-0 shrink-0 md:h-auto md:flex-1">
          <Scene />
        </div>

      <aside className="min-h-0 w-full flex-1 overflow-y-auto border-t border-slate-200 bg-white md:w-[420px] md:flex-none md:border-l md:border-t-0">
        <div className="p-4">
          <Link to="/" className="text-xs text-teal-600 hover:underline">
            ← 回到 3D 人体
          </Link>

          <div className="mt-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-slate-900">
                {activePart ? activePart.cn : meta.cn}
              </h2>
              <div className="text-xs text-slate-500">{activePart ? activePart.en : meta.en}</div>
              <div className="text-xs italic text-slate-400">
                {activePart ? `${meta.cn} · 亚部` : meta.latin}
              </div>
            </div>
            <FavoriteButton
              targetType={activePart ? 'part' : 'muscle'}
              targetId={activePart ? `${meta.id}:${part}` : meta.id}
              title={activePart ? activePart.cn : meta.cn}
              subtitle={activePart ? meta.cn : meta.en}
            />
          </div>
          <span className="mt-2 inline-block rounded-md bg-slate-900 px-2 py-0.5 text-xs text-white">
            {REGION_CN[meta.region]}
          </span>

          {/* 细分：拆到具体亚部，各自有不同的刺激方式 */}
          {parts.length > 1 && (
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>细分这块肌肉</span>
                {activePart && (
                  <Link to={`/muscle/${meta.id}`} className="font-normal text-teal-600 hover:underline">
                    ← 回到整块
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {parts.map((p) => {
                  const active = activePart?.id === p.id;
                  return (
                    <Link
                      key={p.id}
                      to={`/muscle/${meta.id}/${p.key}`}
                      title={p.note}
                      className={[
                        'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition',
                        active
                          ? 'border-teal-500 bg-teal-500 text-white'
                          : 'border-slate-200 text-slate-700 hover:border-teal-300 hover:bg-teal-50',
                      ].join(' ')}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: partColor(p) }}
                      />
                      {p.short}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* 问题类型 */}
          <div className="mt-4">
            <div className="mb-1.5 text-xs font-semibold text-slate-500">
              {activePart ? '这块亚部你想解决什么？' : '你想解决什么？'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {problems.map((p) => (
                <button
                  key={p}
                  onClick={() => setProblemType(p)}
                  className={[
                    'rounded-lg border px-2.5 py-1 text-xs transition',
                    problemType === p
                      ? 'border-teal-500 bg-teal-500 text-white'
                      : 'border-slate-200 text-slate-700 hover:border-teal-300 hover:bg-teal-50',
                  ].join(' ')}
                >
                  {PROBLEM_CN[p]}
                </button>
              ))}
            </div>
          </div>

          {activePart && (
            <div className="mt-3">
              <PartPlanView partId={activePart.id} problemType={problemType} />
            </div>
          )}

          {/* 整块肌群：用户上下文 */}
          <div className={['mt-3 grid grid-cols-2 gap-3', activePart ? 'hidden' : ''].join(' ')}>
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-500">训练经验</div>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value as typeof experience)}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
              >
                <option value="beginner">新手</option>
                <option value="intermediate">有基础</option>
                <option value="advanced">进阶</option>
              </select>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-500">可用器械</div>
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
                        on ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-600',
                      ].join(' ')}
                    >
                      {EQUIPMENT_CN[e]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 方案说明（选中亚部时由亚部视图接管，避免重复） */}
          {built && !activePart && (
            <>
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                <div className="mb-1 font-semibold text-slate-700">判断标准</div>
                {built.solution.criteria}
              </div>

              {groups.map((g) => (
                <div key={g.title} className="mt-4">
                  <div className={`mb-1.5 text-sm font-semibold ${g.color}`}>
                    {g.title}（{g.list.length}）
                  </div>
                  <div className="space-y-2">
                    {g.list.map((ex) => (
                      <ExerciseCard key={ex.id} ex={ex} />
                    ))}
                  </div>
                </div>
              ))}

              {built.solution.progression && (
                <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs leading-relaxed text-slate-700">
                  <div className="mb-1 font-semibold text-teal-800">如何进阶</div>
                  {built.solution.progression}
                </div>
              )}

              {muscle.cautions?.length ? (
                <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                  <div className="mb-1 font-semibold">特别注意</div>
                  {muscle.cautions.map((c) => (
                    <div key={c}>· {c}</div>
                  ))}
                </div>
              ) : null}
            </>
          )}

          {/* 反查：这块肌肉出问题时，通常表现为哪些不适 */}
          {symptomsByMuscle(meta.id).length > 0 && (
            <div className="mt-4">
              <div className="mb-1.5 text-xs font-semibold text-slate-500">
                这块肌肉出问题时，常见是这样
              </div>
              <div className="flex flex-wrap gap-1.5">
                {symptomsByMuscle(meta.id).map((s) => (
                  <Link
                    key={s.id}
                    to={`/symptoms/${s.id}`}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-700 transition hover:border-teal-300 hover:bg-teal-50"
                  >
                    {s.cn}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 解剖信息 */}
          <details className="mt-4 rounded-xl border border-slate-200 p-3">
            <summary className="cursor-pointer text-xs font-semibold text-slate-600">
              解剖信息（起点 / 止点 / 功能 / 神经）
            </summary>
            <dl className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-600">
              <div>
                <dt className="inline font-medium text-slate-700">起点：</dt>
                <dd className="inline">{muscle.origin}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-slate-700">止点：</dt>
                <dd className="inline">{muscle.insertion}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-slate-700">功能：</dt>
                <dd className="inline">{muscle.action}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-slate-700">神经支配：</dt>
                <dd className="inline">{muscle.nerve}</dd>
              </div>
            </dl>
          </details>

          <LogWorkoutPanel
            muscleId={meta.id}
            partId={activePart ? `${meta.id}:${part}` : null}
            problemType={problemType}
            exercises={groups.flatMap((g) => g.list)}
          />

          <div className="mt-4 rounded-xl bg-slate-100 p-3 text-[11px] leading-relaxed text-slate-500">
            {built?.solution.disclaimer ?? '以上为健身科普建议，非医疗诊断。'}
          </div>
        </div>
      </aside>
      </div>
      <Footer />
    </div>
  );
}
