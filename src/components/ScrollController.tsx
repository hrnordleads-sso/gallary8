"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CHAPTERS } from "@/lib/narrative";
import { resolveScrollScrub } from "@/lib/scrollScrub";
import { setReducedMotion, setScrollProgress } from "@/lib/scrollStore";

gsap.registerPlugin(ScrollTrigger);

/** Scroll-driven chapter progress — scrub adapts to reduced-motion + coarse pointer. */
export function ScrollController() {
  useEffect(() => {
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarseMq = window.matchMedia("(pointer: coarse)");
    const hoverNoneMq = window.matchMedia("(hover: none)");

    let trigger: ScrollTrigger | null = null;
    const settleTimers: number[] = [];

    const createTrigger = () => {
      trigger?.kill();
      trigger = ScrollTrigger.create({
        trigger: "#scroll-root",
        start: "top top",
        end: "bottom bottom",
        scrub: resolveScrollScrub(motionMq.matches),
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          setScrollProgress(self.progress, CHAPTERS.length);
        },
      });
    };

    const applyMotion = () => {
      setReducedMotion(motionMq.matches);
      createTrigger();
      ScrollTrigger.refresh();
    };

    applyMotion();
    motionMq.addEventListener("change", applyMotion);
    coarseMq.addEventListener("change", applyMotion);
    hoverNoneMq.addEventListener("change", applyMotion);

    setScrollProgress(0, CHAPTERS.length);

    let refreshTimer = 0;
    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        ScrollTrigger.refresh();
      }, 120);
    };

    // visualViewport scroll fires often on iOS chrome — longer debounce than resize
    let vvScrollTimer = 0;
    const scheduleVvScrollRefresh = () => {
      window.clearTimeout(vvScrollTimer);
      vvScrollTimer = window.setTimeout(() => {
        ScrollTrigger.refresh();
      }, 320);
    };

    /** iOS Safari often finishes layout after orientationchange — double settle. */
    const scheduleOrientationSettle = () => {
      scheduleRefresh();
      for (const ms of [280, 700]) {
        settleTimers.push(
          window.setTimeout(() => {
            ScrollTrigger.refresh();
          }, ms)
        );
      }
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) ScrollTrigger.refresh();
    };

    window.addEventListener("resize", scheduleRefresh);
    window.addEventListener("orientationchange", scheduleOrientationSettle);
    window.addEventListener("pageshow", onPageShow);

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", scheduleRefresh);
      vv.addEventListener("scroll", scheduleVvScrollRefresh);
    }

    settleTimers.push(window.setTimeout(() => ScrollTrigger.refresh(), 120));

    return () => {
      window.clearTimeout(refreshTimer);
      window.clearTimeout(vvScrollTimer);
      for (const id of settleTimers) window.clearTimeout(id);
      window.removeEventListener("resize", scheduleRefresh);
      window.removeEventListener("orientationchange", scheduleOrientationSettle);
      window.removeEventListener("pageshow", onPageShow);
      if (vv) {
        vv.removeEventListener("resize", scheduleRefresh);
        vv.removeEventListener("scroll", scheduleVvScrollRefresh);
      }
      motionMq.removeEventListener("change", applyMotion);
      coarseMq.removeEventListener("change", applyMotion);
      hoverNoneMq.removeEventListener("change", applyMotion);
      trigger?.kill();
    };
  }, []);

  return (
    <div id="scroll-root" className="relative z-10" aria-hidden>
      {CHAPTERS.map((chapter) => (
        <section
          key={chapter.id}
          data-chapter={chapter.id}
          className="h-[118svh] w-full"
        />
      ))}
    </div>
  );
}
