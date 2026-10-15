// 有符号体积法判定网格是否「外翻」（inside-out）
// 封闭网格按外法线绕序时，V = (1/6)Σ a·(b×c) > 0；若 V < 0 说明面片朝向反转
import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const io = new NodeIO()
  .registerExtensions([KHRDracoMeshCompression])
  .registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });

const doc = await io.read('public/models/anatomy.glb');
const root = doc.getRoot();

function signedVolume(prim) {
  const pos = prim.getAttribute('POSITION').getArray();
  const idx = prim.getIndices();
  const n = idx ? idx.getCount() / 3 : prim.getAttribute('POSITION').getCount() / 3;
  const ia = idx ? idx.getArray() : null;
  let v = 0;
  for (let t = 0; t < n; t++) {
    const i0 = (ia ? ia[t * 3] : t * 3) * 3;
    const i1 = (ia ? ia[t * 3 + 1] : t * 3 + 1) * 3;
    const i2 = (ia ? ia[t * 3 + 2] : t * 3 + 2) * 3;
    const ax = pos[i0], ay = pos[i0 + 1], az = pos[i0 + 2];
    const bx = pos[i1], by = pos[i1 + 1], bz = pos[i1 + 2];
    const cx = pos[i2], cy = pos[i2 + 1], cz = pos[i2 + 2];
    v += ax * (by * cz - bz * cy) + ay * (bz * cx - bx * cz) + az * (bx * cy - by * cx);
  }
  return v / 6;
}

const rows = [];
for (const node of root.listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION');
    if (!pos) continue;
    const v = signedVolume(prim);
    rows.push({ name: node.getName(), v, verts: pos.getCount() });
  }
}

const neg = rows.filter((r) => r.v < 0);
console.log('网格总数', rows.length, '| 负体积（外翻）网格数', neg.length);
console.log('\n关键样本：');
for (const want of ['left rectus abdominis', 'right rectus abdominis', 'left external oblique', 'right external oblique', 'left biceps brachii', 'right biceps brachii']) {
  const r = rows.find((x) => x.name === want);
  if (r) console.log('  ', r.v > 0 ? '正' : '负', String(r.v.toFixed(0)).padStart(10), ' ', r.name);
}
console.log('\n全部负体积网格（前 40）：');
neg.sort((a, b) => a.v - b.v).slice(0, 40).forEach((r) => console.log('  ', r.v.toFixed(0).padStart(10), r.name));
