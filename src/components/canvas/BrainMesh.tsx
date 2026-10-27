"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sampleBrainMotion } from "@/lib/brainGeometry";
import { loadBrainShell } from "@/lib/loadBrainShell";
import { getScrollState } from "@/lib/scrollStore";

/**
 * Cyan lattice shell — dense fold wires + soft fill (reference wireframe cerebrum).
 */
export function BrainMesh() {
  const fillMat = useRef<THREE.MeshBasicMaterial>(null);
  const edgeMat = useRef<THREE.LineBasicMaterial>(null);
  const fineMat = useRef<THREE.LineBasicMaterial>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [edges, setEdges] = useState<THREE.BufferGeometry | null>(null);
  const [fineEdges, setFineEdges] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    let cancelled = false;
    let geo: THREE.BufferGeometry | null = null;
    let edgeGeo: THREE.BufferGeometry | null = null;
    let fineGeo: THREE.BufferGeometry | null = null;
    loadBrainShell()
      .then((g) => {
        if (cancelled) {
          g.dispose();
          return;
        }
        geo = g;
        // Lower thresholds → denser sulcal lattice like the reference mesh
        edgeGeo = new THREE.EdgesGeometry(g, 14);
        fineGeo = new THREE.EdgesGeometry(g, 8);
        setGeometry(g);
        setEdges(edgeGeo);
        setFineEdges(fineGeo);
      })
      .catch((err: unknown) => {
        console.error("[BrainMesh] anatomical shell load failed", err);
      });
    return () => {
      cancelled = true;
      geo?.dispose();
      edgeGeo?.dispose();
      fineGeo?.dispose();
    };
  }, []);

  useFrame((_, delta) => {
    const { progress } = getScrollState();
    const { scatter, glow, release } = sampleBrainMotion(progress);
    const dissolve = Math.max(scatter, release);
    if (fillMat.current) {
      const target = THREE.MathUtils.lerp(0.1, 0.0, dissolve) * (0.92 + glow * 0.06);
      fillMat.current.opacity = THREE.MathUtils.damp(fillMat.current.opacity, target, 3.2, delta);
    }
    if (edgeMat.current) {
      const target = THREE.MathUtils.lerp(0.48, 0.0, dissolve) * (0.92 + glow * 0.08);
      edgeMat.current.opacity = THREE.MathUtils.damp(edgeMat.current.opacity, target, 3.2, delta);
    }
    if (fineMat.current) {
      const target = THREE.MathUtils.lerp(0.28, 0.0, dissolve) * (0.9 + glow * 0.06);
      fineMat.current.opacity = THREE.MathUtils.damp(fineMat.current.opacity, target, 3.2, delta);
    }
  });

  if (!geometry) return null;

  return (
    <group>
      <mesh geometry={geometry} frustumCulled={false}>
        <meshBasicMaterial
          ref={fillMat}
          color="#06b6d4"
          transparent
          opacity={0.1}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      {fineEdges ? (
        <lineSegments geometry={fineEdges} frustumCulled={false}>
          <lineBasicMaterial
            ref={fineMat}
            color="#22d3ee"
            transparent
            opacity={0.28}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </lineSegments>
      ) : null}
      {edges ? (
        <lineSegments geometry={edges} frustumCulled={false}>
          <lineBasicMaterial
            ref={edgeMat}
            color="#67e8f9"
            transparent
            opacity={0.48}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </lineSegments>
      ) : null}
    </group>
  );
}
