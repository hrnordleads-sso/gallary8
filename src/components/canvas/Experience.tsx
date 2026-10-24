"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, Preload } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Suspense } from "react";
import * as THREE from "three";
import { BrainCloud } from "./BrainCloud";
import { Starfield } from "./Starfield";
import { ScanBeam } from "./ScanBeam";
import { CameraRig } from "./CameraRig";

function Scene() {
  return (
    <>
      <color attach="background" args={["#010814"]} />
      <fog attach="fog" args={["#010814", 7, 26]} />
      <ambientLight intensity={0.22} />
      <pointLight position={[2.4, 1.8, 3.2]} intensity={2.4} color="#67e8f9" distance={12} />
      <pointLight position={[-2.2, -0.6, 2.4]} intensity={0.9} color="#38bdf8" distance={10} />
      <pointLight position={[0.6, 0.2, -1.5]} intensity={1.1} color="#22d3ee" distance={8} />
      <Starfield />
      <BrainCloud />
      <ScanBeam />
      <CameraRig />
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.55}
          luminanceThreshold={0.12}
          luminanceSmoothing={0.55}
          mipmapBlur
          radius={0.72}
        />
        <Noise opacity={0.025} blendFunction={BlendFunction.SOFT_LIGHT} />
        <Vignette offset={0.28} darkness={0.72} />
      </EffectComposer>
      <Preload all />
    </>
  );
}

export function Experience() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        dpr={[1, 1.85]}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.NoToneMapping,
        }}
        camera={{ position: [-0.35, 0.12, 3.15], fov: 40, near: 0.1, far: 60 }}
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
