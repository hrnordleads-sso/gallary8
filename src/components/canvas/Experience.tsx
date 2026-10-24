"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, Preload } from "@react-three/drei";
import { Suspense } from "react";
import { BrainCloud } from "./BrainCloud";
import { Starfield } from "./Starfield";
import { ScanBeam } from "./ScanBeam";
import { CameraRig } from "./CameraRig";

function Scene() {
  return (
    <>
      <color attach="background" args={["#020617"]} />
      <fog attach="fog" args={["#020617", 6, 22]} />
      <ambientLight intensity={0.15} />
      <pointLight position={[2, 2, 3]} intensity={1.2} color="#38bdf8" />
      <pointLight position={[-3, -1, 2]} intensity={0.45} color="#818cf8" />
      <Starfield />
      <BrainCloud />
      <ScanBeam />
      <CameraRig />
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
        }}
        camera={{ position: [0.15, 0.05, 3.6], fov: 42, near: 0.1, far: 60 }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
      </Canvas>
      <div className="vignette pointer-events-none absolute inset-0" />
    </div>
  );
}
