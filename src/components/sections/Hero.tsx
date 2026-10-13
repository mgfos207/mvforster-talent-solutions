import HeroCanvasLoader from "@/components/hero/HeroCanvasLoader";
import {
  HERO_STILL_MEDIA,
  HERO_STILL_SIZES,
  HERO_STILL_SRC,
} from "@/components/hero/heroConfig";

// Shared by both chooser links so "I'm hiring" and "I'm looking for work"
// are visually identical (equal weight, D-09): translucent glass pill, no
// coral/teal, high-contrast on-brand text, visible focus ring.
const chooserLinkClass =
  "inline-flex items-center justify-center rounded-full border border-on-brand/40 bg-on-brand/10 px-8 py-4 text-lg font-bold leading-tight text-on-brand backdrop-blur-sm transition-colors hover:bg-on-brand/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-brand md:min-w-60";

export default function Hero() {
  return (
    <section className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-brand-strong">
      {/* Pre-rendered still (D-05): server-rendered, LCP-safe first paint and
          permanent fallback for canAnimateHero === false. No overlay scrim
          needed — the shader itself is authored to keep text-box contrast.
          Three tier-matched stills (mobile, tablet, desktop): each is
          rendered inside its served width range, so the first live frame
          matches on every served viewport. Media queries, srcs, and dims
          all come from heroConfig so they cannot drift from the tested
          ranges (02-07, REVIEW WR-04). */}
      <div aria-hidden="true" className="absolute inset-0 z-0">
        <picture>
          <source
            media={HERO_STILL_MEDIA.mobile}
            srcSet={HERO_STILL_SRC.mobile}
            type="image/webp"
          />
          <source
            media={HERO_STILL_MEDIA.tablet}
            srcSet={HERO_STILL_SRC.tablet}
            type="image/webp"
          />
          {/* Plain <img>, not the Next.js Image component: art-directed
              picture still, and images are unoptimized under static export.
              The no-img-element lint rule already exempts <img> inside
              <picture>. */}
          <img
            src={HERO_STILL_SRC.desktop}
            alt=""
            width={HERO_STILL_SIZES.desktop.width}
            height={HERO_STILL_SIZES.desktop.height}
            fetchPriority="high"
            className="h-full w-full object-cover"
          />
        </picture>
      </div>

      {/* Client island: renders nothing on the server and on non-capable
          devices; on capable devices it paints the canvas above the still
          and the bottom-right pause control (HERO-01). */}
      <HeroCanvasLoader />

      {/* Content */}
      <div className="relative z-10 container mx-auto max-w-6xl px-6 pt-28 pb-48 text-center text-on-brand md:pt-32">
        <h1 className="mb-8 text-5xl leading-[1.1] font-bold text-balance md:text-7xl">
          Great care starts with the right people
        </h1>
        <p className="mx-auto mb-8 max-w-3xl text-xl leading-normal md:text-2xl">
          We connect healthcare, behavioral health, and healthcare admin teams
          with BCBAs, RBTs, and professionals who truly care about the people
          they serve.
        </p>

        {/* Audience chooser (HERO-05): plain anchors, no JS required (D-10).
            #employers/#candidates resolve inside Services/Expertise until
            Phase 3 builds the real sections. */}
        <nav
          aria-label="Choose your path"
          className="mx-auto flex max-w-sm flex-col items-stretch gap-2 md:max-w-none md:flex-row md:items-center md:justify-center md:gap-4"
        >
          <a href="#employers" className={chooserLinkClass}>
            I&apos;m hiring
          </a>
          <a href="#candidates" className={chooserLinkClass}>
            I&apos;m looking for work
          </a>
        </nav>

        {/* Reserved CTA slot (D-11): keeps room for the Phase 3 coral "Book
            an intro chat" button. Must stay empty in Phase 2. */}
        <div data-hero-cta-slot className="mt-12 min-h-14" />
      </div>
    </section>
  );
}
