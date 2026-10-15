/**
 * 06 - 在 Node 里真实跑一遍 buildModel（解 Draco -> GLTFLoader.parse -> 合并几何）
 * 用来在没有浏览器的情况下验证：合并是否成功、层数、包围盒、朝向是否正确。
 */
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GLB = resolve(root, 'public/models/anatomy.glb');

// buildLayers.ts 是 TS，这里内联一份等价逻辑（保持与源码一致的验证）
const map = JSON.parse(await readFile(resolve(root, 'src/kb/mesh/muscleGroupMap.json'), 'utf8'));
const NODE_TO_GROUP = map.nodeToGroup;

function inferSide(name) {
  const n = name.toLowerCase();
  if (/\bleft\b|\bl\./.test(n)) return 'left';
  if (/\bright\b|\br\./.test(n)) return 'right';
  return 'center';
}

function lookupGroup(name) {
  if (NODE_TO_GROUP[name]) return NODE_TO_GROUP[name];
  const spaced = name.replace(/_/g, ' ').trim();
  if (NODE_TO_GROUP[spaced]) return NODE_TO_GROUP[spaced];
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const target = norm(spaced);
  for (const key of Object.keys(NODE_TO_GROUP)) {
    if (norm(key) === target) return NODE_TO_GROUP[key];
  }
  return 'other';
}

let geoDebug = null;
function normalizeGeometry(src, matrix) {
  const geo = src.clone();
  geo.applyMatrix4(matrix);
  const pos = geo.getAttribute('position');
  if (!pos) return null;
  if (!geo.getAttribute('normal')) geo.computeVertexNormals();
  const nrm = geo.getAttribute('normal');
  if (!geoDebug) {
    const bb = new THREE.Box3().setFromBufferAttribute(pos);
    geoDebug = `单块几何体经 applyMatrix4 后 bbox: min=${bb.min.toArray().map((v) => v.toFixed(1)).join(',')} max=${bb.max.toArray().map((v) => v.toFixed(1)).join(',')}`;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', pos.clone());
  out.setAttribute('normal', nrm.clone());
  const idx = geo.getIndex();
  if (idx) out.setIndex(idx.clone());
  else {
    const count = pos.count;
    const arr = count > 65535 ? new Uint32Array(count) : new Uint16Array(count);
    for (let i = 0; i < count; i++) arr[i] = i;
    out.setIndex(new THREE.BufferAttribute(arr, 1));
  }
  return out;
}

async function main() {
  // 1) 解压 Draco
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
    });
  const doc = await io.read(GLB);
  // 移除 Draco 扩展，输出未压缩的 GLB 给 three 解析（Node 里没有 web worker）
  for (const ext of doc.getRoot().listExtensionsUsed()) {
    if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
  }
  const binary = await io.writeBinary(doc);

  // 2) three 解析
  const loader = new GLTFLoader();
  const gltf = await new Promise((res, rej) => {
    loader.parse(binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength), '', res, rej);
  });
  const scene = gltf.scene;
  scene.updateWorldMatrix(true, true);

  // 3) 合并
  const buckets = new Map();
  let meshCount = 0;
  const nameSamples = [];
  scene.traverse((obj) => {
    if (!obj.isMesh || !obj.geometry) return;
    meshCount++;
    if (nameSamples.length < 8) {
      const nm = obj.name;
      const mapped = NODE_TO_GROUP[nm];
      nameSamples.push(
        `name=${JSON.stringify(nm)} -> ${mapped ?? '(未命中)'} matrixWorld=identity:${obj.matrixWorld.equals(new THREE.Matrix4())}` +
          ` pos=${obj.position.toArray().map((v) => v.toFixed(1)).join(',')} scale=${obj.scale.toArray().map((v) => v.toFixed(2)).join(',')}`,
      );
    }
    const geo = normalizeGeometry(obj.geometry, obj.matrixWorld);
    if (!geo) return;
    const groupId = lookupGroup(obj.name);
    const side = inferSide(obj.name);
    const key = groupId;
    if (!buckets.has(key)) buckets.set(key, { groupId, side, geos: [], names: [] });
    buckets.get(key).geos.push(geo);
    buckets.get(key).names.push(obj.name);
  });

  const { mergeGeometries } = await import('three/examples/jsm/utils/BufferGeometryUtils.js');
  const layers = [];
  const failed = [];
  for (const [key, b] of buckets) {
    try {
      const merged = mergeGeometries(b.geos, false);
      if (merged) {
        merged.computeBoundingBox();
        layers.push({ key, groupId: b.groupId, side: b.side, geometry: merged, names: b.names });
      } else failed.push(key);
    } catch (e) {
      failed.push(key + ' :: ' + e.message);
    }
  }

  console.log(`[verify] 原始 mesh 数：${meshCount}`);
  console.log('[verify] 抽样节点信息：');
  nameSamples.forEach((s) => console.log('   ' + s));
  console.log('[verify] ' + geoDebug);
  console.log(`[verify] 分组数(buckets)：${buckets.size}`);
  console.log(`[verify] 合并后层数：${layers.length}   失败：${failed.length}`);
  if (layers[0]) {
    const l = layers[0];
    const sz = l.geometry.boundingBox.getSize(new THREE.Vector3());
    console.log(
      `[verify] 首层样例 ${l.key}: 含 ${l.names.length} 块, 顶点 ${l.geometry.getAttribute('position').count}, bbox尺寸 ${sz.toArray().map((v) => v.toFixed(1)).join(' x ')}`,
    );
  }
  if (failed.length) console.log('[verify] 失败列表：', failed.slice(0, 10));

  const bounds = new THREE.Box3();
  for (const l of layers) if (l.geometry.boundingBox) bounds.union(l.geometry.boundingBox);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  console.log(`[verify] 整体尺寸 (模型空间)  X=${size.x.toFixed(1)} Y=${size.y.toFixed(1)} Z=${size.z.toFixed(1)}`);
  console.log(`[verify] 整体中心             X=${center.x.toFixed(1)} Y=${center.y.toFixed(1)} Z=${center.z.toFixed(1)}`);

  // 4) 模拟页面里的旋转：绕 X 轴 -90°，验证人体在 three 坐标系里直立且正面朝 +Z
  const ROT = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
  const height = Math.max(size.x, size.y, size.z);
  const s = 1.8 / height;
  const probe = (kw) => {
    const ls = layers.filter((l) => l.names.some((n) => n.toLowerCase().includes(kw)));
    if (!ls.length) return null;
    const v = new THREE.Vector3();
    for (const l of ls) v.add(l.geometry.boundingBox.getCenter(new THREE.Vector3()));
    v.divideScalar(ls.length);
    v.sub(center).multiplyScalar(s).applyMatrix4(ROT); // 居中 -> 缩放 -> 旋转
    return v;
  };

  console.log('\n[verify] 旋转到页面坐标系后（+Y 应朝上、+Z 应朝前）:');
  console.log('  肌肉'.padEnd(20) + '     X(左右)      Y(上下)      Z(前后)');
  for (const kw of ['trapezius', 'deltoid', 'pectoralis', 'rectus abdominis', 'gluteus maximus', 'gastrocnemius']) {
    const p = probe(kw);
    if (p) console.log('  ' + kw.padEnd(20) + p.toArray().map((v) => v.toFixed(3).padStart(9)).join(' '));
  }

  const tops = ['trapezius', 'deltoid'].map((k) => probe(k)?.y ?? 0);
  const lows = ['gastrocnemius', 'gluteus maximus'].map((k) => probe(k)?.y ?? 0);
  const front = probe('pectoralis')?.z ?? 0;
  const back = probe('trapezius')?.z ?? 0;
  console.log('\n[verify] 判定：');
  console.log(`  上身 Y(${Math.max(...tops).toFixed(2)}) > 下身 Y(${Math.min(...lows).toFixed(2)}) ?`, Math.max(...tops) > Math.min(...lows) ? '✓ 直立' : '✗ 倒立');
  console.log(`  胸(Y前=${front.toFixed(2)}) 与 背(Z前=${back.toFixed(2)})：胸更靠前 ?`, front > back ? '✓ 正面朝相机' : '✗ 背朝相机');
}

main().catch((e) => {
  console.error('[verify] 失败：', e);
  process.exit(1);
});
