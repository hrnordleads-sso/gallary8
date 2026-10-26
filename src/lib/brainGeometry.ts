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

function noise3(x: number, y: number, z: number): number {
  return (
    Math.sin(x * 4.1 + y * 3.7) * 0.5 +
    Math.sin(y * 5.3 + z * 2.9) * 0.35 +
    Math.sin(z * 6.1 + x * 4.7) * 0.25 +
    (hash(x * 11 + y * 17 + z * 23) * 2 - 1) * 0.2
  );
}

/**
 * Unit-ball sample → anatomical cerebrum + cerebellum silhouette.
 * Oriented so a 3/4 camera view reads as one coherent brain (not dual white slabs).
 */
function warpToBrain(u: number, v: number, w: number, layer: number): THREE.Vector3 {
  const hemisphere = u < 0 ? -1 : 1;
  const absU = Math.abs(u);

  // Base cerebrum ellipsoid — taller crown, longer front→back
  let x = absU * 0.68;
  let y = v * 0.72;
  let z = w * 0.88;

  // Frontal pole lift / occipital taper
  z *= 1.08 + 0.12 * z;
  y += 0.06 * Math.max(0, z) * (1 - absU);

  // Temporal lobe drop on lateral sides
  if (absU > 0.28 && y < 0.12) {
    const t = (absU - 0.28) / 0.72;
    y -= 0.28 * t * t;
    x += 0.1 * t;
    z *= 0.92;
  }

  // Parietal crown
  if (y > 0.15 && Math.abs(z) < 0.55) {
    y += 0.08 * (1 - Math.abs(z) / 0.55);
  }

  // Cerebellum pocket (rear-inferior)
  if (z < -0.28 && y < 0.18) {
    const c = THREE.MathUtils.clamp((-z - 0.28) / 0.55, 0, 1);
    y -= 0.32 * c;
    z = z * 0.78 - 0.14 * c;
    x *= 0.82 + 0.1 * (1 - c);
  }

  // Soft brainstem stub
  if (z < -0.15 && Math.abs(y + 0.35) < 0.22 && absU < 0.22) {
    y -= 0.12;
    x *= 0.55;
    z *= 0.9;
  }

  // Narrow longitudinal fissure (visible, not a canyon)
  x = Math.max(0.018, x - 0.012 * (1 - absU));
  x *= hemisphere;

  // P0 · deeper gyri/sulci so folds read at hero distance (video silhouette)
  const fold =
    1 +
    0.13 * Math.sin(x * 26 + z * 18) +
    0.1 * Math.sin(y * 30 + x * 14) +
    0.075 * Math.sin(z * 22 + y * 20) +
    0.055 * Math.sin(x * 12 + y * 16 + z * 9) +
    0.04 * Math.sin(x * 38 + z * 31) +
    0.045 * noise3(x * 2.6, y * 2.6, z * 2.6);

  if (layer < 0.5) {
    x *= fold;
    y *= fold * 0.97;
    z *= fold * 1.03;
  } else {
    // Soft interior nebula — keep volume without blowing silhouette
    const s = 0.38 + hash(u * 9 + v * 5 + w * 3) * 0.34;
    x *= s * (0.9 + fold * 0.08);
    y *= s * 0.93;
    z *= s;
  }

  return new THREE.Vector3(x, y + 0.02, z);
}

/** Dense luminous brain — cortex shell + soft interior nebula. */
export function createBrainCloud(count: number): BrainBuffers {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 4);
  const sizes = new Float32Array(count);

  // Neural Monitor video palette — soft electric / ice cyan
  const deep = new THREE.Color("#0369a1");
  const cyan = new THREE.Color("#0ea5e9");
  const electric = new THREE.Color("#22d3ee");
  const bright = new THREE.Color("#a5f3fc");

  for (let i = 0; i < count; i += 1) {
    // ~90% cortex shell, ~10% interior (denser video silhouette)
    const layer = i / count < 0.9 ? 0 : 1;
    const t = (i + 0.5) / count;
    const incl = Math.acos(1 - 2 * ((t * 1.61803398875) % 1));
    const azim = 2 * Math.PI * 0.61803398875 * i;
    let r =
      layer === 0 ? 0.985 + hash(i * 1.7) * 0.03 : 0.18 + hash(i * 3.1) * 0.48;
    // Keep shell tight — less “shaggy” halo than free jitter
    r += (hash(i * 5.3) - 0.5) * (layer === 0 ? 0.012 : 0.04);

    const sx = r * Math.sin(incl) * Math.cos(azim);
    const sy = r * Math.cos(incl);
    const sz = r * Math.sin(incl) * Math.sin(azim);

    const p = warpToBrain(sx, sy, sz, layer);
    const idx = i * 3;
    positions[idx] = p.x;
    positions[idx + 1] = p.y;
    positions[idx + 2] = p.z;

    const height = THREE.MathUtils.clamp((p.y + 0.55) / 1.1, 0, 1);
    const ridge = THREE.MathUtils.clamp(
      Math.abs(noise3(p.x * 3, p.y * 3, p.z * 3)),
      0,
      1
    );

    const mix = deep
      .clone()
      .lerp(cyan, 0.45 + height * 0.2)
      .lerp(electric, 0.25 + ridge * 0.35)
      .lerp(bright, ridge * height * 0.22);

    if (layer === 1) {
      mix.multiplyScalar(0.32);
      mix.lerp(deep, 0.6);
    } else {
      // Electric cyan shell — cut red so additive bloom stays cyan, not white
      mix.r *= 0.28;
      mix.g = Math.min(1, mix.g * 1.08);
      mix.b = Math.min(1, mix.b * 1.16);
    }

    colors[idx] = mix.r;
    colors[idx + 1] = mix.g;
    colors[idx + 2] = mix.b;

    const s = i * 4;
    seeds[s] = hash(i * 1.1);
    seeds[s + 1] = hash(i * 2.3);
    seeds[s + 2] = hash(i * 3.7);
    seeds[s + 3] = layer;
    // Smaller surface dots = denser fold read; soft interior fill
    sizes[i] = layer === 0 ? 0.42 + hash(i * 4.1) * 0.48 : 0.75 + hash(i * 6.2) * 0.9;
  }

  return { positions, colors, seeds, sizes, count };
}

/** Camera: Arrival holds text-left / brain-right, then story orbit. P0 locks vs ref frames. */
export function sampleCamera(progress: number) {
  const keys = [
    // ARRIVAL — wider hold, brain clearly right of copy (ref 001–004)
    { p: 0.0, pos: new THREE.Vector3(-0.88, 0.08, 3.55), look: new THREE.Vector3(0.68, 0.02, 0) },
    { p: 0.08, pos: new THREE.Vector3(-0.72, 0.1, 3.28), look: new THREE.Vector3(0.62, 0.02, 0) },
    // CORTEX — push in on folds without clipping silhouette (ref 005–010)
    { p: 0.14, pos: new THREE.Vector3(-0.08, 0.18, 2.55), look: new THREE.Vector3(0.42, 0.08, 0.02) },
    { p: 0.18, pos: new THREE.Vector3(0.18, 0.22, 2.18), look: new THREE.Vector3(0.3, 0.12, 0.05) },
    { p: 0.24, pos: new THREE.Vector3(0.36, 0.2, 1.95), look: new THREE.Vector3(0.22, 0.12, 0.06) },
    { p: 0.28, pos: new THREE.Vector3(0.42, 0.16, 2.05), look: new THREE.Vector3(0.2, 0.08, 0.02) },
    // SIGNALS — dive into traffic field (ref 011–016)
    { p: 0.3, pos: new THREE.Vector3(0.12, 0.1, 2.45), look: new THREE.Vector3(0.18, 0.04, 0) },
    { p: 0.34, pos: new THREE.Vector3(0.0, 0.04, 1.62), look: new THREE.Vector3(0.04, 0.0, -0.18) },
    { p: 0.38, pos: new THREE.Vector3(-0.06, 0.02, 1.22), look: new THREE.Vector3(0.0, 0.0, -0.38) },
    { p: 0.42, pos: new THREE.Vector3(0.18, 0.0, 2.7), look: new THREE.Vector3(0.05, -0.02, -0.1) },
    // LINKS — stronger lateral silhouette (ref 017–021)
    { p: 0.44, pos: new THREE.Vector3(1.55, 0.12, 2.95), look: new THREE.Vector3(0.58, 0.02, 0) },
    { p: 0.48, pos: new THREE.Vector3(2.35, 0.08, 2.05), look: new THREE.Vector3(0.58, 0.0, -0.05) },
    { p: 0.52, pos: new THREE.Vector3(2.65, 0.04, 1.7), look: new THREE.Vector3(0.52, -0.02, -0.1) },
    { p: 0.56, pos: new THREE.Vector3(1.35, -0.12, 1.65), look: new THREE.Vector3(0.3, -0.16, -0.06) },
    // VISION — swing further behind occipital pole (ref 022–027)
    { p: 0.58, pos: new THREE.Vector3(0.28, 0.16, -2.05), look: new THREE.Vector3(0.58, 0.0, 0.18) },
    { p: 0.62, pos: new THREE.Vector3(0.52, 0.08, -2.75), look: new THREE.Vector3(0.6, -0.02, 0.24) },
    { p: 0.66, pos: new THREE.Vector3(0.58, 0.04, -2.95), look: new THREE.Vector3(0.62, -0.04, 0.26) },
    { p: 0.7, pos: new THREE.Vector3(0.38, -0.08, -2.35), look: new THREE.Vector3(0.56, -0.14, 0.12) },
    // BALANCE — drop into cerebellum mass (ref 028–031)
    { p: 0.72, pos: new THREE.Vector3(0.52, -0.35, -2.15), look: new THREE.Vector3(0.55, -0.38, 0.06) },
    { p: 0.76, pos: new THREE.Vector3(0.6, -0.58, -1.65), look: new THREE.Vector3(0.58, -0.5, 0.0) },
    { p: 0.8, pos: new THREE.Vector3(0.56, -0.75, -1.32), look: new THREE.Vector3(0.55, -0.55, -0.04) },
    { p: 0.84, pos: new THREE.Vector3(0.38, -0.5, -1.8), look: new THREE.Vector3(0.52, -0.42, 0.04) },
    // RELEASE — wide constellation pull-back (ref 032–034)
    { p: 0.86, pos: new THREE.Vector3(0.22, 0.06, 2.85), look: new THREE.Vector3(0.18, -0.04, 0) },
    { p: 0.9, pos: new THREE.Vector3(0.04, 0.1, 4.35), look: new THREE.Vector3(0.04, 0.0, 0) },
    { p: 0.95, pos: new THREE.Vector3(0.0, 0.05, 5.45), look: new THREE.Vector3(0, 0, 0) },
    { p: 1.0, pos: new THREE.Vector3(0.0, 0.02, 6.2), look: new THREE.Vector3(0, 0, 0) },
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
  // Arrival → Cortex → Signals → Links (temporal) → later orbit/scatter
  const arrival = THREE.MathUtils.smoothstep(progress / 0.12, 0, 1);
  const cortex = THREE.MathUtils.smoothstep((progress - 0.12) / 0.14, 0, 1);
  const signals = THREE.MathUtils.clamp(
    THREE.MathUtils.smoothstep((progress - 0.28) / 0.08, 0, 1) *
      (1 - THREE.MathUtils.smoothstep((progress - 0.44) / 0.08, 0, 1)),
    0,
    1
  );
  const links = THREE.MathUtils.clamp(
    THREE.MathUtils.smoothstep((progress - 0.42) / 0.06, 0, 1) *
      (1 - THREE.MathUtils.smoothstep((progress - 0.56) / 0.08, 0, 1)),
    0,
    1
  );
  const vision = THREE.MathUtils.clamp(
    THREE.MathUtils.smoothstep((progress - 0.56) / 0.06, 0, 1) *
      (1 - THREE.MathUtils.smoothstep((progress - 0.7) / 0.06, 0, 1)),
    0,
    1
  );
  const balance = THREE.MathUtils.clamp(
    THREE.MathUtils.smoothstep((progress - 0.7) / 0.05, 0, 1) *
      (1 - THREE.MathUtils.smoothstep((progress - 0.84) / 0.06, 0, 1)),
    0,
    1
  );
  const rotateY =
    THREE.MathUtils.lerp(-0.68, -0.48, arrival) +
    cortex * 0.5 +
    signals * 0.55 +
    links * 1.0 +
    vision * 1.4 +
    balance * 1.25 +
    progress * Math.PI * 0.42;
  const rotateX =
    THREE.MathUtils.lerp(0.2, 0.26, arrival) +
    cortex * 0.16 +
    signals * -0.08 +
    links * 0.05 +
    vision * 0.1 +
    balance * 0.3 +
    Math.sin(progress * Math.PI) * 0.07;
  const resolve = THREE.MathUtils.smoothstep(progress / 0.06, 0, 1);
  // P1 · Release constellation opens earlier + fuller; Signals network denser mid-beat
  const release = THREE.MathUtils.smoothstep((progress - 0.84) / 0.13, 0, 1);
  const scale =
    THREE.MathUtils.lerp(1.42, 1.58, resolve) +
    cortex * 0.1 +
    signals * 0.18 +
    links * 0.05 +
    vision * 0.07 +
    balance * 0.12 +
    release * 0.42 +
    Math.sin(progress * Math.PI * 0.85) * 0.04;
  const scatter = release;
  // Partial dissolve during Signals — abstract network, not full constellation
  const network = THREE.MathUtils.clamp(
    THREE.MathUtils.smoothstep((progress - 0.3) / 0.07, 0, 1) *
      (1 - THREE.MathUtils.smoothstep((progress - 0.45) / 0.1, 0, 1)),
    0,
    1
  );
  const scan = THREE.MathUtils.clamp(progress / 0.55, 0, 1);
  // P0 · slightly cooler glow curve — cyan aura without white bloom wash
  const glow =
    THREE.MathUtils.lerp(0.68, 0.88, resolve) +
    cortex * 0.14 +
    signals * 0.18 +
    links * 0.12 +
    vision * 0.14 +
    balance * 0.16 +
    Math.sin(progress * Math.PI * 2) * 0.06 +
    scatter * 0.32;
  const highlight = THREE.MathUtils.clamp(
    THREE.MathUtils.smoothstep((progress - 0.12) / 0.1, 0, 1) *
      (1 - THREE.MathUtils.smoothstep((progress - 0.3) / 0.12, 0, 1)),
    0,
    1
  );
  const pulse = signals;
  const temporal = links;
  const occipital = vision;
  const cerebellum = balance;
  return {
    rotateY,
    rotateX,
    scale,
    scatter,
    network,
    scan,
    glow,
    highlight,
    pulse,
    temporal,
    occipital,
    cerebellum,
    release,
  };
}
