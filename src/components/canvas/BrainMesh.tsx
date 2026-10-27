"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sampleBrainMotion } from "@/lib/brainGeometry";
import { loadBrainShell } from "@/lib/loadBrainShell";
import { getScrollState } from "@/lib/scrollStore";

/**
 * Soft anatomical under-shell — shape without harsh X-ray wires.
 * Arrival should feel luminous and calm, not like a medical specimen.
 */
export function BrainMesh() {
  const fillMat = useRef<THREE.MeshBasicMaterial>(null);
  const edgeMat = useRef<THREE.LineBasicMaterial>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [edges, setEdges] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    let cancelled = false;
    let geo: THREE.BufferGeometry | null = null;
    let edgeGeo: THREE.BufferGeometry | null = null;
    loadBrainShell()
      .then((g) => {
        if (cancelled) {
          g.dispose();
          return;
        }
        geo = g;
        edgeGeo = new THREE.EdgesGeometry(g, 22);
        setGeometry(g);
        setEdges(edgeGeo);
      })
      .catch((err: unknown) => {
        console.error("[BrainMesh] anatomical shell load failed", err);
      });
    return () => {
      cancelled = true;
      geo?.dispose();
      edgeGeo?.dispose();
    };
  }, []);

  useFrame((_, delta) => {
    const { progress } = getScrollState();
    const { scatter, glow, release } = sampleBrainMotion(progress);
    const dissolve = Math.max(scatter, release);
    if (fillMat.current) {
      const target = THREE.MathUtils.lerp(0.14, 0.0, dissolve) * (0.9 + glow * 0.05);
      fillMat.current.opacity = THREE.MathUtils.damp(fillMat.current.opacity, target, 3.2, delta);
    }
    if (edgeMat.current) {
      const target = THREE.MathUtils.lerp(0.22, 0.0, dissolve) * (0.9 + glow * 0.04);
      edgeMat.current.opacity = THREE.MathUtils.damp(edgeMat.current.opacity, target, 3.2, delta);
    }
  });

  if (!geometry) return null;

  return (
    <group>
      <mesh geometry={geometry} frustumCulled={false}>
        <meshBasicMaterial
          ref={fillMat}
          color="#22d3ee"
          transparent
          opacity={0.14}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      {edges ? (
        <lineSegments geometry={edges} frustumCulled={false}>
          <lineBasicMaterial
            ref={edgeMat}
            color="#67e8f9"
            transparent
            opacity={0.22}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </lineSegments>
      ) : null}
    </group>
  );
}
