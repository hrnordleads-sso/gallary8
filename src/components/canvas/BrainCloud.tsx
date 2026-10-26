"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  createBrainCloud,
  sampleBrainMotion,
  type BrainBuffers,
} from "@/lib/brainGeometry";
import { loadBrainPoints } from "@/lib/loadBrainPoints";
import { getScrollState } from "@/lib/scrollStore";

const vertexShader = /* glsl */ `
  attribute float aSeed;
  attribute float aPhase;
  attribute float aSize;
  attribute float aLayer;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uScatter;
  uniform float uGlow;
  uniform float uPulse;
  uniform float uHighlight;
  uniform float uTemporal;
  uniform float uOccipital;
  uniform float uCerebellum;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vLayer;
  varying float vRim;
  varying float vTemporal;
  varying float vOccipital;
  varying float vCerebellum;

  void main() {
    vColor = aColor;
    vLayer = aLayer;
    // Soft pulse / twinkle (Step 9 motion polish)
    float twinkle =
      0.86 +
      0.14 * sin(uTime * (1.35 + aPhase * 1.7) + aSeed * 6.2831) +
      0.06 * sin(uTime * (2.8 + aSeed * 1.2) + aPhase * 9.0);
    vec3 dir = normalize(position + vec3(0.0008));
    vec3 scattered = position + dir * (aSeed * 5.8 + aPhase * 2.8 + 1.2);
    vec3 mixed = mix(position, scattered, uScatter);

    mixed += dir * sin(uTime * 0.45 + aSeed * 9.0) * 0.012 * (1.0 - uScatter);
    mixed += dir * sin(uTime * 3.4 + aSeed * 20.0) * 0.01 * uPulse;
    mixed += dir * sin(uTime * 1.1 + aSeed * 4.0) * 0.004 * (1.0 - uScatter);

    float region = smoothstep(0.08, 0.5, mixed.z + uHighlight * 0.4 - abs(mixed.x) * 0.12);
    mixed += dir * region * uHighlight * 0.025;

    // Temporal flank — lateral mid-band (Links / Network chapter)
    float temporalMask =
      smoothstep(0.12, 0.55, abs(mixed.x)) *
      (1.0 - smoothstep(0.25, 0.65, abs(mixed.y + 0.05))) *
      smoothstep(-0.35, 0.15, mixed.z);
    vTemporal = temporalMask * uTemporal;
    mixed += dir * vTemporal * 0.035;

    // Occipital pole — posterior band (Vision chapter)
    float occipitalMask =
      smoothstep(0.05, -0.4, mixed.z) *
      (1.0 - smoothstep(0.3, 0.7, abs(mixed.y - 0.05))) *
      (1.0 - smoothstep(0.45, 0.75, abs(mixed.x)));
    vOccipital = occipitalMask * uOccipital;
    mixed += dir * vOccipital * 0.04;

    // Cerebellum — lower posterior mass (Balance chapter)
    float cerebellumMask =
      smoothstep(-0.05, -0.45, mixed.y) *
      smoothstep(0.15, -0.35, mixed.z) *
      (1.0 - smoothstep(0.4, 0.75, abs(mixed.x)));
    vCerebellum = cerebellumMask * uCerebellum;
    mixed += dir * vCerebellum * 0.045;

    vec4 mvPosition = modelViewMatrix * vec4(mixed, 1.0);
    // View-facing rim — denser silhouette like the Neural Monitor video
    vec3 viewN = normalize(-mvPosition.xyz);
    vRim = pow(1.0 - abs(dot(normalize(mat3(modelViewMatrix) * dir), viewN)), 1.6);

    // Smaller points so cortical folds stay readable (not a white cloud)
    float size = aSize * (1.35 + aSeed * 0.65) * (1.0 + uGlow * 0.15) * twinkle;
    size *= (1.0 + aLayer * 0.3 + vRim * 0.25 + vTemporal * 0.35 + vOccipital * 0.4 + vCerebellum * 0.5);
    size *= (280.0 / max(0.5, -mvPosition.z));
    gl_PointSize = clamp(size, 1.0, 8.0);
    gl_Position = projectionMatrix * mvPosition;
    vAlpha = mix(0.48, 0.72, aSeed) * twinkle * mix(1.0, 0.22, aLayer);
    vAlpha *= mix(1.0, 1.25, vTemporal);
    vAlpha *= mix(1.0, 1.3, vOccipital);
    vAlpha *= mix(1.0, 1.35, vCerebellum);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vLayer;
  varying float vRim;
  varying float vTemporal;
  varying float vOccipital;
  varying float vCerebellum;
  uniform float uGlow;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;

    float soft = smoothstep(0.5, 0.1, d);
    float core = smoothstep(0.18, 0.0, d);

    // Soft electric cyan — rim lift, hard-cap so additive never washes white
    vec3 col = vColor * (0.72 + uGlow * 0.18);
    col += vColor * core * 0.14;
    col += vec3(0.08, 0.55, 0.95) * vRim * 0.28;
    col += vec3(0.15, 0.75, 1.0) * vTemporal * 0.35;
    col += vec3(0.2, 0.7, 1.0) * vOccipital * 0.4;
    col += vec3(0.25, 0.85, 1.0) * vCerebellum * 0.45;
    col.r = min(col.r, 0.28);
    col.g = min(col.g, 0.82);
    col.b = min(col.b, 1.0);

    float alpha = soft * vAlpha * (0.65 + uGlow * 0.08 + vRim * 0.1 + vTemporal * 0.12 + vOccipital * 0.14 + vCerebellum * 0.16);
    gl_FragColor = vec4(col, alpha);
  }
`;

type Props = {
  particleCount?: number;
};

function buffersToGeometry(buffers: BrainBuffers) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(buffers.positions, 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(buffers.colors, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(buffers.sizes, 1));
  const seeds = new Float32Array(buffers.count);
  const phases = new Float32Array(buffers.count);
  const layers = new Float32Array(buffers.count);
  for (let i = 0; i < buffers.count; i += 1) {
    seeds[i] = buffers.seeds[i * 4];
    phases[i] = buffers.seeds[i * 4 + 1];
    layers[i] = buffers.seeds[i * 4 + 3];
  }
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geo.setAttribute("aLayer", new THREE.BufferAttribute(layers, 1));
  return geo;
}

function thinBuffers(data: BrainBuffers, ratio: number): BrainBuffers {
  const step = Math.max(1, Math.round(1 / ratio));
  const count = Math.floor(data.count / step);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < count; i += 1) {
    const src = i * step;
    positions[i * 3] = data.positions[src * 3];
    positions[i * 3 + 1] = data.positions[src * 3 + 1];
    positions[i * 3 + 2] = data.positions[src * 3 + 2];
    colors[i * 3] = data.colors[src * 3];
    colors[i * 3 + 1] = data.colors[src * 3 + 1];
    colors[i * 3 + 2] = data.colors[src * 3 + 2];
    sizes[i] = data.sizes[src] * 1.1;
    seeds[i * 4] = data.seeds[src * 4];
    seeds[i * 4 + 1] = data.seeds[src * 4 + 1];
    seeds[i * 4 + 2] = data.seeds[src * 4 + 2];
    seeds[i * 4 + 3] = data.seeds[src * 4 + 3];
  }
  return { positions, colors, sizes, seeds, count };
}

export function BrainCloud({ particleCount = 160000 }: Props) {
  const group = useRef<THREE.Group>(null);

  const [buffers, setBuffers] = useState<BrainBuffers>(() => {
    if (typeof window === "undefined") {
      return createBrainCloud(Math.min(particleCount, 80000));
    }
    const mobile = window.innerWidth < 900 || window.devicePixelRatio > 2;
    return createBrainCloud(mobile ? Math.floor(particleCount * 0.55) : particleCount);
  });

  useEffect(() => {
    let cancelled = false;
    loadBrainPoints()
      .then((data) => {
        if (cancelled) return;
        const mobile =
          typeof window !== "undefined" &&
          (window.innerWidth < 900 || window.devicePixelRatio > 2);
        setBuffers(mobile ? thinBuffers(data, 0.5) : data);
      })
      .catch((err: unknown) => {
        console.error("[BrainCloud] anatomical load failed — keeping procedural brain", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const geometry = useMemo(() => buffersToGeometry(buffers), [buffers]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScatter: { value: 0 },
      uGlow: { value: 0.95 },
      uPulse: { value: 0 },
      uHighlight: { value: 0 },
      uTemporal: { value: 0 },
      uOccipital: { value: 0 },
      uCerebellum: { value: 0 },
    }),
    []
  );

  useFrame((_, delta) => {
    const { progress, reducedMotion } = getScrollState();
    const motion = sampleBrainMotion(progress);
    uniforms.uTime.value += reducedMotion ? delta * 0.2 : delta;
    uniforms.uScatter.value = THREE.MathUtils.damp(
      uniforms.uScatter.value,
      Math.max(motion.scatter, motion.network * 0.38),
      3.5,
      delta
    );
    uniforms.uGlow.value = THREE.MathUtils.damp(
      uniforms.uGlow.value,
      motion.glow,
      3,
      delta
    );
    uniforms.uPulse.value = THREE.MathUtils.damp(
      uniforms.uPulse.value,
      motion.pulse,
      3.2,
      delta
    );
    uniforms.uHighlight.value = THREE.MathUtils.damp(
      uniforms.uHighlight.value,
      motion.highlight,
      2.8,
      delta
    );
    uniforms.uTemporal.value = THREE.MathUtils.damp(
      uniforms.uTemporal.value,
      motion.temporal,
      2.6,
      delta
    );
    uniforms.uOccipital.value = THREE.MathUtils.damp(
      uniforms.uOccipital.value,
      motion.occipital,
      2.6,
      delta
    );
    uniforms.uCerebellum.value = THREE.MathUtils.damp(
      uniforms.uCerebellum.value,
      motion.cerebellum,
      2.6,
      delta
    );

    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        motion.rotateY,
        2.2,
        delta
      );
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        motion.rotateX,
        2.2,
        delta
      );
      const s = THREE.MathUtils.damp(group.current.scale.x, motion.scale, 2.2, delta);
      group.current.scale.setScalar(s);
    }
  });

  return (
    <group
      ref={(node) => {
        group.current = node;
        if (node && node.userData.bootstrapped !== true) {
          // Arrival hero (ref frames): face slightly left, right-of-center
          node.rotation.set(0.22, -0.62, 0.08);
          node.scale.setScalar(1.42);
          node.userData.bootstrapped = true;
        }
      }}
      position={[0.62, 0.02, 0]}
    >
      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
