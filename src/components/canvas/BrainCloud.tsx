"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createBrainCloud, sampleBrainMotion } from "@/lib/brainGeometry";
import { getScrollState } from "@/lib/scrollStore";

const vertexShader = /* glsl */ `
  attribute float aSeed;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uScatter;
  uniform float uGlow;
  uniform float uPulse;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    float twinkle = 0.85 + 0.15 * sin(uTime * (1.5 + aPhase) + aSeed * 6.2831);
    vec3 scattered = position + normalize(position + vec3(0.001)) * (aSeed * 4.5 + aPhase * 2.0);
    vec3 mixed = mix(position, scattered, uScatter);
    mixed.y += sin(uTime * 0.6 + aSeed * 10.0) * 0.02 * (1.0 - uScatter);
    mixed += normalize(position + 0.01) * sin(uTime * 3.0 + aSeed * 20.0) * 0.012 * uPulse;

    vec4 mvPosition = modelViewMatrix * vec4(mixed, 1.0);
    float size = (2.4 + aSeed * 2.8) * (1.0 + uGlow * 0.35) * twinkle;
    size *= (300.0 / -mvPosition.z);
    gl_PointSize = clamp(size, 1.0, 28.0);
    gl_Position = projectionMatrix * mvPosition;
    vAlpha = mix(0.55, 0.95, aSeed) * twinkle;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uGlow;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.08, d);
    float core = smoothstep(0.22, 0.0, d);
    vec3 col = vColor * (0.75 + uGlow * 0.55) + vec3(0.55, 0.85, 1.0) * core * 0.65;
    gl_FragColor = vec4(col, soft * vAlpha);
  }
`;

type Props = {
  particleCount?: number;
};

export function BrainCloud({ particleCount = 90000 }: Props) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);

  const buffers = useMemo(() => {
    const mobile =
      typeof window !== "undefined" &&
      (window.innerWidth < 900 || window.devicePixelRatio > 2);
    const count = mobile ? Math.floor(particleCount * 0.45) : particleCount;
    return createBrainCloud(count);
  }, [particleCount]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(buffers.positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(buffers.colors, 3));
    const seeds = new Float32Array(buffers.count);
    const phases = new Float32Array(buffers.count);
    for (let i = 0; i < buffers.count; i += 1) {
      seeds[i] = buffers.seeds[i * 4];
      phases[i] = buffers.seeds[i * 4 + 1];
    }
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    return geo;
  }, [buffers]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScatter: { value: 0 },
      uGlow: { value: 1 },
      uPulse: { value: 0 },
    }),
    []
  );

  useFrame((state, delta) => {
    const { progress, reducedMotion } = getScrollState();
    const motion = sampleBrainMotion(progress);
    uniforms.uTime.value += reducedMotion ? delta * 0.15 : delta;
    uniforms.uScatter.value = THREE.MathUtils.damp(
      uniforms.uScatter.value,
      motion.scatter,
      4,
      delta
    );
    uniforms.uGlow.value = THREE.MathUtils.damp(
      uniforms.uGlow.value,
      motion.glow,
      3,
      delta
    );
    uniforms.uPulse.value = THREE.MathUtils.smoothstep((progress - 0.38) / 0.2, 0, 1);

    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        motion.rotateY,
        2.5,
        delta
      );
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        motion.rotateX,
        2.5,
        delta
      );
      const s = THREE.MathUtils.damp(
        group.current.scale.x,
        motion.scale,
        2.5,
        delta
      );
      group.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={group} position={[0.45, 0.05, 0]}>
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
