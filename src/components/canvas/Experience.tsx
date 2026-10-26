"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, Preload } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";
import { BrainCloud } from "./BrainCloud";
import { BrainAura } from "./BrainAura";
import { Starfield } from "./Starfield";
import { ScanBeam } from "./ScanBeam";
import { SignalThreads } from "./SignalThreads";
import { CameraRig } from "./CameraRig";
import { PostFX } from "./PostFX";

function Scene() {
  return (
    <>
      <color attach="background" args={["#010814"]} />
      <fog attach="fog" args={["#010814", 15, 42]} />
      <ambientLight intensity={0.16} />
      <pointLight position={[2.4, 1.5, 3]} intensity={1.0} color="#67e8f9" distance={16} />
      <pointLight position={[-1.8, -0.3, 2.2]} intensity={0.45} color="#40e0d0" distance={12} />
      <Starfield />
      <BrainAura />
      <BrainCloud />
      <SignalThreads />
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
          toneMappingExposure: 0.72,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{ position: [-0.72, 0.06, 3.35], fov: 38, near: 0.1, far: 60 }}
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
