import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ExerciseCard from '@/components/ExerciseCard';
import FavoriteButton from '@/components/FavoriteButton';
import { getSymptom, SYMPTOM_REGION_CN, MUSCLE_STATE_CN, CAUSE_ROLE_CN } from '@/kb/symptoms';
import { muscleCn } from '@/kb/mesh/registry';
import { getPosture, POSTURE_CATEGORY_CN } from '@/kb/postures';
import { EXERCISES } from '@/kb/exercises';
import type { Exercise, MuscleState } from '@/kb/types';

const STATE_STYLE: Record<MuscleState, { bg: string; fg: string }> = {
  tight: { bg: '#ff704322', fg: '#c2410c' },
  weak: { bg: '#42a5f522', fg: '#1d4ed8' },
  overworked: { bg: '#f59e0b22', fg: '#b45309' },
};

const STEP_GROUPS: {
  key: 'relax' | 'stretch' | 'activate' | 'strengthen';
  title: string;
  hint: string;
  color: string;
}[] = [
  { key: 'relax', title: '① 放松', hint: '先把持续收缩的组织松开', color: 'text-emerald-700' },
  { key: 'stretch', title: '② 拉伸', hint: '恢复被限制的活动范围', color: 'text-sky-700' },
  { key: 'activate', title: '③ 激活', hint: '唤醒失活的肌肉', color: 'text-amber-700' },
  { key: 'strengthen', title: '④ 强化', hint: '把新的控制稳住', color: 'text-rose-700' },
];

const DURATION_OPTIONS: { value: 'today' | 'within72h' | 'within2w' | 'over2w'; label: string }[] = [
  { value: 'today', label: '今天刚出现' },
  { value: 'within72h', label: '两三天内' },
  { value: 'within2w', label: '两周内' },
  { value: 'over2w', label: '超过两周' },
];

const PAIN_LEVEL_CN = ['不痛', '轻微', '有点痛', '明显痛', '很痛', '剧痛'];

export default function SymptomDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const symptom = getSymptom(id);

  // 分诊：先判断该不该练，再谈怎么练
  const [duration, setDuration] = useState<'today' | 'within72h' | 'within2w' | 'over2w'>('within2w');
  const [pain, setPain] = useState(2);
  const [trauma, setTrauma] = useState(false);

  const pick = (ids: string[] | undefined): Exercise[] =>
    (ids ?? []).map((x) => EXERCISES[x]).filter((e): e is Exercise => !!e);

  const groups = useMemo(
    () =>
      symptom
        ? STEP_GROUPS.map((g) => ({ ...g, list: pick(symptom.plan[g.key]) })).filter(
            (g) => g.list.length > 0,
          )
        : [],
    [symptom],
  );

  if (!symptom) {
    return (
      <div className="flex h-full flex-col">
        <Header />
        <main className="flex min-h-0 flex-1 items-center justify-center px-6">
          <div className="text-center">
            <p className="mb-2 text-slate-600">没有找到这个症状。</p>
            <Link to="/symptoms" className="text-sm text-teal-600 hover:underline">
              ← 回到症状反查
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isAcute = trauma || duration === 'today' || duration === 'within72h';
  const mustSeeDoctor = trauma || pain >= 5 || (pain >= 4 && isAcute);
  const muscleIds = symptom.causes.map((c) => c.muscle);

  return (
    <div className="flex h-full flex-col">
      <Header />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-5 py-8">
          <Link to="/symptoms" className="text-xs text-teal-600 hover:underline">
            ← 症状反查
          </Link>

          <div className="mt-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-slate-900">{symptom.cn}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                  {SYMPTOM_REGION_CN[symptom.region]}
                </span>
                {symptom.aliases.slice(0, 4).map((a) => (
                  <span key={a} className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400">
                    {a}
                  </span>
                ))}
              </div>
            </div>
            <FavoriteButton
              targetType="symptom"
              targetId={symptom.id}
              title={symptom.cn}
              subtitle={SYMPTOM_REGION_CN[symptom.region]}
            />
          </div>

          {/* ── 分诊器：先判断该不该练 ── */}
          <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-xs font-semibold text-slate-700">
              先分诊：告诉我现在的情况，我来判断该先看医生还是可以直接练
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-[11px] text-slate-500">疼了多久</div>
                <div className="flex flex-wrap gap-1">
                  {DURATION_OPTIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDuration(d.value)}
                      className={[
                        'rounded-lg border px-2 py-1 text-[11px] transition',
                        duration === d.value
                          ? 'border-teal-500 bg-teal-500 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300',
                      ].join(' ')}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>疼痛程度</span>
                  <span className="font-medium text-slate-700">
                    {pain} / 5 · {PAIN_LEVEL_CN[pain]}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={1}
                  value={pain}
                  onChange={(e) => setPain(Number(e.target.value))}
                  className="w-full"
                />
                <label className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={trauma}
                    onChange={(e) => setTrauma(e.target.checked)}
                    className="h-3.5 w-3.5"
                  />
                  有明确外伤（摔倒、撞击、扭伤）
                </label>
              </div>
            </div>

            {mustSeeDoctor ? (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-[11px] leading-relaxed text-rose-800">
                <div className="font-semibold">建议先就医，暂时不要自行训练。</div>
                {trauma
                  ? '有明确外伤史时，需要先排除骨折、韧带撕裂等结构性问题。下面的方案请在医生或治疗师确认后再开始。'
                  : '疼痛程度较高且处于急性期，先让专业人员评估，避免把可自愈的劳损练成真正的损伤。'}
              </div>
            ) : isAcute ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] leading-relaxed text-amber-800">
                <div className="font-semibold">现在处于急性期，先按「该做什么 / 别做什么」处理。</div>
                48-72 小时后再进入下面的放松与激活；拉伸和强化今天先别碰。
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50 p-2.5 text-[11px] leading-relaxed text-teal-800">
                没有危险信号，可以按下面的方案循序渐进地练。过程中疼痛加重就退回上一步。
              </div>
            )}
          </section>

          {/* ── 这是什么 ── */}
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-slate-800">这是什么</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{symptom.summary}</p>
            <p className="mt-2 rounded-lg bg-slate-50 p-2.5 text-[11px] leading-relaxed text-slate-500">
              <span className="font-medium text-slate-600">常见人群 / 场景：</span>
              {symptom.typical}
            </p>
          </section>

          {/* ── 可能相关的肌肉 ── */}
          <section className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-800">
                可能相关的肌肉（{symptom.causes.length}）
              </h2>
              <button
                onClick={() => navigate(`/?symptom=${symptom.id}`)}
                className="rounded-lg bg-teal-600 px-2.5 py-1 text-[11px] text-white hover:bg-teal-700"
              >
                在 3D 人体上点亮这 {muscleIds.length} 块
              </button>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              罗列多块肌肉没有意义，关键是区分。每条都给了「怎么判断就是它」。
            </p>
            <div className="mt-2 space-y-2">
              {symptom.causes.map((c) => {
                const st = STATE_STYLE[c.state];
                return (
                  <div key={c.muscle} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link
                        to={`/muscle/${c.muscle}`}
                        className="text-sm font-semibold text-slate-900 hover:text-teal-700 hover:underline"
                      >
                        {muscleCn(c.muscle)}
                      </Link>
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px]"
                        style={{ background: st.bg, color: st.fg }}
                      >
                        {MUSCLE_STATE_CN[c.state]}
                      </span>
                      <span
                        className={[
                          'rounded px-1.5 py-0.5 text-[10px]',
                          c.role === 'primary'
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-500',
                        ].join(' ')}
                      >
                        {CAUSE_ROLE_CN[c.role]}
                      </span>
                    </div>
                    <div className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                      <span className="font-medium text-slate-700">为什么是它：</span>
                      {c.why}
                    </div>
                    <div className="mt-1 rounded-lg bg-slate-50 p-2 text-[11px] leading-relaxed text-slate-600">
                      <span className="font-medium text-slate-700">怎么判断：</span>
                      {c.tell}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── 30 秒自测 ── */}
          {symptom.quickChecks.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold text-slate-800">30 秒自测：到底是哪一种</h2>
              <div className="mt-2 space-y-2">
                {symptom.quickChecks.map((t) => (
                  <div key={t.id} className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-800">{t.name}</div>
                    <ol className="mt-1.5 space-y-1">
                      {t.steps.map((s, i) => (
                        <li key={i} className="flex gap-1.5 text-[11px] leading-relaxed text-slate-600">
                          <span className="shrink-0 text-slate-400">{i + 1}.</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-2 border-t border-slate-200 pt-2 text-[11px] leading-relaxed text-teal-800">
                      结果怎么读：{t.meaning}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 相关体态问题 ── */}
          {symptom.postures.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold text-slate-800">相关的体态问题</h2>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {symptom.postures.map((pid) => {
                  const p = getPosture(pid);
                  if (!p) return null;
                  return (
                    <Link
                      key={pid}
                      to={`/posture/${pid}`}
                      className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-teal-300"
                    >
                      <div className="text-xs font-semibold text-slate-900">{p.cn}</div>
                      <div className="mt-0.5 text-[10px] text-slate-400">
                        {POSTURE_CATEGORY_CN[p.category]}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── 急性期：该做什么 / 别做什么 ── */}
          <section className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <div className="mb-1.5 text-xs font-semibold text-emerald-800">
                {isAcute ? '现在就该做的事' : '发作时的处理'}
              </div>
              <ul className="space-y-1">
                {symptom.acute.map((a, i) => (
                  <li key={i} className="flex gap-1.5 text-[11px] leading-relaxed text-emerald-900">
                    <span className="shrink-0 text-emerald-500">·</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
              <div className="mb-1.5 text-xs font-semibold text-rose-800">这段时间别做</div>
              <ul className="space-y-1">
                {symptom.avoid.map((a, i) => (
                  <li key={i} className="flex gap-1.5 text-[11px] leading-relaxed text-rose-900">
                    <span className="shrink-0 text-rose-400">·</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ── 方案 ── */}
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-slate-800">
              {isAcute ? '急性期过后的方案' : '改善方案'}
            </h2>
            {isAcute && (
              <p className="mt-1 rounded-lg bg-slate-50 p-2 text-[11px] leading-relaxed text-slate-500">
                急性期（约 48-72 小时）内先只做上面「该做的事」。下面的放松与激活可以在疼痛下降后开始，
                拉伸与强化等急性期过后再加。
              </p>
            )}
            <div className="mt-3 space-y-4">
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

          {/* ── 生活调整 ── */}
          {symptom.dailyTips.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold text-slate-800">生活与工位调整</h2>
              <p className="mt-1 text-[11px] text-slate-400">
                这部分往往比练十分钟更管用——几周下来效果差别很大。
              </p>
              <ul className="mt-2 space-y-1.5">
                {symptom.dailyTips.map((t, i) => (
                  <li key={i} className="flex gap-1.5 text-[11px] leading-relaxed text-slate-600">
                    <span className="shrink-0 text-teal-500">·</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── 危险信号 ── */}
          <section className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-3">
            <div className="mb-1.5 text-xs font-semibold text-rose-800">
              出现以下任一情况，请就医而不是先练
            </div>
            <ul className="space-y-1">
              {symptom.redFlags.map((r, i) => (
                <li key={i} className="flex gap-1.5 text-[11px] leading-relaxed text-rose-900">
                  <span className="shrink-0 text-rose-400">!</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 border-t border-rose-200 pt-2 text-[11px] leading-relaxed text-rose-800">
              {symptom.seeDoctor}
            </div>
          </section>

          <p className="mt-5 text-[11px] leading-relaxed text-slate-400">
            {symptom.disclaimer}
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
