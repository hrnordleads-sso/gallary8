import * as THREE from "three";

export type BrainBuffers = {
  positions: Float32Array;
  colors: Float32Array;
  seeds: Float32Array;
  sizes: Float32Array;
  count: number;
};

function hash(n: number): number {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

/** Fast anatomical warp: unit sphere → cerebrum silhouette. */
function warpToBrain(u: number, v: number, w: number, layer: number): THREE.Vector3 {
  // u,v,w in [-1,1] roughly on/near unit ball
  const hemisphere = u < 0 ? -1 : 1;
  let x = Math.abs(u) * 0.55 + 0.1;
  let y = v * 0.42;
  let z = w * 0.62;

  // Frontal / occipital elongation
  z *= 1.05 + 0.18 * z;
  // Temporal drop
  if (Math.abs(u) > 0.35 && y < 0.05) {
    y -= 0.18 * (Math.abs(u) - 0.35);
    x += 0.08;
  }
  // Cerebellum pocket
  if (z < -0.35 && y < 0.1) {
    y -= 0.22;
    z = z * 0.85 - 0.08;
    x *= 0.9;
  }
  // Midline fissure
  x = Math.max(0.035, x);
  x *= hemisphere;

  // Cortical folds
  const folds =
    1 +
    0.1 * Math.sin(x * 15 + z * 10) +
    0.08 * Math.sin(y * 17 + x * 8) +
    0.05 * Math.sin(z * 13 + y * 11) +
    0.04 * (hash(x * 4 + y * 7 + z * 3) * 2 - 1);
  x *= folds;
  y *= folds * 0.97;
  z *= folds * 1.01;

  // Interior layer shrinks toward center
  if (layer > 0.5) {
    const s = 0.55 + hash(u * 9 + v * 5) * 0.25;
    x *= s;
    y *= s;
    z *= s;
  }

  return new THREE.Vector3(x, y + 0.04, z);
}

/** Dense luminous brain — surface shell + soft interior nebula. */
export function createBrainCloud(count: number): BrainBuffers {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 4);
  const sizes = new Float32Array(count);

  const cyan = new THREE.Color("#5ee7ff");
  const electric = new THREE.Color("#22d3ee");
  const ice = new THREE.Color("#e0fdff");
  const deep = new THREE.Color("#0284c7");

  for (let i = 0; i < count; i += 1) {
    const layer = i / count < 0.78 ? 0 : 1;
    // Fibonacci-ish sphere distribution
    const t = (i + 0.5) / count;
    const incl = Math.acos(1 - 2 * ((t * 1.618) % 1));
    const azim = 2 * Math.PI * 0.61803398875 * i;
    let r = layer === 0 ? 0.92 + hash(i * 1.7) * 0.1 : 0.25 + hash(i * 3.1) * 0.55;
    // Jitter
    r += (hash(i * 5.3) - 0.5) * 0.06;

    const sx = r * Math.sin(incl) * Math.cos(azim);
    const sy = r * Math.cos(incl);
    const sz = r * Math.sin(incl) * Math.sin(azim);

    const p = warpToBrain(sx, sy, sz, layer);
    const idx = i * 3;
    positions[idx] = p.x;
    positions[idx + 1] = p.y;
    positions[idx + 2] = p.z;

    const height = THREE.MathUtils.clamp((p.y + 0.55) / 1.1, 0, 1);
    const mix = cyan
      .clone()
      .lerp(electric, 0.4 + height * 0.3)
      .lerp(ice, height * 0.4)
      .lerp(deep, (1 - height) * 0.22);
    if (layer === 1) {
      mix.multiplyScalar(0.5);
      mix.lerp(deep, 0.4);
    }

    colors[idx] = mix.r;
    colors[idx + 1] = mix.g;
    colors[idx + 2] = mix.b;

    const s = i * 4;
    seeds[s] = hash(i * 1.1);
    seeds[s + 1] = hash(i * 2.3);
    seeds[s + 2] = hash(i * 3.7);
    seeds[s + 3] = layer;
    sizes[i] = layer === 0 ? 1.2 + hash(i * 4.1) * 1.5 : 2.4 + hash(i * 6.2) * 2.6;
  }

  return { positions, colors, seeds, sizes, count };
}

/** Camera: brain sits right-of-center like the reference. */
export function sampleCamera(progress: number) {
  const keys = [
    { p: 0.0, pos: new THREE.Vector3(-0.35, 0.12, 3.15), look: new THREE.Vector3(0.55, 0.05, 0) },
    { p: 0.14, pos: new THREE.Vector3(-0.1, 0.2, 2.55), look: new THREE.Vector3(0.4, 0.05, 0) },
    { p: 0.28, pos: new THREE.Vector3(0.55, 0.25, 2.0), look: new THREE.Vector3(0.2, 0.0, 0) },
    { p: 0.42, pos: new THREE.Vector3(1.05, 0.05, 1.55), look: new THREE.Vector3(0.15, -0.05, 0) },
    { p: 0.56, pos: new THREE.Vector3(0.2, -0.15, 1.25), look: new THREE.Vector3(0.05, -0.2, -0.15) },
    { p: 0.72, pos: new THREE.Vector3(-0.4, 0.35, 2.65), look: new THREE.Vector3(0.1, 0.05, 0) },
    { p: 0.88, pos: new THREE.Vector3(0.0, 0.15, 4.0), look: new THREE.Vector3(0, 0, 0) },
    { p: 1.0, pos: new THREE.Vector3(0.0, 0.05, 5.0), look: new THREE.Vector3(0, 0, 0) },
  ];

  let i = 0;
  while (i < keys.length - 1 && progress > keys[i + 1].p) i += 1;
  const a = keys[i];
  const b = keys[Math.min(i + 1, keys.length - 1)];
  const span = Math.max(1e-6, b.p - a.p);
  const t = THREE.MathUtils.smoothstep((progress - a.p) / span, 0, 1);

  return {
    position: a.pos.clone().lerp(b.pos, t),
    lookAt: a.look.clone().lerp(b.look, t),
  };
}

export function sampleBrainMotion(progress: number) {
  const rotateY = -0.35 + progress * Math.PI * 1.15;
  const rotateX = 0.08 + Math.sin(progress * Math.PI) * 0.2;
  const scale = THREE.MathUtils.lerp(1.05, 1.18, Math.sin(progress * Math.PI * 0.85));
  const scatter = THREE.MathUtils.smoothstep((progress - 0.68) / 0.26, 0, 1);
  const scan = THREE.MathUtils.clamp((progress - 0.18) / 0.4, 0, 1);
  const glow = 1.15 + Math.sin(progress * Math.PI * 2) * 0.2 + scatter * 0.55;
  const highlight = THREE.MathUtils.smoothstep((progress - 0.35) / 0.2, 0, 1);
  return { rotateY, rotateX, scale, scatter, scan, glow, highlight };
}
