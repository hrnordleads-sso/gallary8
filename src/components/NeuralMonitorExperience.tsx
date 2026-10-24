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
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-16 focus:z-50 focus:bg-black focus:px-3 focus:py-2"
      >
        Skip to scroll narrative
      </a>
    </main>
  );
}
