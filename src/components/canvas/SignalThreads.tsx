"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sampleBrainMotion } from "@/lib/brainGeometry";
import { getScrollState } from "@/lib/scrollStore";

const NODE_COUNT = 48;
const EDGE_COUNT = 64;

/**
 * Step 4 · SIGNALS — faint axonal threads (ref frames 014–016).
 * Pattern mirrors ScanBeam: scroll-gated additive overlay, no interaction.
 */
export function SignalThreads() {
  const linesRef = useRef<THREE.LineSegments>(null);
  const nodesRef = useRef<THREE.Points>(null);
  const lineMat = useRef<THREE.LineBasicMaterial>(null);
  const nodeMat = useRef<THREE.PointsMaterial>(null);

  const { edgePositions, nodePositions } = useMemo(() => {
    const nodes = new Float32Array(NODE_COUNT * 3);
    for (let i = 0; i < NODE_COUNT; i += 1) {
      const r = 0.35 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      nodes[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      nodes[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.55;
      nodes[i * 3 + 2] = r * Math.cos(phi) * 0.7;
    }

    const edgePositions = new Float32Array(EDGE_COUNT * 6);
    for (let e = 0; e < EDGE_COUNT; e += 1) {
      const a = Math.floor(Math.random() * NODE_COUNT);
      let b = Math.floor(Math.random() * NODE_COUNT);
      if (b === a) b = (b + 1) % NODE_COUNT;
      const o = e * 6;
      edgePositions[o] = nodes[a * 3];
      edgePositions[o + 1] = nodes[a * 3 + 1];
      edgePositions[o + 2] = nodes[a * 3 + 2];
      edgePositions[o + 3] = nodes[b * 3];
      edgePositions[o + 4] = nodes[b * 3 + 1];
      edgePositions[o + 5] = nodes[b * 3 + 2];
    }

    return { edgePositions, nodePositions: nodes };
  }, []);

  useFrame((state, delta) => {
    const { progress } = getScrollState();
    const { pulse, network, temporal, scatter } = sampleBrainMotion(progress);
    if (!linesRef.current || !nodesRef.current || !lineMat.current || !nodeMat.current) {
      return;
    }

    // Signals: dense traffic · Links: quieter arcs · Release: constellation web
    const strength = Math.max(
      pulse * 0.85,
      network * 0.95,
      temporal * 0.5,
      scatter * 0.75
    );
    lineMat.current.opacity = THREE.MathUtils.damp(
      lineMat.current.opacity,
      strength * 0.28,
      5,
      delta
    );
    nodeMat.current.opacity = THREE.MathUtils.damp(
      nodeMat.current.opacity,
      strength * 0.55,
      5,
      delta
    );

    linesRef.current.rotation.y = state.clock.elapsedTime * 0.04;
    nodesRef.current.rotation.y = state.clock.elapsedTime * 0.04;
    linesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.06;
  });

  return (
    <group position={[0.35, 0.02, 0]}>
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
          size={0.035}
          color="#e0f2fe"
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
