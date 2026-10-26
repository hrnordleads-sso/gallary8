"use client";

import dynamic from "next/dynamic";
import { HUD } from "@/components/ui/HUD";
import { Narrative } from "@/components/ui/Narrative";
import { FieldCallouts } from "@/components/ui/FieldCallouts";
import { ScrollController } from "@/components/ScrollController";

const Experience = dynamic(
  () => import("@/components/canvas/Experience").then((m) => m.Experience),
  { ssr: false }
);

export function NeuralMonitorExperience() {
  return (
    <main className="relative min-h-[700vh] bg-[var(--navy)] text-[var(--foreground)]">
      <Experience />
      <Narrative />
      <FieldCallouts />
      <HUD />
      <ScrollController />
      <a
        href="#scroll-root"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-black focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to scroll narrative
      </a>
    </main>
  );
}
