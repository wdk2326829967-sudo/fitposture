// 直接分析 anatomy.glb 中左右腹直肌的几何：顶点/三角形数量 + 前表面轮廓（找腱划的起伏）
import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const io = new NodeIO()
  .registerExtensions([KHRDracoMeshCompression])
  .registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
  });

const doc = await io.read('public/models/anatomy.glb');
const root = doc.getRoot();

const targets = ['left rectus abdominis', 'right rectus abdominis'];
const nodes = root.listNodes();

function analyze(prim, name) {
  const pos = prim.getAttribute('POSITION');
  const idx = prim.getIndices();
  const n = pos.getCount();
  const arr = pos.getArray(); // Float32Array
  const min = pos.getMinNormalized([]);
  const max = pos.getMaxNormalized([]);

  // 前表面轮廓：模型为 Z-up、-Y 朝前。沿 Z 分箱，取每箱最小 Y（最靠前）
  const bins = 240;
  const z0 = min[2];
  const z1 = max[2];
  const step = (z1 - z0) / bins;
  const front = new Array(bins).fill(Infinity);
  const depthFrontCount = new Array(bins).fill(0);
  for (let i = 0; i < n; i++) {
    const x = arr[i * 3];
    const y = arr[i * 3 + 1];
    const z = arr[i * 3 + 2];
    const b = Math.min(bins - 1, Math.max(0, Math.floor((z - z0) / step)));
    if (y < front[b]) front[b] = y;
    // 只统计靠前的顶点，避免背面干扰
    if (y < -60) depthFrontCount[b]++;
  }

  // 轮廓的一阶差分，用峰谷数量近似「腱划」数量
  const smooth = front.map((v, i) => {
    const lo = Math.max(0, i - 2);
    const hi = Math.min(front.length - 1, i + 2);
    let s = 0;
    let c = 0;
    for (let k = lo; k <= hi; k++) {
      s += front[k];
      c++;
    }
    return s / c;
  });
  let turns = 0;
  for (let i = 3; i < smooth.length - 3; i++) {
    const prev = smooth[i - 2] - smooth[i - 4];
    const next = smooth[i + 2] - smooth[i];
    if (prev > 0.15 && next < -0.15) turns++; // 由前凸转为后凹
  }
  // 相邻箱之间最大的「向前跳变」，腱划处会出现断续
  let maxJump = 0;
  for (let i = 1; i < bins; i++) {
    const d = Math.abs(smooth[i] - smooth[i - 1]);
    if (d > maxJump) maxJump = d;
  }

  console.log(
    `${name}\n  顶点 ${n} | 三角 ${idx ? idx.getCount() / 3 : 0} | 体积 ${(
      (max[0] - min[0]) *
      (max[1] - min[1]) *
      (max[2] - min[2])
    ).toFixed(0)}\n  bbox X ${min[0].toFixed(0)}~${max[0].toFixed(0)} Y ${min[1].toFixed(0)}~${max[1].toFixed(
      0,
    )} Z ${min[2].toFixed(0)}~${max[2].toFixed(0)}\n  前凸->后凹的转折次数 ${turns} | 相邻最大跳变 ${maxJump.toFixed(
      2,
    )}`,
  );
  return { front: smooth, bins, z0, step, count: n };
}

const out = {};
for (const want of targets) {
  const node = nodes.find((nd) => nd.getName() === want);
  if (!node) {
    console.log('未找到节点', want);
    continue;
  }
  const mesh = node.getMesh();
  for (const prim of mesh.listPrimitives()) {
    out[want] = analyze(prim, want);
  }
}

// 把两条轮廓并排打印（前 60~200 箱，即腹部区域）
const L = out['left rectus abdominis'];
const R = out['right rectus abdominis'];
if (L && R) {
  console.log('\n箱位\t左(前Y)\t右(前Y)\t差');
  for (let i = 40; i < 200; i += 4) {
    console.log(
      `${i}\t${L.front[i].toFixed(1)}\t${R.front[i].toFixed(1)}\t${(L.front[i] - R.front[i]).toFixed(2)}`,
    );
  }
}
