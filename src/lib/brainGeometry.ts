import * as THREE from "three";

export type BrainBuffers = {
  positions: Float32Array;
  colors: Float32Array;
  seeds: Float32Array;
  count: number;
};

function hash(n: number): number {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function noise3(x: number, y: number, z: number): number {
  const n =
    hash(x * 1.7 + y * 2.3 + z * 3.1) * 0.55 +
    hash(x * 4.1 + y * 5.7 + z * 6.9) * 0.3 +
    hash(x * 9.2 + y * 11.4 + z * 13.8) * 0.15;
  return n * 2 - 1;
}

/** Procedural cerebrum point cloud with left/right hemispheres and cortical folds. */
export function createBrainCloud(count: number): BrainBuffers {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 4);

  const colorCool = new THREE.Color("#7dd3fc");
  const colorHot = new THREE.Color("#38bdf8");
  const colorCore = new THREE.Color("#e0f2fe");

  let written = 0;
  let guard = 0;

  while (written < count && guard < count * 8) {
    guard += 1;

    const hemisphere = written % 2 === 0 ? -1 : 1;
    const u = Math.random();
    const v = Math.random();
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);

    let rx = 0.72;
    let ry = 0.58;
    let rz = 0.9;

    let x = rx * Math.sin(phi) * Math.cos(theta);
    let y = ry * Math.cos(phi);
    let z = rz * Math.sin(phi) * Math.sin(theta);

    // Split hemispheres + slight frontal/occipital elongation
    x = Math.abs(x) * hemisphere + hemisphere * 0.08;
    z *= 1.05;
    y += 0.05;

    // Cortical folds
    const fold =
      1 +
      0.12 * Math.sin(x * 14 + z * 9) +
      0.08 * Math.sin(y * 18 + x * 7) +
      0.06 * noise3(x * 3.2, y * 3.2, z * 3.2);
    x *= fold;
    y *= fold * 0.98;
    z *= fold * 1.02;

    // Soft cerebellum hint under the rear
    if (z < -0.35 && y < 0.05) {
      const cScale = 0.55 + 0.2 * Math.random();
      x *= cScale;
      y = y * 0.7 - 0.18;
      z = z * 0.75 - 0.12;
    }

    // Reject overly sparse outliers
    const dist = Math.sqrt(x * x + y * y + z * z);
    if (dist < 0.28 || dist > 1.35) continue;

    const i = written * 3;
    positions[i] = x;
    positions[i + 1] = y;
    positions[i + 2] = z;

    const depth = THREE.MathUtils.clamp((y + 0.6) / 1.2, 0, 1);
    const mix = colorCool.clone().lerp(colorHot, depth * 0.65).lerp(colorCore, depth * 0.2);
    colors[i] = mix.r;
    colors[i + 1] = mix.g;
    colors[i + 2] = mix.b;

    const s = written * 4;
    seeds[s] = Math.random();
    seeds[s + 1] = Math.random();
    seeds[s + 2] = Math.random();
    seeds[s + 3] = 0.6 + Math.random() * 0.8;

    written += 1;
  }

  return {
    positions: positions.subarray(0, written * 3),
    colors: colors.subarray(0, written * 3),
    seeds: seeds.subarray(0, written * 4),
    count: written,
  };
}

export function chapterFromProgress(progress: number, chapterCount: number): number {
  return Math.min(
    chapterCount - 1,
    Math.max(0, Math.floor(progress * chapterCount + 1e-6))
  );
}

/** Camera keyframes keyed to scroll progress 0→1 across seven chapters. */
export function sampleCamera(progress: number) {
  const keys = [
    { p: 0.0, pos: new THREE.Vector3(0.15, 0.05, 3.6), look: new THREE.Vector3(0.35, 0.05, 0) },
    { p: 0.14, pos: new THREE.Vector3(0.4, 0.2, 2.8), look: new THREE.Vector3(0.2, 0.05, 0) },
    { p: 0.28, pos: new THREE.Vector3(-0.2, 0.35, 2.2), look: new THREE.Vector3(0.1, 0.05, 0) },
    { p: 0.42, pos: new THREE.Vector3(0.9, 0.15, 1.7), look: new THREE.Vector3(0.15, 0.0, 0) },
    { p: 0.56, pos: new THREE.Vector3(0.1, 0.05, 1.15), look: new THREE.Vector3(0.05, 0.02, 0) },
    { p: 0.72, pos: new THREE.Vector3(-0.6, 0.4, 2.4), look: new THREE.Vector3(0, 0.1, 0) },
    { p: 0.88, pos: new THREE.Vector3(0.0, 0.2, 4.2), look: new THREE.Vector3(0, 0, 0) },
    { p: 1.0, pos: new THREE.Vector3(0.0, 0.0, 5.2), look: new THREE.Vector3(0, 0, 0) },
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
  const rotateY = progress * Math.PI * 1.35;
  const rotateX = Math.sin(progress * Math.PI) * 0.18;
  const scale = THREE.MathUtils.lerp(1, 1.08, Math.sin(progress * Math.PI));
  const scatter = THREE.MathUtils.smoothstep((progress - 0.62) / 0.28, 0, 1);
  const scan = THREE.MathUtils.clamp((progress - 0.2) / 0.35, 0, 1);
  const glow = 0.75 + Math.sin(progress * Math.PI * 2) * 0.15 + scatter * 0.35;
  return { rotateY, rotateX, scale, scatter, scan, glow };
}
