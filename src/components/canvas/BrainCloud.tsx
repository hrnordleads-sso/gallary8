"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createBrainCloud, sampleBrainMotion } from "@/lib/brainGeometry";
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
  varying vec3 vColor;
  varying float vAlpha;
  varying float vLayer;

  void main() {
    vColor = aColor;
    vLayer = aLayer;
    float twinkle = 0.82 + 0.18 * sin(uTime * (1.8 + aPhase * 2.0) + aSeed * 6.2831);
    vec3 dir = normalize(position + vec3(0.0008));
    vec3 scattered = position + dir * (aSeed * 5.5 + aPhase * 2.8 + 1.2);
    vec3 mixed = mix(position, scattered, uScatter);

    // Soft breathing
    mixed += dir * sin(uTime * 0.55 + aSeed * 9.0) * 0.018 * (1.0 - uScatter);
    // Neural firing pulse
    mixed += dir * sin(uTime * 4.2 + aSeed * 22.0) * 0.014 * uPulse;

    // Region highlight lift
    float region = smoothstep(0.15, 0.55, mixed.z + uHighlight * 0.4 - mixed.x * 0.2);
    mixed += dir * region * uHighlight * 0.04;

    vec4 mvPosition = modelViewMatrix * vec4(mixed, 1.0);
    float size = aSize * (3.6 + aSeed * 2.8) * (1.0 + uGlow * 0.7) * twinkle;
    size *= (1.0 + aLayer * 1.1);
    size *= (380.0 / max(0.5, -mvPosition.z));
    gl_PointSize = clamp(size, 1.6, 52.0);
    gl_Position = projectionMatrix * mvPosition;
    vAlpha = mix(0.85, 1.0, aSeed) * twinkle * mix(1.0, 0.55, aLayer);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vLayer;
  uniform float uGlow;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;

    float soft = smoothstep(0.5, 0.02, d);
    float core = smoothstep(0.2, 0.0, d);
    float halo = smoothstep(0.5, 0.18, d);

    vec3 col = vColor * (1.35 + uGlow * 1.1);
    col += vec3(0.75, 0.98, 1.0) * core * (1.45 - vLayer * 0.3);
    col += vColor * halo * 0.55 * (0.7 + vLayer);

    float alpha = soft * vAlpha * (1.05 + uGlow * 0.4);
    gl_FragColor = vec4(col, alpha);
  }
`;

type Props = {
  particleCount?: number;
};

export function BrainCloud({ particleCount = 140000 }: Props) {
  const group = useRef<THREE.Group>(null);

  const buffers = useMemo(() => {
    const mobile =
      typeof window !== "undefined" &&
      (window.innerWidth < 900 || window.devicePixelRatio > 2);
    const count = mobile ? Math.floor(particleCount * 0.5) : particleCount;
    return createBrainCloud(count);
  }, [particleCount]);

  const geometry = useMemo(() => {
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
  }, [buffers]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScatter: { value: 0 },
      uGlow: { value: 1.2 },
      uPulse: { value: 0 },
      uHighlight: { value: 0 },
    }),
    []
  );

  useFrame((_, delta) => {
    const { progress, reducedMotion } = getScrollState();
    const motion = sampleBrainMotion(progress);
    uniforms.uTime.value += reducedMotion ? delta * 0.2 : delta;
    uniforms.uScatter.value = THREE.MathUtils.damp(
      uniforms.uScatter.value,
      motion.scatter,
      3.5,
      delta
    );
    uniforms.uGlow.value = THREE.MathUtils.damp(
      uniforms.uGlow.value,
      motion.glow,
      3,
      delta
    );
    uniforms.uPulse.value = THREE.MathUtils.smoothstep((progress - 0.36) / 0.22, 0, 1);
    uniforms.uHighlight.value = THREE.MathUtils.damp(
      uniforms.uHighlight.value,
      motion.highlight,
      2.8,
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
    <group ref={group} position={[0.62, 0.04, 0]} scale={1.22}>
      {/* Soft volumetric core glow */}
      <mesh>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshBasicMaterial
          color="#0891b2"
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.95, 32, 32]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.045}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
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
