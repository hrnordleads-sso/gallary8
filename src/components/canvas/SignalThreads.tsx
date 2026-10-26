"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sampleBrainMotion } from "@/lib/brainGeometry";
import { getScrollState } from "@/lib/scrollStore";

const NODE_COUNT = 84;
const EDGE_COUNT = 120;
const PULSE_COUNT = 28;

function hash(n: number): number {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * SIGNALS traffic + RELEASE constellation web.
 * Pattern mirrors ScanBeam: scroll-gated additive overlay, no interaction.
 */
export function SignalThreads() {
  const group = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const nodesRef = useRef<THREE.Points>(null);
  const pulsesRef = useRef<THREE.Points>(null);
  const lineMat = useRef<THREE.LineBasicMaterial>(null);
  const nodeMat = useRef<THREE.PointsMaterial>(null);
  const pulseMat = useRef<THREE.PointsMaterial>(null);

  const { edgePositions, nodePositions, pulseMeta } = useMemo(() => {
    const nodes = new Float32Array(NODE_COUNT * 3);
    for (let i = 0; i < NODE_COUNT; i += 1) {
      // Prefer a flattened ellipsoid around the specimen (not a full sphere)
      const r = 0.42 + hash(i * 1.7) * 1.55;
      const theta = hash(i * 2.3) * Math.PI * 2;
      const phi = Math.acos(2 * hash(i * 3.1) - 1);
      nodes[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      nodes[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.48;
      nodes[i * 3 + 2] = r * Math.cos(phi) * 0.62;
    }

    // Prefer short edges → denser axonal / constellation look (ref 014–016, 033)
    const edgePositions = new Float32Array(EDGE_COUNT * 6);
    for (let e = 0; e < EDGE_COUNT; e += 1) {
      const a = Math.floor(hash(e * 4.7) * NODE_COUNT);
      let best = (a + 1) % NODE_COUNT;
      let bestD = Infinity;
      for (let k = 0; k < 10; k += 1) {
        const b = Math.floor(hash(e * 11.3 + k * 3.9) * NODE_COUNT);
        if (b === a) continue;
        const dx = nodes[a * 3] - nodes[b * 3];
        const dy = nodes[a * 3 + 1] - nodes[b * 3 + 1];
        const dz = nodes[a * 3 + 2] - nodes[b * 3 + 2];
        const d = dx * dx + dy * dy + dz * dz;
        if (d < bestD && d > 0.04) {
          bestD = d;
          best = b;
        }
      }
      const o = e * 6;
      edgePositions[o] = nodes[a * 3];
      edgePositions[o + 1] = nodes[a * 3 + 1];
      edgePositions[o + 2] = nodes[a * 3 + 2];
      edgePositions[o + 3] = nodes[best * 3];
      edgePositions[o + 4] = nodes[best * 3 + 1];
      edgePositions[o + 5] = nodes[best * 3 + 2];
    }

    const pulseMeta = Array.from({ length: PULSE_COUNT }, (_, i) => ({
      edge: Math.floor(hash(i * 5.5) * EDGE_COUNT),
      speed: 0.35 + hash(i * 7.1) * 0.9,
      phase: hash(i * 9.3),
    }));

    return { edgePositions, nodePositions: nodes, pulseMeta };
  }, []);

  const pulsePositions = useMemo(() => new Float32Array(PULSE_COUNT * 3), []);

  useFrame((state, delta) => {
    const { progress } = getScrollState();
    const { pulse, network, temporal, scatter } = sampleBrainMotion(progress);
    if (
      !group.current ||
      !linesRef.current ||
      !nodesRef.current ||
      !pulsesRef.current ||
      !lineMat.current ||
      !nodeMat.current ||
      !pulseMat.current
    ) {
      return;
    }

    // Signals: dense traffic · Links: quieter arcs · Release: wide constellation web
    const signalsStrength = Math.max(pulse * 0.95, network * 1.0);
    const releaseStrength = scatter * 0.9;
    const linksStrength = temporal * 0.45;
    const strength = Math.max(signalsStrength, linksStrength, releaseStrength);

    lineMat.current.opacity = THREE.MathUtils.damp(
      lineMat.current.opacity,
      strength * (0.22 + scatter * 0.18 + pulse * 0.12),
      5.5,
      delta
    );
    nodeMat.current.opacity = THREE.MathUtils.damp(
      nodeMat.current.opacity,
      strength * (0.5 + pulse * 0.2),
      5.5,
      delta
    );
    pulseMat.current.opacity = THREE.MathUtils.damp(
      pulseMat.current.opacity,
      Math.max(pulse, network * 0.7) * 0.85,
      6,
      delta
    );

    // Expand into open-field constellation on Release
    const expand = 1 + network * 0.35 + scatter * 2.1;
    const s = THREE.MathUtils.damp(group.current.scale.x, expand, 2.4, delta);
    group.current.scale.setScalar(s);

    const spin = 0.035 + pulse * 0.06 + scatter * 0.02;
    linesRef.current.rotation.y = state.clock.elapsedTime * spin;
    nodesRef.current.rotation.y = state.clock.elapsedTime * spin;
    pulsesRef.current.rotation.y = state.clock.elapsedTime * spin;
    const tilt = Math.sin(state.clock.elapsedTime * 0.22) * (0.05 + pulse * 0.04);
    linesRef.current.rotation.x = tilt;
    nodesRef.current.rotation.x = tilt;
    pulsesRef.current.rotation.x = tilt;

    // Traveling axonal pulses along edges (Signals beat)
    const t = state.clock.elapsedTime;
    for (let i = 0; i < PULSE_COUNT; i += 1) {
      const meta = pulseMeta[i];
      const o = meta.edge * 6;
      const u = (t * meta.speed + meta.phase) % 1;
      pulsePositions[i * 3] =
        edgePositions[o] + (edgePositions[o + 3] - edgePositions[o]) * u;
      pulsePositions[i * 3 + 1] =
        edgePositions[o + 1] + (edgePositions[o + 4] - edgePositions[o + 1]) * u;
      pulsePositions[i * 3 + 2] =
        edgePositions[o + 2] + (edgePositions[o + 5] - edgePositions[o + 2]) * u;
    }
    const attr = pulsesRef.current.geometry.getAttribute("position");
    if (attr) {
      (attr.array as Float32Array).set(pulsePositions);
      attr.needsUpdate = true;
    }

    nodeMat.current.size = 0.028 + pulse * 0.012 + scatter * 0.01;
  });

  return (
    <group ref={group} position={[0.4, 0.02, 0]}>
      <lineSegments ref={linesRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edgePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          ref={lineMat}
          color="#7dd3fc"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      <points ref={nodesRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nodePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={nodeMat}
          size={0.03}
          color="#e0f2fe"
          transparent
          opacity={0}
          depthWrite={false}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points ref={pulsesRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pulsePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={pulseMat}
          size={0.055}
          color="#67e8f9"
          transparent
          opacity={0}
          depthWrite={false}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
