"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, Preload } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { isConstrainedClient } from "@/lib/deviceProfile";
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
  const [profile, setProfile] = useState({ dprMax: 1.5, antialias: true });

  useEffect(() => {
    const constrained = isConstrainedClient();
    setProfile({
      dprMax: constrained ? 1.25 : 1.5,
      antialias: !constrained,
    });
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        dpr={[1, profile.dprMax]}
        gl={{
          antialias: profile.antialias,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.66,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{ position: [-0.88, 0.08, 3.55], fov: 38, near: 0.1, far: 60 }}
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
