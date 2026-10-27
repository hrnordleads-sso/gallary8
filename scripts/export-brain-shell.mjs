/**
 * Export lightweight anatomical shell as brain-shell.bin (positions only, non-indexed tris).
 * Same normalize as bake-brain-points.mjs. Loaded at runtime as BufferGeometry.
 * Run: node scripts/export-brain-shell.mjs
 *
 * Format: uint32 magic 0xb17a1002 | uint32 vertCount | float32 positions[vertCount*3]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const glbPath = path.join(root, "assets", "brain.glb");
const outPath = path.join(root, "public", "models", "brain-shell.bin");
const TRI_STRIDE = 28;
const MAGIC = 0xb17a1002;

async function loadGLB(filePath) {
  const buffer = fs.readFileSync(filePath).buffer;
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.parse(buffer, "", (gltf) => resolve(gltf), (err) => reject(err));
  });
}

function mergePositionGeometries(rootObj) {
  const geos = [];
  rootObj.updateMatrixWorld(true);
  rootObj.traverse((obj) => {
    if (!obj.isMesh || !obj.geometry) return;
    const geo = obj.geometry.index
      ? obj.geometry.toNonIndexed()
      : obj.geometry.clone();
    geo.applyMatrix4(obj.matrixWorld);
    geos.push(geo);
  });
  let total = 0;
  for (const g of geos) total += g.attributes.position.count;
  const positions = new Float32Array(total * 3);
  let offset = 0;
  for (const g of geos) {
    positions.set(g.attributes.position.array, offset);
    offset += g.attributes.position.array.length;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return merged;
}

function normalizeGeometry(merged) {
  merged.computeBoundingBox();
  const box = merged.boundingBox;
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = 1.55 / maxDim;
  const posAttr = merged.attributes.position;
  for (let i = 0; i < posAttr.count; i += 1) {
    posAttr.setXYZ(
      i,
      (posAttr.getX(i) - center.x) * scale,
      (posAttr.getY(i) - center.y) * scale,
      (posAttr.getZ(i) - center.z) * scale
    );
  }
  posAttr.needsUpdate = true;
  return merged;
}

function strideDecimate(geo, stride) {
  const src = geo.attributes.position.array;
  const triCount = Math.floor(src.length / 9);
  const keep = Math.ceil(triCount / stride);
  const positions = new Float32Array(keep * 9);
  let w = 0;
  for (let t = 0; t < triCount; t += stride) {
    positions.set(src.subarray(t * 9, t * 9 + 9), w);
    w += 9;
  }
  return positions.subarray(0, w);
}

async function main() {
  if (!fs.existsSync(glbPath)) throw new Error(`Missing ${glbPath}`);
  console.log("Loading", glbPath);
  const gltf = await loadGLB(glbPath);
  let merged = mergePositionGeometries(gltf.scene);
  if (!merged.attributes.position?.count) throw new Error("No meshes in brain.glb");
  merged = normalizeGeometry(merged);

  const positions = strideDecimate(merged, TRI_STRIDE);
  const vertCount = positions.length / 3;
  console.log("Shell verts", vertCount, "tris", vertCount / 3);

  const header = Buffer.alloc(8);
  header.writeUInt32LE(MAGIC, 0);
  header.writeUInt32LE(vertCount, 4);
  const body = Buffer.concat([header, Buffer.from(positions.buffer, positions.byteOffset, positions.byteLength)]);
  fs.writeFileSync(outPath, body);
  console.log("Wrote", outPath, "bytes", body.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
