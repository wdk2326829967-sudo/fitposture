import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { listPostures, POSTURE_CATEGORY_CN } from '@/kb/postures';
import { muscleCn } from '@/kb/mesh/registry';
import type { PostureIssue } from '@/kb/types';

const CATEGORY_ORDER: PostureIssue['category'][] = ['shoulder', 'spine', 'pelvis', 'lower', 'foot'];

export default function PostureLibrary() {
  const all = listPostures();
  const byCategory = CATEGORY_ORDER.map((c) => ({
    category: c,
    items: all.filter((p) => p.category === c),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <Header />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-5 py-8">
          <h1 className="text-2xl font-semibold text-slate-900">体态问题库</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            大多数体态偏差不是某块肌肉单独出了问题，而是一侧长期缩短紧张、对侧被拉长而无力，
            把骨骼拉离了中立位。所以下面每个问题都同时标注了
            <span className="mx-1 font-medium text-[#ff7043]">紧张肌</span>与
            <span className="mx-1 font-medium text-[#42a5f5]">无力肌</span>——
            选中后可在 3D 模型上双色高亮查看，并给出「放松 → 拉伸 → 激活 → 强化」的整套方案。
          </p>

          <div className="mt-6 space-y-7">
            {byCategory.map((g) => (
              <section key={g.category}>
                <h2 className="mb-2.5 text-sm font-semibold text-slate-500">
                  {POSTURE_CATEGORY_CN[g.category]}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {g.items.map((p) => (
                    <Link
                      key={p.id}
                      to={`/posture/${p.id}`}
                      className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:border-teal-300 hover:shadow-sm"
                    >
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-teal-700">
                        {p.cn}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400">{p.en}</div>
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">
                        {p.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {p.tight.slice(0, 3).map((m) => (
                          <span
                            key={m}
                            className="rounded px-1.5 py-0.5 text-[10px]"
                            style={{ background: '#ff704322', color: '#c2410c' }}
                          >
                            {muscleCn(m)}
                          </span>
                        ))}
                        {p.weak.slice(0, 2).map((m) => (
                          <span
                            key={m}
                            className="rounded px-1.5 py-0.5 text-[10px]"
                            style={{ background: '#42a5f522', color: '#1d4ed8' }}
                          >
                            {muscleCn(m)}
                          </span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-8 text-[11px] leading-relaxed text-slate-400">
            以上内容均为健身科普，不构成医疗诊断。结构性或伴随疼痛、麻木、无力的情况，
            请咨询医生或物理治疗师。
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
