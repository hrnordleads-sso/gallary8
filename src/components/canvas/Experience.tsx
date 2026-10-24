"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, Preload } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";
import { BrainCloud } from "./BrainCloud";
import { Starfield } from "./Starfield";
import { ScanBeam } from "./ScanBeam";
import { CameraRig } from "./CameraRig";
import { PostFX } from "./PostFX";

function Scene() {
  return (
    <>
      <color attach="background" args={["#010814"]} />
      <fog attach="fog" args={["#010814", 10, 32]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[2.4, 1.8, 3.2]} intensity={3.2} color="#67e8f9" distance={14} />
      <pointLight position={[-2.2, -0.6, 2.4]} intensity={1.2} color="#38bdf8" distance={12} />
      <pointLight position={[0.6, 0.2, -1.5]} intensity={1.6} color="#22d3ee" distance={10} />
      <Starfield />
      <BrainCloud />
      <ScanBeam />
      <CameraRig />
      <Suspense fallback={null}>
        <PostFX />
      </Suspense>
      <Preload all />
    </>
  );
}

export function Experience() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.35,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{ position: [-0.35, 0.12, 3.15], fov: 40, near: 0.1, far: 60 }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
      </Canvas>
      <div className="brain-glow pointer-events-none absolute inset-0" />
      <div className="vignette pointer-events-none absolute inset-0" />
    </div>
  );
}
