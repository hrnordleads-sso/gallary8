"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import {
  canvasDprMax,
  isConstrainedClient,
  isMobilePerfBand,
  enableSignalThreads,
} from "@/lib/deviceProfile";
import { getBrainLayout } from "@/lib/brainOrigin";
import { prefetchBrainAssets } from "@/lib/loadBrainPoints";
import { BrainCloud } from "./BrainCloud";
import { Starfield } from "./Starfield";
import { ScanBeam } from "./ScanBeam";
import { SignalThreads } from "./SignalThreads";
import { CameraRig } from "./CameraRig";
import { PostFX } from "./PostFX";
import { TimerClockBridge } from "./TimerClockBridge";

function readClientProfile() {
  const layout = getBrainLayout();
  if (typeof window === "undefined") {
    return {
      dprMax: 1,
      antialias: false,
      showThreads: false,
      mobileLights: true,
      fov: layout.fov,
      cam: layout.cameraPos.toArray() as [number, number, number],
      graphicsKey: "ssr",
    };
  }
  const constrained = isConstrainedClient();
  const mobile = isMobilePerfBand();
  return {
    dprMax: canvasDprMax(),
    antialias: !constrained && !mobile,
    showThreads: enableSignalThreads(),
    mobileLights: mobile || constrained,
    fov: layout.fov,
    cam: layout.cameraPos.toArray() as [number, number, number],
    graphicsKey: `${mobile ? "m" : "d"}-${constrained ? "c" : "f"}-${canvasDprMax()}`,
  };
}

function Scene({
  showThreads,
  mobileLights,
  reloadToken,
}: {
  showThreads: boolean;
  mobileLights: boolean;
  reloadToken: number;
}) {
  return (
    <>
      <color attach="background" args={["#010814"]} />
      <fog attach="fog" args={["#010814", 16, 44]} />
      <ambientLight intensity={mobileLights ? 0.18 : 0.14} />
      <pointLight
        position={[2.4, 1.5, 3]}
        intensity={mobileLights ? 1.05 : 1.25}
        color="#67e8f9"
        distance={16}
      />
      {!mobileLights ? (
        <>
          <pointLight position={[-1.8, -0.3, 2.2]} intensity={0.55} color="#22d3ee" distance={12} />
          <pointLight position={[0.2, 2.2, 1.2]} intensity={0.35} color="#a5f3fc" distance={10} />
        </>
      ) : null}
      <Starfield />
      <BrainCloud reloadToken={reloadToken} />
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

type ExperienceProps = {
  reloadToken?: number;
};

export function Experience({ reloadToken = 0 }: ExperienceProps) {
  const [profile, setProfile] = useState(readClientProfile);

  useEffect(() => {
    // Prefetch once from Experience; BrainCloud load shares the same caches
    prefetchBrainAssets();
    const apply = () => setProfile(readClientProfile());
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
        // Scroll-driven only — never steal touch/wheel from #scroll-root (iPad Safari).
        style={{ pointerEvents: "none" }}
        gl={{
          antialias: profile.antialias,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.92,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{
          position: profile.cam,
          fov: profile.fov,
          near: 0.1,
          far: 60,
        }}
      >
        <TimerClockBridge />
        <Suspense fallback={null}>
          <Scene
            key={profile.graphicsKey}
            showThreads={profile.showThreads}
            mobileLights={profile.mobileLights}
            reloadToken={reloadToken}
          />
        </Suspense>
        <AdaptiveDpr pixelated />
      </Canvas>
      <div className="vignette pointer-events-none absolute inset-0" />
    </div>
  );
}
