// 全模型扫描：找出「顶点法线方向」与「三角形绕序推出的几何法线方向」不一致的网格
// dot(几何法线, 顶点法线) < 0  →  法线朝内（被错误取反）→ 渲染时明暗失真
import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import * as THREE from 'three';

const io = new NodeIO()
  .registerExtensions([KHRDracoMeshCompression])
  .registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });

const doc = await io.read('public/models/anatomy.glb');
const root = doc.getRoot();

function check(pos, nor, idx) {
  const p = pos.getArray();
  const n = nor.getArray();
  const index = idx ? idx.getArray() : null;
  const triCount = index ? index.length / 3 : pos.getCount() / 3;
  const step = Math.max(1, Math.floor(triCount / 400));
  let sum = 0;
  let cnt = 0;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const fn = new THREE.Vector3();
  for (let t = 0; t < triCount; t += step) {
    const i0 = index ? index[t * 3] : t * 3;
    const i1 = index ? index[t * 3 + 1] : t * 3 + 1;
    const i2 = index ? index[t * 3 + 2] : t * 3 + 2;
    a.fromArray(p, i0 * 3);
    b.fromArray(p, i1 * 3);
    c.fromArray(p, i2 * 3);
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    fn.crossVectors(ab, ac);
    if (fn.lengthSq() < 1e-12) continue;
    fn.normalize();
    const vn = new THREE.Vector3(
      n[i0 * 3] + n[i1 * 3] + n[i2 * 3],
      n[i0 * 3 + 1] + n[i1 * 3 + 1] + n[i2 * 3 + 1],
      n[i0 * 3 + 2] + n[i1 * 3 + 2] + n[i2 * 3 + 2],
    );
    if (vn.lengthSq() < 1e-12) continue;
    vn.normalize();
    sum += fn.dot(vn);
    cnt++;
  }
  return cnt ? sum / cnt : NaN;
}

const bad = [];
const ok = [];
for (const node of root.listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION');
    const nor = prim.getAttribute('NORMAL');
    if (!pos || !nor) continue;
    const d = check(pos, nor, prim.getIndices());
    if (!isFinite(d)) continue;
    const rec = { name: node.getName(), dot: +d.toFixed(3), verts: pos.getCount() };
    if (d < 0.15) bad.push(rec);
    else ok.push(rec);
  }
}

bad.sort((x, y) => x.dot - y.dot);
console.log('网格总数:', ok.length + bad.length);
console.log('绕序与法线不一致（dot<0.15）:', bad.length);
for (const r of bad.slice(0, 40)) console.log(`  ${r.dot.toFixed(3)}\t${r.verts}\t${r.name}`);
console.log('\n一致网格的 dot 分布示例（前 5）:', ok.slice(0, 5).map((r) => r.dot).join(', '));
