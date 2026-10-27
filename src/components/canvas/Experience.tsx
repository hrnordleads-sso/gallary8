"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, Preload } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { canvasDprMax, isConstrainedClient } from "@/lib/deviceProfile";
import { getBrainLayout } from "@/lib/brainOrigin";
import { prefetchBrainAssets } from "@/lib/loadBrainPoints";
import { BrainCloud } from "./BrainCloud";
import { Starfield } from "./Starfield";
import { ScanBeam } from "./ScanBeam";
import { SignalThreads } from "./SignalThreads";
import { CameraRig } from "./CameraRig";
import { PostFX } from "./PostFX";

function Scene({ showThreads }: { showThreads: boolean }) {
  return (
    <>
      <color attach="background" args={["#010814"]} />
      <fog attach="fog" args={["#010814", 15, 42]} />
      <ambientLight intensity={0.16} />
      <pointLight position={[2.4, 1.5, 3]} intensity={1.0} color="#67e8f9" distance={16} />
      <pointLight position={[-1.8, -0.3, 2.2]} intensity={0.45} color="#40e0d0" distance={12} />
      <Starfield />
      <BrainCloud />
      {showThreads ? <SignalThreads /> : null}
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
  const [profile, setProfile] = useState({
    dprMax: 1.5,
    antialias: true,
    showThreads: true,
    fov: 38,
    cam: [-0.3, 0.08, 3.8] as [number, number, number],
  });

  useEffect(() => {
    prefetchBrainAssets();
    const apply = () => {
      const constrained = isConstrainedClient();
      const layout = getBrainLayout();
      setProfile({
        dprMax: canvasDprMax(),
        antialias: !constrained,
        showThreads: !constrained,
        fov: layout.fov,
        cam: layout.cameraPos.toArray() as [number, number, number],
      });
    };
    apply();
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 touch-none">
      <Canvas
        dpr={[1, profile.dprMax]}
        gl={{
          antialias: profile.antialias,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.84,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{
          position: profile.cam,
          fov: profile.fov,
          near: 0.1,
          far: 60,
        }}
      >
        <Suspense fallback={null}>
          <Scene showThreads={profile.showThreads} />
        </Suspense>
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
      </Canvas>
      <div className="vignette pointer-events-none absolute inset-0" />
    </div>
  );
}
