/**
 * 05 - 诊断：确认模型的坐标轴朝向与上下方向（避免加载后人体是躺着的）
 */
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(resolve(root, 'src/kb/mesh/meshManifest.json'), 'utf8'));

const min = [Infinity, Infinity, Infinity];
const max = [-Infinity, -Infinity, -Infinity];
for (const it of manifest.items) {
  if (!it.bbox) continue;
  for (let i = 0; i < 3; i++) {
    min[i] = Math.min(min[i], it.bbox.min[i]);
    max[i] = Math.max(max[i], it.bbox.max[i]);
  }
}
const size = [0, 1, 2].map((i) => max[i] - min[i]);

console.log('全局 bbox min :', min.map((v) => v.toFixed(1)).join(', '));
console.log('全局 bbox max :', max.map((v) => v.toFixed(1)).join(', '));
console.log('各轴跨度       : X=' + size[0].toFixed(1) + '  Y=' + size[1].toFixed(1) + '  Z=' + size[2].toFixed(1));

const longest = size.indexOf(Math.max(...size));
console.log(
  '最长轴         : ' +
    ['X', 'Y', 'Z'][longest] +
    (longest === 1 ? '  → Y-up，人体直立，无需旋转 ✓' : '  → 非 Y-up，需要在 AnatomyModel 里加旋转！'),
);

const probe = (kw) => {
  const hits = manifest.items.filter((i) => i.name.toLowerCase().includes(kw) && i.bbox);
  if (!hits.length) return null;
  const c = [0, 0, 0];
  for (const h of hits) for (let i = 0; i < 3; i++) c[i] += (h.bbox.min[i] + h.bbox.max[i]) / 2;
  return { n: hits.length, c: c.map((v) => v / hits.length) };
};

console.log('\n上下方向抽样（沿最长轴的坐标，值越大越靠上）:');
const axis = longest;
for (const kw of ['trapezius', 'deltoid', 'rectus abdominis', 'gluteus maximus', 'gastrocnemius', 'soleus']) {
  const p = probe(kw);
  if (p) console.log(`  ${kw.padEnd(20)} n=${String(p.n).padStart(2)}  ${['X', 'Y', 'Z'][axis]}=${p.c[axis].toFixed(1)}`);
}
