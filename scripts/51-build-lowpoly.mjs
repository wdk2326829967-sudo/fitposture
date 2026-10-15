/**
 * 生成移动端低模。
 *
 * 原模型 109 万三角形 / 4.6MB，桌面 GPU 无压力，手机却会明显掉帧。
 * 这里在不改变网格划分（467 个肌群网格与节点名原样保留）的前提下降低面数，
 * 前端按屏幕宽度选择加载原版或低模。
 *
 * 用法：node scripts/51-build-lowpoly.mjs [ratio]
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, draco, prune, simplify, weld } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { MeshoptSimplifier } from 'meshoptimizer';
import { statSync, writeFileSync } from 'node:fs';

const ratio = Number(process.argv[2] ?? 0.4);
const error = Number(process.argv[3] ?? 0.001);

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});

const JOBS = [
  ['public/models/anatomy.glb', 'public/models/anatomy-low.glb'],
  ['public/models/skeleton.glb', 'public/models/skeleton-low.glb'],
];

for (const [src, out] of JOBS) {
  const before = statSync(src).size;
  const doc = await io.read(src);

  const countTris = (d) => {
    let t = 0;
    for (const m of d.getRoot().listMeshes())
      for (const p of m.listPrimitives()) {
        const i = p.getIndices();
        const pos = p.getAttribute('POSITION');
        t += i ? i.getCount() / 3 : (pos?.getCount() ?? 0) / 3;
      }
    return Math.round(t);
  };
  const trisBefore = countTris(doc);

  await doc.transform(
    weld(), // simplify 要求顶点焊接，否则边界会裂开
    simplify({ simplifier: MeshoptSimplifier, ratio, error }),
    dedup(),
    prune(),
    draco(),
  );

  const buf = await io.writeBinary(doc);
  writeFileSync(out, buf);

  const trisAfter = countTris(doc);
  console.log(
    `${out}\n  ${(before / 1048576).toFixed(2)}MB → ${(buf.byteLength / 1048576).toFixed(2)}MB ` +
      `(${((buf.byteLength / before) * 100).toFixed(0)}%) | ` +
      `面数 ${trisBefore.toLocaleString()} → ${trisAfter.toLocaleString()} (${((trisAfter / trisBefore) * 100).toFixed(0)}%)`,
  );
}
