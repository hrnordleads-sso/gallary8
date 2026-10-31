"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CHAPTERS } from "@/lib/narrative";
import { setReducedMotion, setScrollProgress } from "@/lib/scrollStore";

gsap.registerPlugin(ScrollTrigger);

/** P1 · cine scrub — longer beats + silkier lag so camera/FX stay continuous. */
export function ScrollController() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    let trigger: ScrollTrigger | null = null;

    const createTrigger = () => {
      trigger?.kill();
      trigger = ScrollTrigger.create({
        trigger: "#scroll-root",
        start: "top top",
        end: "bottom bottom",
        scrub: media.matches ? 0.12 : 1.05,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          setScrollProgress(self.progress, CHAPTERS.length);
        },
      });
    };

    const applyMotion = () => {
      setReducedMotion(media.matches);
      createTrigger();
      ScrollTrigger.refresh();
    };

    applyMotion();
    media.addEventListener("change", applyMotion);

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

    window.addEventListener("resize", scheduleRefresh);
    window.addEventListener("orientationchange", scheduleRefresh);

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", scheduleRefresh);
      vv.addEventListener("scroll", scheduleVvScrollRefresh);
    }

    const settle = window.setTimeout(() => ScrollTrigger.refresh(), 120);

    return () => {
      window.clearTimeout(settle);
      window.clearTimeout(refreshTimer);
      window.clearTimeout(vvScrollTimer);
      window.removeEventListener("resize", scheduleRefresh);
      window.removeEventListener("orientationchange", scheduleRefresh);
      if (vv) {
        vv.removeEventListener("resize", scheduleRefresh);
        vv.removeEventListener("scroll", scheduleVvScrollRefresh);
      }
      media.removeEventListener("change", applyMotion);
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
