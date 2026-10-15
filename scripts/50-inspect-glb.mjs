import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, textureCompress } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { statSync } from 'node:fs';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});

const file = process.argv[2] ?? 'public/models/anatomy.glb';
const before = statSync(file).size;

const doc = await io.read(file);
const root = doc.getRoot();

let tris = 0;
let verts = 0;
for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION');
    verts += pos?.getCount() ?? 0;
    const idx = prim.getIndices();
    tris += idx ? idx.getCount() / 3 : (pos?.getCount() ?? 0) / 3;
  }
}

console.log(`文件   : ${file}`);
console.log(`体积   : ${(before / 1048576).toFixed(2)} MB`);
console.log(`网格   : ${root.listMeshes().length} 个 / 节点 ${root.listNodes().length} 个`);
console.log(`三角形 : ${Math.round(tris).toLocaleString()}`);
console.log(`顶点   : ${Math.round(verts).toLocaleString()}`);
console.log(`材质   : ${root.listMaterials().length}`);
console.log(`纹理   : ${root.listTextures().length}`);
for (const t of root.listTextures()) {
  const img = t.getImage();
  console.log(`  - ${t.getName() || '(无名)'} ${img ? (img.byteLength / 1024).toFixed(0) + 'KB' : '无图像'} mime=${t.getMimeType()}`);
}
console.log(`动画   : ${root.listAnimations().length}`);

// 试算 dedup + prune 的收益（不改变拓扑与节点结构）
const doc2 = await io.read(file);
await doc2.transform(dedup(), prune());
const out = await io.writeBinary(doc2);
console.log(`\ndedup+prune 后: ${(out.byteLength / 1048576).toFixed(2)} MB (${((out.byteLength / before) * 100).toFixed(1)}%)`);
