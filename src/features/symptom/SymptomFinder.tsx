import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  SYMPTOMS,
  SYMPTOM_REGION_CN,
  SYMPTOM_REGION_ORDER,
  searchSymptoms,
} from '@/kb/symptoms';
import { muscleCn } from '@/kb/mesh/registry';
import type { MuscleState, Symptom } from '@/kb/types';

const STATE_STYLE: Record<MuscleState, { bg: string; fg: string; label: string }> = {
  tight: { bg: '#ff704322', fg: '#c2410c', label: '紧张' },
  weak: { bg: '#42a5f522', fg: '#1d4ed8', label: '无力' },
  overworked: { bg: '#f59e0b22', fg: '#b45309', label: '劳损' },
};

export default function SymptomFinder() {
  const [q, setQ] = useState('');
  const [region, setRegion] = useState<Symptom['region'] | 'all'>('all');

  const matched = useMemo(() => searchSymptoms(q, muscleCn), [q]);
  const shown = useMemo(
    () => (region === 'all' ? matched : matched.filter((s) => s.region === region)),
    [matched, region],
  );

  const groups = SYMPTOM_REGION_ORDER.map((r) => ({
    region: r,
    items: shown.filter((s) => s.region === r),
  })).filter((g) => g.items.length > 0);

  const total = Object.keys(SYMPTOMS).length;

  return (
    <>
      <Header />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-5 py-8">
          <h1 className="text-2xl font-semibold text-slate-900">症状反查</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            不知道该练哪块肌肉，只知道哪儿不舒服——从这里开始。描述你的感觉，
            反查出可能涉及的肌肉、相关的体态问题，以及当下该做什么、不该做什么。
            共收录 {total} 个常见症状。
          </p>

          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
            <span className="font-semibold">先说清楚：</span>
            这里是健身科普，不是诊断。若出现
            <span className="font-medium">外伤后剧痛、肢体麻木无力、大小便异常、夜间痛醒伴发热或体重下降</span>
            等情况，请直接就医，不要先练。
          </div>

          {/* 搜索 + 部位筛选 */}
          <div className="mt-5">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="描述你的感觉，例如：脖子酸、下楼梯膝盖痛、足跟痛"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-teal-400"
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                onClick={() => setRegion('all')}
                className={[
                  'rounded-lg border px-2.5 py-1 text-xs transition',
                  region === 'all'
                    ? 'border-teal-500 bg-teal-500 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-teal-50',
                ].join(' ')}
              >
                全部
              </button>
              {SYMPTOM_REGION_ORDER.map((r) => (
                <button
                  key={r}
                  onClick={() => setRegion(region === r ? 'all' : r)}
                  className={[
                    'rounded-lg border px-2.5 py-1 text-xs transition',
                    region === r
                      ? 'border-teal-500 bg-teal-500 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-teal-50',
                  ].join(' ')}
                >
                  {SYMPTOM_REGION_CN[r]}
                </button>
              ))}
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <p className="text-sm text-slate-600">没有匹配的描述。</p>
              <p className="mt-1 text-xs text-slate-400">
                试试更口语的说法，例如「腰酸」「崴脚」「鼠标手」；或者直接按上面的部位浏览。
              </p>
              <button
                onClick={() => {
                  setQ('');
                  setRegion('all');
                }}
                className="mt-3 rounded-lg bg-teal-600 px-3 py-1.5 text-xs text-white hover:bg-teal-700"
              >
                看全部症状
              </button>
            </div>
          ) : (
            <div className="mt-7 space-y-7">
              {groups.map((g) => (
                <section key={g.region}>
                  <h2 className="mb-2.5 text-sm font-semibold text-slate-500">
                    {SYMPTOM_REGION_CN[g.region]}
                    <span className="ml-1.5 font-normal text-slate-400">{g.items.length}</span>
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {g.items.map((s) => (
                      <Link
                        key={s.id}
                        to={`/symptoms/${s.id}`}
                        className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:border-teal-300 hover:shadow-sm"
                      >
                        <div className="text-sm font-semibold text-slate-900 group-hover:text-teal-700">
                          {s.cn}
                        </div>
                        <p className="mt-1.5 line-clamp-3 flex-1 text-xs leading-relaxed text-slate-600">
                          {s.summary}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {s.causes.slice(0, 4).map((c) => {
                            const st = STATE_STYLE[c.state];
                            return (
                              <span
                                key={c.muscle}
                                className="rounded px-1.5 py-0.5 text-[10px]"
                                style={{ background: st.bg, color: st.fg }}
                                title={`${st.label} · ${c.why}`}
                              >
                                {muscleCn(c.muscle)}
                              </span>
                            );
                          })}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          <p className="mt-8 text-[11px] leading-relaxed text-slate-400">
            每个条目都会说明：可能是哪些肌肉、怎么判断是不是它、急性期该做什么与不该做什么，
            以及哪些情况必须就医。内容均为健身科普，不构成医疗建议。
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
