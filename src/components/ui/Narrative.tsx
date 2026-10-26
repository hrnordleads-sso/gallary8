"use client";

import { useEffect, useState } from "react";
import { CHAPTERS } from "@/lib/narrative";
import { chapterFadeOpacity } from "@/lib/chapterFade";
import { subscribeScroll } from "@/lib/scrollStore";

export function Narrative() {
  const [chapter, setChapter] = useState(0);
  const [fade, setFade] = useState(1);

  useEffect(() => {
    return subscribeScroll((state) => {
      setChapter(state.chapter);
      setFade(chapterFadeOpacity(state.progress));
    });
  }, []);

  const current = CHAPTERS[chapter] ?? CHAPTERS[0];
  const showLog = Boolean(current.logCard) && fade > 0.15;
  const align = current.align ?? "left";
  const isArrival = current.id === "arrival";
  const isCortex = current.id === "cortex";
  const isSignals = current.id === "signals";
  const isLinks = current.id === "links";
  const isVision = current.id === "vision";
  const isBalance = current.id === "balance";
  const isRelease = current.id === "release";

  const panelPos =
    align === "right"
      ? isBalance
        ? "sm:ml-auto sm:mr-[5%] md:mr-[7%] lg:mr-[9%] sm:self-end sm:mb-[18vh] md:mb-[20vh]"
        : "sm:ml-auto sm:mr-[5%] md:mr-[7%] lg:mr-[9%] sm:self-start sm:mt-[14vh] md:mt-[16vh]"
      : align === "center"
        ? "sm:mx-auto text-center"
        : isArrival || isVision
          ? "sm:ml-[5%] lg:ml-[6%]"
          : "sm:ml-[4%] md:ml-[5%]";

  const beginAgain = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // P2 · mobile: keep copy in upper band so brain/constellation stay readable
  const mobileStack =
    isArrival || isRelease
      ? "items-start pt-[11vh] sm:items-center sm:pt-0"
      : isCortex
        ? "items-start pt-[16vh] sm:items-start sm:pt-0"
        : isSignals
          ? "items-start pt-[12vh] sm:pt-[16vh]"
          : isLinks
            ? "items-end pb-[30vh] sm:items-center sm:pb-0"
            : isVision
              ? "items-end pb-[28vh] sm:items-end sm:pb-[22vh]"
              : isBalance
                ? "items-end pb-[26vh] sm:items-end sm:pb-0"
                : "items-center";

  return (
    <div className={`pointer-events-none fixed inset-0 z-20 flex ${mobileStack}`}>
      <div
        className={`narrative-panel mx-auto w-full max-w-[22rem] px-5 transition-[opacity,transform] duration-400 ease-out sm:mx-0 sm:max-w-lg sm:px-6 md:max-w-xl ${panelPos} ${
          isArrival ||
          isCortex ||
          isSignals ||
          isLinks ||
          isVision ||
          isBalance ||
          isRelease
            ? "lg:max-w-[36rem]"
            : ""
        } ${
          isArrival || isRelease
            ? "drop-shadow-[0_2px_18px_rgba(1,8,20,0.92)]"
            : ""
        }`}
        style={{
          opacity: fade,
          transform: `translateY(${(1 - fade) * 8}px)`,
        }}
      >
        <p
          className={`mb-2.5 font-mono text-[10px] uppercase tracking-[0.36em] text-[#67e8f9]/90 sm:mb-3 sm:text-[11px] sm:tracking-[0.4em] ${
            isSignals ? "tracking-[0.42em] sm:tracking-[0.48em]" : ""
          }`}
        >
          {current.eyebrow}
        </p>
        <h1
          className={`whitespace-pre-line font-semibold leading-[1.02] tracking-[-0.04em] text-white ${
            isSignals
              ? "text-[clamp(1.85rem,5.2vw,3.5rem)] sm:text-[clamp(2.1rem,4.6vw,3.5rem)]"
              : "text-[clamp(1.95rem,5.6vw,4rem)] sm:text-[clamp(2.25rem,5.2vw,4rem)]"
          }`}
        >
          {current.title}
        </h1>
        {!current.logCard && (
          <p
            className={`mt-4 max-w-md leading-relaxed text-[#a8b8cc]/90 sm:mt-5 ${
              isArrival ||
              isCortex ||
              isLinks ||
              isVision ||
              isBalance ||
              isRelease
                ? "text-[14px] sm:text-base"
                : "text-[13px] sm:text-[15px]"
            } ${align === "center" ? "mx-auto" : ""}`}
          >
            {current.body}
          </p>
        )}
      </div>

      {current.logCard && (
        <div
          className="absolute bottom-[14%] left-1/2 w-[min(92vw,460px)] -translate-x-1/2 border border-[#67e8f9]/22 bg-[#010814]/82 px-3.5 py-3 font-mono text-[10px] text-cyan-50/90 backdrop-blur-md transition-[opacity,transform] duration-400 ease-out sm:bottom-[11%] sm:px-4 sm:py-3.5 sm:text-xs"
          style={{
            opacity: showLog ? fade : 0,
            transform: `translateY(${(1 - fade) * 8}px)`,
          }}
        >
          <div className="mb-2 flex items-center gap-2.5 sm:mb-2.5">
            <span className="flex gap-1" aria-hidden>
              <span className="h-1.5 w-1.5 rounded-full bg-[#67e8f9]/70" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#67e8f9]/45" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#67e8f9]/25" />
            </span>
            <p className="tracking-[0.22em] text-cyan-200">{current.logCard.title}</p>
          </div>
          <p className="leading-relaxed text-slate-300/95">{current.logCard.body}</p>
          <div className="mt-2.5 flex justify-between gap-4 text-[9px] tracking-[0.16em] text-cyan-200/75 sm:mt-3 sm:text-[10px]">
            <span>{current.logCard.rate}</span>
            <span>{current.logCard.channel}</span>
          </div>
        </div>
      )}

      {current.beginAgain && (
        <div
          className="absolute bottom-[16%] left-1/2 -translate-x-1/2 transition-[opacity,transform] duration-400 ease-out sm:bottom-[12%]"
          style={{
            opacity: fade,
            transform: `translateY(${(1 - fade) * 8}px)`,
          }}
        >
          <button
            type="button"
            onClick={beginAgain}
            className="pointer-events-auto border border-white/35 bg-transparent px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.28em] text-white/90 transition-colors hover:border-[#67e8f9]/70 hover:text-[#67e8f9] sm:text-xs"
          >
            [ BEGIN AGAIN ]
          </button>
        </div>
      )}
    </div>
  );
}
