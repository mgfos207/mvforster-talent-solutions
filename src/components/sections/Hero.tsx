import HeroCanvasLoader from "@/components/hero/HeroCanvasLoader";

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
          needed — the shader itself is authored to keep text-box contrast. */}
      <div aria-hidden="true" className="absolute inset-0 z-0">
        <picture>
          <source
            media="(max-width: 767px)"
            srcSet="/hero/hero-still-mobile.webp"
            type="image/webp"
          />
          {/* Plain <img>, not the Next.js Image component: art-directed
              picture still, and images are unoptimized under static export.
              The no-img-element lint rule already exempts <img> inside
              <picture>. */}
          <img
            src="/hero/hero-still-desktop.webp"
            alt=""
            width={1920}
            height={1080}
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

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-32 bg-linear-to-t from-surface to-transparent"
      />
    </section>
  );
}
