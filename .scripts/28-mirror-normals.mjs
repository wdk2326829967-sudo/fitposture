// 逐顶点镜像配对：把左侧顶点沿 X 镜像后到右侧网格里找对应点，比对法线方向
import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

const io = new NodeIO()
  .registerExtensions([KHRDracoMeshCompression])
  .registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule() });

const doc = await io.read('public/models/anatomy.glb');
const root = doc.getRoot();

function get(name) {
  const n = root.listNodes().find((x) => x.getName() === name);
  const prim = n.getMesh().listPrimitives()[0];
  return {
    pos: prim.getAttribute('POSITION').getArray(),
    nor: prim.getAttribute('NORMAL').getArray(),
  };
}

const L = get('left rectus abdominis');
const R = get('right rectus abdominis');
const Q = 2; // 量化步长
const key = (x, y, z) => Math.round(x / Q) + ',' + Math.round(y / Q) + ',' + Math.round(z / Q);

const map = new Map();
const nR = R.pos.length / 3;
for (let i = 0; i < nR; i++) {
  const k = key(R.pos[i * 3], R.pos[i * 3 + 1], R.pos[i * 3 + 2]);
  if (!map.has(k)) map.set(k, i);
}

let matched = 0;
let mirrorOk = 0;
let negOk = 0;
let sumMirror = 0;
let sumNegate = 0;
const samples = [];

const nL = L.pos.length / 3;
for (let i = 0; i < nL; i++) {
  const x = L.pos[i * 3];
  const y = L.pos[i * 3 + 1];
  const z = L.pos[i * 3 + 2];
  let j = map.get(key(-x, y, z));
  if (j === undefined) {
    outer: for (const dz of [-1, 0, 1]) {
      for (const dy of [-1, 0, 1]) {
        for (const dx of [-1, 0, 1]) {
          const k2 = key(-x + dx * Q, y + dy * Q, z + dz * Q);
          if (map.has(k2)) {
            j = map.get(k2);
            break outer;
          }
        }
      }
    }
  }
  if (j === undefined) continue;
  matched++;

  const lnx = L.nor[i * 3];
  const lny = L.nor[i * 3 + 1];
  const lnz = L.nor[i * 3 + 2];
  const rnx = R.nor[j * 3];
  const rny = R.nor[j * 3 + 1];
  const rnz = R.nor[j * 3 + 2];

  const dMirror = -lnx * rnx + lny * rny + lnz * rnz; // A: 随几何镜像
  const dNegate = -lnx * rnx - lny * rny - lnz * rnz; // B: 整体取反

  sumMirror += dMirror;
  sumNegate += dNegate;
  if (dMirror > 0.9) mirrorOk++;
  if (dNegate > 0.9) negOk++;

  if (samples.length < 8) {
    const lx = Math.abs(lnx);
    if (lx > 0.25)
      samples.push({
        l: [+lnx.toFixed(2), +lny.toFixed(2), +lnz.toFixed(2)],
        r: [+rnx.toFixed(2), +rny.toFixed(2), +rnz.toFixed(2)],
      });
  }
}

console.log('左侧顶点', nL, '| 成功配对', matched);
console.log(
  '假设A（法线随几何镜像 → (-nx, ny, nz)）平均点积',
  (sumMirror / matched).toFixed(3),
  '匹配率',
  ((mirrorOk / matched) * 100).toFixed(1) + '%',
);
console.log(
  '假设B（法线整体被取反 → (-nx, -ny, -nz)）平均点积',
  (sumNegate / matched).toFixed(3),
  '匹配率',
  ((negOk / matched) * 100).toFixed(1) + '%',
);
samples.forEach((s) => console.log('   左', s.l, '  右', s.r));
