'use client';

import { useRef } from "react";
import { useHeroRenderer } from "./useHeroRenderer";
import PauseButton from "./PauseButton";
import { HERO_CROSSFADE_MS } from "./heroConfig";

// Mounted only by HeroCanvasLoader once canAnimateHero is true. Owns the
// decorative canvas container (absolutely positioned so mounting it never
// shifts layout, RESEARCH Pitfall 5) and the live-only pause control.
export default function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { ready, contextLost, paused, togglePaused } = useHeroRenderer(containerRef);

  const visible = ready && !contextLost;

  const opacityClass = visible ? "opacity-100" : "opacity-0";
  const contextLostClasses = contextLost ? "hidden transition-none" : "";

  return (
    <>
      <div
        ref={containerRef}
        aria-hidden="true"
        data-hero-canvas
        className={`pointer-events-none absolute inset-0 z-0 overflow-hidden transition-opacity ease-out ${opacityClass} ${contextLostClasses}`}
        style={{ transitionDuration: `${HERO_CROSSFADE_MS}ms` }}
      />
      {visible && <PauseButton paused={paused} onToggle={togglePaused} />}
    </>
  );
}
