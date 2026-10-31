"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ExperienceErrorBoundary } from "@/components/canvas/ExperienceErrorBoundary";
import { FieldCallouts } from "@/components/ui/FieldCallouts";
import { HUD } from "@/components/ui/HUD";
import { MonitorLoader } from "@/components/ui/MonitorLoader";
import { Narrative } from "@/components/ui/Narrative";
import { ScrollController } from "@/components/ScrollController";
import {
  getBrainLoadState,
  requestBrainLoadRetry,
  resetBrainLoadAttemptsForQa,
  setBrainLoadBooting,
  subscribeBrainLoad,
} from "@/lib/brainLoadStore";
import { clearBrainPointsCache } from "@/lib/loadBrainPoints";
import { clearBrainShellCache } from "@/lib/loadBrainShell";

const Experience = dynamic(
  () => import("@/components/canvas/Experience").then((m) => m.Experience),
  { ssr: false }
);

export function NeuralMonitorExperience() {
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    setBrainLoadBooting();
    const unsub = subscribeBrainLoad((state) => {
      setReloadToken(state.reloadToken);
    });

    // Dev/QA bridge for B4 asset scenarios (stripped from production builds)
    if (process.env.NODE_ENV !== "production") {
      (
        window as Window & {
          __G8_BRAIN_QA?: {
            retry: () => boolean;
            setForce: (mode: string | null) => void;
            resetAttempts: () => void;
            getState: () => ReturnType<typeof getBrainLoadState>;
            lastLoad: () =>
              | {
                  source: "lite" | "full";
                  keep: number;
                  count: number;
                }
              | null;
          };
        }
      ).__G8_BRAIN_QA = {
        setForce: (mode) => {
          const w = window as Window & {
            __G8_FORCE_BRAIN_ASSETS?: string;
            __G8_BRAIN_FAIL_ONCE_DONE?: boolean;
          };
          if (!mode) {
            delete w.__G8_FORCE_BRAIN_ASSETS;
            delete w.__G8_BRAIN_FAIL_ONCE_DONE;
            return;
          }
          w.__G8_FORCE_BRAIN_ASSETS = mode;
          delete w.__G8_BRAIN_FAIL_ONCE_DONE;
        },
        resetAttempts: () => {
          resetBrainLoadAttemptsForQa();
        },
        retry: () => {
          clearBrainPointsCache();
          clearBrainShellCache();
          return requestBrainLoadRetry();
        },
        getState: () => getBrainLoadState(),
        lastLoad: () => {
          const w = window as Window & {
            __G8_BRAIN_LAST_LOAD?: {
              source: "lite" | "full";
              keep: number;
              count: number;
            };
          };
          return w.__G8_BRAIN_LAST_LOAD ?? null;
        },
      };
    }

    return () => {
      unsub();
      if (process.env.NODE_ENV !== "production") {
        delete (window as Window & { __G8_BRAIN_QA?: unknown }).__G8_BRAIN_QA;
      }
    };
  }, []);

  return (
    <main className="relative min-h-[700vh] bg-[var(--navy)] text-[var(--foreground)]">
      <ExperienceErrorBoundary reloadToken={reloadToken}>
        <Experience key={reloadToken} reloadToken={reloadToken} />
      </ExperienceErrorBoundary>
      <MonitorLoader />
      <Narrative />
      <FieldCallouts />
      <HUD />
      <ScrollController />
      <a
        href="#narrative-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-black focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to scroll narrative
      </a>
    </main>
  );
}
