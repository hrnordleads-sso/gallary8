/**
 * Bake anatomical brain.glb surface → dense point buffers for the Neural Monitor.
 * Run: node scripts/bake-brain-points.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const glbPath = path.join(root, "assets", "brain.glb");
const outPath = path.join(root, "public", "models", "brain-points.bin");
const COUNT = 220000;

function hash(n) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

async function loadGLB(filePath) {
  const buffer = fs.readFileSync(filePath).buffer;
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.parse(
      buffer,
      "",
      (gltf) => resolve(gltf),
      (err) => reject(err)
    );
  });
}

function collectMeshes(rootObj) {
  const meshes = [];
  rootObj.updateMatrixWorld(true);
  rootObj.traverse((obj) => {
    if (obj.isMesh && obj.geometry) {
      const geo = obj.geometry.clone();
      geo.applyMatrix4(obj.matrixWorld);
      meshes.push(new THREE.Mesh(geo));
    }
  });
  return meshes;
}

function mergeGeometries(meshes) {
  const geos = meshes.map((m) => {
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry;
    return g;
  });
  // Manual merge of position attributes
  let total = 0;
  for (const g of geos) total += g.attributes.position.count;
  const positions = new Float32Array(total * 3);
  let offset = 0;
  for (const g of geos) {
    const arr = g.attributes.position.array;
    positions.set(arr, offset);
    offset += arr.length;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  merged.computeVertexNormals();
  return merged;
}

async function main() {
  if (!fs.existsSync(glbPath)) {
    throw new Error(`Missing ${glbPath}`);
  }
  console.log("Loading", glbPath);
  const gltf = await loadGLB(glbPath);
  const meshes = collectMeshes(gltf.scene);
  if (!meshes.length) throw new Error("No meshes in brain.glb");
  console.log("Meshes:", meshes.length);

  const merged = mergeGeometries(meshes);
  merged.computeBoundingBox();
  const box = merged.boundingBox;
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = 1.55 / maxDim;

  // Normalize into unit-ish anatomical space (Y up, facing +Z)
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
  merged.computeBoundingBox();

  const mesh = new THREE.Mesh(merged);
  const sampler = new MeshSurfaceSampler(mesh).build();

  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const sizes = new Float32Array(COUNT);
  const seeds = new Float32Array(COUNT * 4);
  const tmp = new THREE.Vector3();
  // Neural Monitor video palette — soft electric cyan / ice (not teal-dark, not white)
  const deep = new THREE.Color("#0369a1");
  const mid = new THREE.Color("#0ea5e9");
  const electric = new THREE.Color("#22d3ee");
  const ice = new THREE.Color("#a5f3fc");

  // Dense cortex shell + soft interior nebula (rim reads brighter in reference)
  const surfaceCount = Math.floor(COUNT * 0.86);

  for (let i = 0; i < COUNT; i += 1) {
    sampler.sample(tmp);
    const layer = i < surfaceCount ? 0 : 1;
    const radius = tmp.length();
    if (layer === 1) {
      tmp.multiplyScalar(0.42 + hash(i * 3.1) * 0.4);
    }
    // Subtle cortical fold lift on surface
    if (layer === 0) {
      const n =
        0.01 *
        Math.sin(tmp.x * 26 + tmp.z * 16) *
        Math.sin(tmp.y * 20 + tmp.x * 12);
      if (radius > 1e-5) tmp.addScaledVector(tmp.clone().normalize(), n);
    }

    const idx = i * 3;
    positions[idx] = tmp.x;
    positions[idx + 1] = tmp.y;
    positions[idx + 2] = tmp.z;

    const height = THREE.MathUtils.clamp((tmp.y + 0.7) / 1.4, 0, 1);
    const rim = THREE.MathUtils.clamp(radius / 0.85, 0, 1);
    const ridge = Math.abs(Math.sin(tmp.x * 14 + tmp.z * 11 + tmp.y * 9)) * 0.45 + 0.55;

    // Edge/silhouette denser-looking via brighter ice; interior stays deeper cyan
    const mix = deep
      .clone()
      .lerp(mid, 0.35 + height * 0.2)
      .lerp(electric, 0.35 + rim * 0.35)
      .lerp(ice, rim * ridge * 0.45);

    if (layer === 1) {
      mix.multiplyScalar(0.32);
      mix.lerp(deep, 0.4);
    } else {
      // Keep additive stack cyan (low red)
      mix.r *= 0.35 + rim * 0.15;
      mix.g = Math.min(1, mix.g * 1.05);
      mix.b = Math.min(1, mix.b * 1.12);
    }

    colors[idx] = mix.r;
    colors[idx + 1] = mix.g;
    colors[idx + 2] = mix.b;

    // Slightly larger rim dots for the bright silhouette in the video
    sizes[i] =
      layer === 0
        ? 0.55 + hash(i * 4.1) * 0.5 + rim * 0.35
        : 1.0 + hash(i * 6.2) * 1.1;
    const s = i * 4;
    seeds[s] = hash(i * 1.1);
    seeds[s + 1] = hash(i * 2.3);
    seeds[s + 2] = hash(i * 3.7);
    seeds[s + 3] = layer;
  }

  // Pack: header + positions + colors + sizes + seeds
  // header: uint32 count, uint32 magic
  const header = Buffer.alloc(8);
  header.writeUInt32LE(COUNT, 0);
  header.writeUInt32LE(0xb17a1001, 4);
  const body = Buffer.concat([
    header,
    Buffer.from(positions.buffer),
    Buffer.from(colors.buffer),
    Buffer.from(sizes.buffer),
    Buffer.from(seeds.buffer),
  ]);
  fs.writeFileSync(outPath, body);
  console.log("Wrote", outPath, "bytes", body.length, "points", COUNT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
