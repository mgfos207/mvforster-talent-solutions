'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { createHeroScene, type HeroScene } from "./heroScene";
import { shouldRun, advanceClock, frameIntervalFor, clampDpr } from "./renderLoop";
import {
  HERO_SEED,
  HERO_DPR_MAX,
  HERO_DPR_MAX_NARROW,
  HERO_NARROW_BREAKPOINT_PX,
  HERO_NARROW_FPS,
} from "./heroConfig";

type UseHeroRendererResult = {
  ready: boolean;
  contextLost: boolean;
  paused: boolean;
  togglePaused: () => void;
};

const MAX_DELTA_SECONDS = 0.1;

// Owns the full createHeroScene() lifecycle: create/destroy, capability-
// independent run gates (in-view, tab-visible, paused, context-lost), the
// rAF loop, passive pointer/touch wiring, and WebGL context-loss recovery.
// This hook never reads useCapabilities() itself — the caller (HeroCanvas,
// mounted only when canAnimateHero is true) owns that gate.
export function useHeroRenderer(
  containerRef: RefObject<HTMLDivElement | null>,
): UseHeroRendererResult {
  const [ready, setReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(() =>
    typeof document === "undefined" ? true : document.visibilityState === "visible",
  );

  const sceneRef = useRef<HeroScene | null>(null);
  const elapsedRef = useRef(0);
  const lastTimestampRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const widthRef = useRef(0);

  // Refs mirroring state for use inside callbacks registered once at mount
  // (IntersectionObserver/ResizeObserver/pointer handlers) that must read
  // the latest gate values without re-subscribing on every change.
  const readyRef = useRef(ready);
  const contextLostRef = useRef(contextLost);
  const pausedRef = useRef(paused);
  const inViewRef = useRef(inView);
  const tabVisibleRef = useRef(tabVisible);

  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);
  useEffect(() => {
    contextLostRef.current = contextLost;
  }, [contextLost]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    inViewRef.current = inView;
  }, [inView]);
  useEffect(() => {
    tabVisibleRef.current = tabVisible;
  }, [tabVisible]);

  const togglePaused = useCallback(() => {
    setPaused((p) => !p);
  }, []);

  // Mount effect: create the scene, wire every observer/listener, clean up
  // everything (including removing the canvas and destroying the scene) on
  // unmount — which also runs when HeroCanvasLoader unmounts this tree
  // because canAnimateHero flipped false mid-visit.
  useEffect(() => {
    if (!containerRef.current) return;
    // Explicitly typed as non-null so it stays non-null-typed when read
    // from inside nested closures below (TS narrowing of containerRef.current
    // itself does not propagate into closures defined later in this effect).
    const container: HTMLDivElement = containerRef.current;

    let destroyed = false;
    let scene: HeroScene | null = null;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    widthRef.current = width;

    try {
      scene = createHeroScene({
        dpr: clampDpr(
          window.devicePixelRatio,
          width,
          HERO_NARROW_BREAKPOINT_PX,
          HERO_DPR_MAX,
          HERO_DPR_MAX_NARROW,
        ),
        seed: HERO_SEED,
      });
    } catch {
      // Fail invisible (the still stays): defer the state update to a
      // callback so no setState runs synchronously inside the effect body.
      requestAnimationFrame(() => {
        if (!destroyed) setContextLost(true);
      });
      return;
    }

    sceneRef.current = scene;
    container.appendChild(scene.canvas);
    scene.resize(width, height);
    // t=0 matches the pre-rendered still (D-05/D-06) so there is no visual
    // jump the instant the canvas becomes the active layer.
    scene.render(0, 0);

    requestAnimationFrame(() => {
      if (!destroyed) setReady(true);
    });

    function onContextLost(event: Event) {
      // Keep the restoration path open (RESEARCH Pitfall 3) even though
      // this phase doesn't attempt to rebuild resources on restore.
      event.preventDefault();
      setContextLost(true);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    }
    function onContextRestored() {
      // Restoration is out of scope this phase (D-06 fail-invisible); the
      // page stays on the still until the visitor reloads.
    }
    scene.canvas.addEventListener("webglcontextlost", onContextLost);
    scene.canvas.addEventListener("webglcontextrestored", onContextRestored);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0 },
    );
    intersectionObserver.observe(container);

    function onVisibilityChange() {
      setTabVisible(document.visibilityState === "visible");
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      const currentScene = sceneRef.current;
      if (!entry || !currentScene) return;
      const w = entry.contentRect.width;
      const h = entry.contentRect.height;
      widthRef.current = w;
      currentScene.resize(w, h);
      const running = shouldRun({
        inView: inViewRef.current,
        tabVisible: tabVisibleRef.current,
        paused: pausedRef.current,
        contextLost: contextLostRef.current,
      });
      // A resize while paused/offscreen must not leave a cleared buffer
      // (D-14: the frozen frame must survive a resize).
      if (!running && readyRef.current && !contextLostRef.current) {
        currentScene.render(elapsedRef.current, 0);
      }
    });
    resizeObserver.observe(container);

    const heroSection = container.closest("section") ?? container;

    function updatePointerFromPoint(clientX: number, clientY: number) {
      if (pausedRef.current) return;
      const currentScene = sceneRef.current;
      if (!currentScene) return;
      const containerRect = container.getBoundingClientRect();
      const x = clientX - containerRect.left;
      const y = clientY - containerRect.top;
      if (x < 0 || y < 0 || x > containerRect.width || y > containerRect.height) {
        currentScene.setPointer(null, null);
      } else {
        currentScene.setPointer(x, y);
      }
    }

    function onPointerMove(event: PointerEvent) {
      if (event.pointerType === "touch") return;
      updatePointerFromPoint(event.clientX, event.clientY);
    }
    function onPointerLeave() {
      sceneRef.current?.setPointer(null, null);
    }
    function onTouchMove(event: TouchEvent) {
      const touch = event.touches[0];
      if (!touch) return;
      updatePointerFromPoint(touch.clientX, touch.clientY);
    }
    function onTouchEnd() {
      sceneRef.current?.setPointer(null, null);
    }

    // Never block the default touch/scroll behavior here (RESEARCH Pitfall
    // 4) — these are all { passive: true } so mobile scroll is never
    // interrupted (D-04).
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave, {
      passive: true,
    });
    heroSection.addEventListener("touchstart", onTouchMove as EventListener, {
      passive: true,
    });
    heroSection.addEventListener("touchmove", onTouchMove as EventListener, {
      passive: true,
    });
    heroSection.addEventListener("touchend", onTouchEnd, { passive: true });
    heroSection.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      destroyed = true;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      heroSection.removeEventListener("touchstart", onTouchMove as EventListener);
      heroSection.removeEventListener("touchmove", onTouchMove as EventListener);
      heroSection.removeEventListener("touchend", onTouchEnd);
      heroSection.removeEventListener("touchcancel", onTouchEnd);
      scene?.canvas.removeEventListener("webglcontextlost", onContextLost);
      scene?.canvas.removeEventListener("webglcontextrestored", onContextRestored);
      scene?.canvas.remove();
      scene?.destroy();
      sceneRef.current = null;
    };
    // Mount-once effect: containerRef identity is stable across the
    // component's lifetime (a ref object), so this intentionally runs only
    // on mount/unmount.
  }, [containerRef]);

  // Loop effect: starts/stops the rAF loop as the gate flips. Runs after
  // the mount effect above (declaration order), so sceneRef is already
  // populated by the time this first runs.
  useEffect(() => {
    const scene = sceneRef.current;
    const run = scene !== null && ready && shouldRun({ inView, tabVisible, paused, contextLost });

    if (!run || !scene) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    // Reset the last-timestamp ref so resuming never computes a bogus
    // delta from a stale previous timestamp (D-14: no jump on resume).
    lastTimestampRef.current = null;

    function frame(timestamp: number) {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }
      const rawDeltaMs = timestamp - lastTimestampRef.current;
      const intervalMs = frameIntervalFor(
        widthRef.current,
        HERO_NARROW_BREAKPOINT_PX,
        HERO_NARROW_FPS,
      );
      if (intervalMs > 0 && rawDeltaMs < intervalMs) {
        rafIdRef.current = requestAnimationFrame(frame);
        return;
      }
      lastTimestampRef.current = timestamp;
      const { elapsed, delta } = advanceClock(
        elapsedRef.current,
        rawDeltaMs / 1000,
        MAX_DELTA_SECONDS,
      );
      elapsedRef.current = elapsed;
      scene!.render(elapsed, delta);
      rafIdRef.current = requestAnimationFrame(frame);
    }

    rafIdRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [inView, tabVisible, paused, contextLost, ready]);

  return { ready, contextLost, paused, togglePaused };
}
