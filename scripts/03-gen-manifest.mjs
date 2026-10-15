/**
 * 03 - 遍历优化后的 GLB，输出每个 mesh 节点的清单（名字 / 面数 / 左右 / 包围盒）
 * 产物：src/kb/mesh/meshManifest.json
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INPUT = resolve(root, 'public/models/anatomy.glb');
const OUTPUT = resolve(root, 'src/kb/mesh/meshManifest.json');

function inferSide(name) {
  const n = name.toLowerCase();
  if (/\bleft\b|\bl\.|sinister/.test(n)) return 'left';
  if (/\bright\b|\br\.|dexter/.test(n)) return 'right';
  return 'center';
}

/** gltf-transform 的 mat4 是列主序 number[16]，与 three 一致 */
function multiply(a, b) {
  const out = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      out[c * 4 + r] = s;
    }
  }
  return out;
}

/** 累积父节点变换，得到世界矩阵 */
function worldMatrix(node) {
  const chain = [];
  let n = node;
  while (n) {
    chain.unshift(n.getMatrix());
    n = n.getParentNode?.();
  }
  let m = chain[0];
  for (let i = 1; i < chain.length; i++) m = multiply(m, chain[i]);
  return m;
}

function transformPoint(m, p) {
  const [x, y, z] = p;
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
  ];
}

async function main() {
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
    });

  console.log('[03] 读取优化后的 GLB ...');
  const doc = await io.read(INPUT);
  const rootDoc = doc.getRoot();

  const items = [];
  for (const node of rootDoc.listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;

    let vertices = 0;
    let faces = 0;
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];

    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION');
      if (!pos) continue;
      vertices += pos.getCount();
      const idx = prim.getIndices();
      faces += idx ? idx.getCount() / 3 : pos.getCount() / 3;

      // 量化后必须用 getMinNormalized 才能拿到真实浮点坐标
      const pMin = pos.getMinNormalized([]);
      const pMax = pos.getMaxNormalized([]);
      if (Array.isArray(pMin)) {
        // 局部 bbox 已被归一化到 [-1,1]，必须用世界矩阵还原真实位置
        const m = worldMatrix(node);
        for (let c = 0; c < 8; c++) {
          const p = transformPoint(m, [
            c & 1 ? pMax[0] : pMin[0],
            c & 2 ? pMax[1] : pMin[1],
            c & 4 ? pMax[2] : pMin[2],
          ]);
          for (let i = 0; i < 3; i++) {
            if (Number.isFinite(p[i])) {
              min[i] = Math.min(min[i], p[i]);
              max[i] = Math.max(max[i], p[i]);
            }
          }
        }
      }
    }

    items.push({
      name: node.getName() || mesh.getName() || `mesh_${items.length}`,
      side: inferSide(node.getName() || ''),
      vertices,
      faces: Math.round(faces),
      bbox: min[0] === Infinity ? null : { min, max },
    });
  }

  items.sort((a, b) => a.name.localeCompare(b.name));

  const totalVerts = items.reduce((s, i) => s + i.vertices, 0);
  const totalFaces = items.reduce((s, i) => s + i.faces, 0);

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(
    OUTPUT,
    JSON.stringify({ generatedAt: new Date().toISOString(), count: items.length, totalVerts, totalFaces, items }, null, 2),
    'utf8',
  );

  console.log(`[03] 节点数：${items.length}，总顶点 ${totalVerts.toLocaleString()}，总面 ${totalFaces.toLocaleString()}`);
  console.log(`[03] 前 15 个节点名：`);
  items.slice(0, 15).forEach((i) => console.log(`     - ${i.name}  [${i.side}]  faces=${i.faces}`));
  console.log(`[03] 输出：${OUTPUT}`);
}

main().catch((e) => {
  console.error('[03] 失败：', e);
  process.exit(1);
});
