"use client";

import dynamic from "next/dynamic";
import { HUD } from "@/components/ui/HUD";
import { Narrative } from "@/components/ui/Narrative";
import { ScrollController } from "@/components/ScrollController";

const Experience = dynamic(
  () => import("@/components/canvas/Experience").then((m) => m.Experience),
  { ssr: false }
);

export function NeuralMonitorExperience() {
  return (
    <main className="relative min-h-[700vh] bg-[#020617] text-white">
      <Experience />
      <Narrative />
      <HUD />
      <ScrollController />
      <a
        href="#scroll-root"
        className="absolute left-4 top-16 z-50 -translate-y-[200%] rounded bg-black px-3 py-2 text-sm text-white focus:translate-y-0"
      >
        Skip to scroll narrative
      </a>
    </main>
  );
}
