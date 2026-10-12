'use client';

import dynamic from "next/dynamic";
import { useCapabilities } from "@/providers/CapabilitiesProvider";

// The ONLY file allowed to call next/dynamic(..., { ssr: false }) — a
// Server Component cannot do this directly (RESEARCH Pitfall 1), so
// Hero.tsx stays a server component and renders this client wrapper
// instead. Because the SSR/first-paint verdict is always false (Phase 1
// D-16), the static HTML never contains the canvas and the ogl chunk is
// only requested after hydration on capable devices.
const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false, loading: () => null });

export default function HeroCanvasLoader() {
  // Single source of truth for whether the hero is allowed to animate at
  // all (src/lib/capabilities.ts). Do not re-derive this rule here — if
  // the verdict later flips false mid-visit, this subtree unmounts and
  // useHeroRenderer's cleanup destroys the scene, leaving the still.
  const { canAnimateHero } = useCapabilities();
  if (!canAnimateHero) return null;
  return <HeroCanvas />;
}
