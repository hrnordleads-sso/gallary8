"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  createBrainCloud,
  sampleBrainMotion,
  type BrainBuffers,
} from "@/lib/brainGeometry";
import { BRAIN_ARRIVAL, getBrainLayout } from "@/lib/brainOrigin";
import { brainKeepRatio, useLiteBrainPoints } from "@/lib/deviceProfile";
import { loadBrainPoints, prefetchBrainAssets } from "@/lib/loadBrainPoints";
import { getScrollIdle, getScrollState } from "@/lib/scrollStore";
import { BrainMesh } from "./BrainMesh";

/** Tiny procedural stand-in so open is instant until anatomical bin lands. */
const PLACEHOLDER_POINTS = 10000;

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
  varying float vScatter;

  void main() {
    vColor = aColor;
    vLayer = aLayer;
    vScatter = uScatter;
    // Soft pulse / twinkle (Step 9 motion polish)
    float twinkle =
      0.86 +
      0.14 * sin(uTime * (1.35 + aPhase * 1.7) + aSeed * 6.2831) +
      0.06 * sin(uTime * (2.8 + aSeed * 1.2) + aPhase * 9.0);
    vec3 dir = normalize(position + vec3(0.0008));
    // Release · full silhouette break — random field, no radial brain puff
    vec3 randDir = normalize(vec3(
      aSeed * 2.0 - 1.0,
      aPhase * 2.0 - 1.0,
      fract(aSeed * 5.73 + aPhase * 3.11) * 2.0 - 1.0
    ));
    float reach = 4.5 + aSeed * 14.0 + aPhase * 9.0;
    vec3 constellation = randDir * reach;
    vec3 mixed = mix(position, constellation, uScatter);

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
    // View-facing rim — sharper cortex edge vs video
    vec3 viewN = normalize(-mvPosition.xyz);
    vRim = pow(1.0 - abs(dot(normalize(mat3(modelViewMatrix) * dir), viewN)), 1.2);

    // Sharp shell read — small dense dots, rim brighter than interior
    float size = aSize * (0.88 + aSeed * 0.28) * (1.0 + uGlow * 0.08) * twinkle;
    size *= (1.0 + aLayer * 0.08 + vRim * 0.75 + vTemporal * 0.28 + vOccipital * 0.32 + vCerebellum * 0.38);
    size *= mix(1.0, 0.28 + aSeed * 0.4, uScatter);
    size *= (265.0 / max(0.5, -mvPosition.z));
    gl_PointSize = clamp(size, 0.65, 3.6);
    gl_Position = projectionMatrix * mvPosition;
    // Soft luminous field — calm open, still a readable cortex
    vAlpha = mix(0.62, 0.92, aSeed) * twinkle * mix(1.0, 0.32, aLayer);
    vAlpha *= mix(1.0, 1.22, vTemporal);
    vAlpha *= mix(1.0, 1.28, vOccipital);
    vAlpha *= mix(1.0, 1.32, vCerebellum);
    // Sparse starfield on Release — keep ~25% of points as bright stars
    float keep = smoothstep(uScatter * 0.68, uScatter * 0.68 + 0.08, aSeed);
    vAlpha *= mix(1.0, keep * (0.45 + aSeed * 0.4), uScatter);
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
  varying float vScatter;
  uniform float uGlow;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;
    // Release: drop most points so additive bloom can't rebuild a solid brain
    if (vScatter > 0.55 && vAlpha < 0.08) discard;

    // Soft luminous sprites — Neural Monitor open, not harsh medical wire
    float soft = smoothstep(0.5, 0.14, d);
    float core = smoothstep(0.16, 0.0, d);

    vec3 col = vColor * (0.92 + uGlow * 0.1);
    col += vColor * core * 0.14;
    col += vec3(0.05, 0.75, 1.0) * vRim * 0.5;
    col += vec3(0.12, 0.72, 1.0) * vTemporal * 0.28;
    col += vec3(0.16, 0.68, 1.0) * vOccipital * 0.32;
    col += vec3(0.2, 0.8, 1.0) * vCerebellum * 0.36;
    col.r = min(col.r, 0.2);
    col.g = min(col.g, 0.92);
    col.b = min(col.b, 1.0);

    float alpha = soft * vAlpha * (0.76 + uGlow * 0.04 + vRim * 0.12 + vTemporal * 0.08 + vOccipital * 0.1 + vCerebellum * 0.12);
    alpha = min(alpha, 0.56);
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
    sizes[i] = data.sizes[src] * 1.05;
    seeds[i * 4] = data.seeds[src * 4];
    seeds[i * 4 + 1] = data.seeds[src * 4 + 1];
    seeds[i * 4 + 2] = data.seeds[src * 4 + 2];
    seeds[i * 4 + 3] = data.seeds[src * 4 + 3];
  }
  return polishBrainBuffers({ positions, colors, sizes, seeds, count });
}

/**
 * Color/size polish only — never displace baked anatomical positions.
 * Push shell contrast so the brain reads clearly on open (not a soft glow blob).
 */
function polishBrainBuffers(data: BrainBuffers): BrainBuffers {
  const { count, positions, colors, sizes, seeds } = data;
  for (let i = 0; i < count; i += 1) {
    const layer = seeds[i * 4 + 3];
    const c = i * 3;
    const x = positions[c];
    const y = positions[c + 1];
    const z = positions[c + 2];
    const radius = Math.hypot(x, y, z);
    const rim = THREE.MathUtils.clamp(radius / 0.85, 0, 1);
    const ridge = Math.abs(Math.sin(x * 18 + z * 14 + y * 11));
    if (layer < 0.5) {
      colors[c] = Math.min(0.2, 0.05 + rim * 0.09);
      colors[c + 1] = Math.min(0.95, 0.5 + rim * 0.38 + ridge * 0.12);
      colors[c + 2] = Math.min(1, 0.78 + rim * 0.22);
      sizes[i] *= 0.78 + rim * 0.28 + ridge * 0.1;
    } else {
      // Soft interior fill — body reads solid like the video, not a hollow rim
      colors[c] *= 0.55;
      colors[c + 1] *= 0.7;
      colors[c + 2] *= 0.82;
      sizes[i] *= 0.7;
    }
  }
  return { positions, colors, sizes, seeds, count };
}

export function BrainCloud({ particleCount = 200000 }: Props) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const layout = useRef(getBrainLayout());
  const basePos = useRef(layout.current.origin.clone());
  const baseScale = useRef(layout.current.scale);

  const [buffers, setBuffers] = useState<BrainBuffers>(() =>
    createBrainCloud(PLACEHOLDER_POINTS)
  );

  useEffect(() => {
    prefetchBrainAssets();
    let cancelled = false;
    loadBrainPoints()
      .then((data) => {
        if (cancelled) return;
        const keep = useLiteBrainPoints() ? 1 : brainKeepRatio();
        const next =
          keep < 0.99 ? thinBuffers(data, keep) : polishBrainBuffers(data);
        // Defer geometry swap one frame so first paint stays smooth
        requestAnimationFrame(() => {
          if (!cancelled) setBuffers(next);
        });
      })
      .catch((err: unknown) => {
        console.error("[BrainCloud] anatomical load failed — keeping placeholder", err);
        if (!cancelled) {
          setBuffers(createBrainCloud(Math.min(particleCount, 48000)));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [particleCount]);

  const geometry = useMemo(() => buffersToGeometry(buffers), [buffers]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScatter: { value: 0 },
      uGlow: { value: 0.78 },
      uPulse: { value: 0 },
      uHighlight: { value: 0 },
      uTemporal: { value: 0 },
      uOccipital: { value: 0 },
      uCerebellum: { value: 0 },
    }),
    []
  );

  useFrame((state, delta) => {
    const { progress, reducedMotion } = getScrollState();
    const motion = sampleBrainMotion(progress);
    const idle = getScrollIdle();
    const matUniforms = material.current?.uniforms ?? uniforms;
    const scatterTarget = Math.max(motion.scatter, motion.network * 0.32);

    matUniforms.uTime.value += reducedMotion ? delta * 0.2 : delta;
    // Snap near end so scrub lag can't leave a solid brain on Release
    if (motion.scatter > 0.85) {
      matUniforms.uScatter.value = THREE.MathUtils.damp(
        matUniforms.uScatter.value,
        scatterTarget,
        12,
        delta
      );
      if (matUniforms.uScatter.value < scatterTarget - 0.02) {
        matUniforms.uScatter.value = Math.min(
          scatterTarget,
          matUniforms.uScatter.value + delta * 2.5
        );
      }
    } else {
      matUniforms.uScatter.value = THREE.MathUtils.damp(
        matUniforms.uScatter.value,
        scatterTarget,
        scatterTarget > 0.2 ? 5.5 : 3.2,
        delta
      );
    }
    matUniforms.uGlow.value = THREE.MathUtils.damp(
      matUniforms.uGlow.value,
      motion.glow + idle * 0.04,
      3,
      delta
    );
    matUniforms.uPulse.value = THREE.MathUtils.damp(
      matUniforms.uPulse.value,
      motion.pulse,
      3.2,
      delta
    );
    matUniforms.uHighlight.value = THREE.MathUtils.damp(
      matUniforms.uHighlight.value,
      motion.highlight,
      2.8,
      delta
    );
    matUniforms.uTemporal.value = THREE.MathUtils.damp(
      matUniforms.uTemporal.value,
      motion.temporal,
      2.6,
      delta
    );
    matUniforms.uOccipital.value = THREE.MathUtils.damp(
      matUniforms.uOccipital.value,
      motion.occipital,
      2.6,
      delta
    );
    matUniforms.uCerebellum.value = THREE.MathUtils.damp(
      matUniforms.uCerebellum.value,
      motion.cerebellum,
      2.6,
      delta
    );

    if (group.current) {
      const t = state.clock.elapsedTime;
      layout.current = getBrainLayout();
      basePos.current.copy(layout.current.origin);
      baseScale.current = layout.current.scale;
      // P3 · idle micro-breath + slow yaw drift when scroll is still
      const driftY = Math.sin(t * 0.18) * 0.028 * idle;
      const driftX = Math.cos(t * 0.14) * 0.01 * idle;
      const breath = 1 + Math.sin(t * 0.65) * 0.014 * idle;
      const arrivalBlend = 1 - THREE.MathUtils.smoothstep(progress / 0.1, 0, 1);
      const scaleTarget =
        THREE.MathUtils.lerp(motion.scale, baseScale.current, arrivalBlend) * breath;

      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        motion.rotateY + driftY,
        2.2,
        delta
      );
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        motion.rotateX + driftX,
        2.2,
        delta
      );
      const s = THREE.MathUtils.damp(group.current.scale.x, scaleTarget, 2.8, delta);
      group.current.scale.setScalar(s);

      group.current.position.x = basePos.current.x + Math.sin(t * 0.12) * 0.012 * idle;
      group.current.position.y = basePos.current.y + Math.cos(t * 0.16) * 0.008 * idle;
    }
  });

  return (
    <group
      ref={(node) => {
        group.current = node;
        if (node && node.userData.bootstrapped !== true) {
          const boot = getBrainLayout();
          node.rotation.copy(BRAIN_ARRIVAL.rotation);
          node.scale.setScalar(boot.scale);
          node.position.copy(boot.origin);
          node.userData.bootstrapped = true;
        }
      }}
      position={getBrainLayout().origin.toArray() as [number, number, number]}
    >
      {/* Anatomical under-shell — fold silhouette; particles carry electric glow */}
      <BrainMesh />
      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={material}
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
