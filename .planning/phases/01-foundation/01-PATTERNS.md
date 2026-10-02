# Phase 1: Foundation - Pattern Map

**Mapped:** 2026-10-02
**Files analyzed:** 19 (new or modified) + 10 deletions (no pattern needed)
**Analogs found:** 17 / 19 (2 have no in-codebase analog — see "No Analog Found")

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/sections/Hero.tsx` | component | request-response (static render) | `src/app/page.tsx` lines 9-53 (self-extraction) | exact |
| `src/components/sections/Services.tsx` | component | request-response | `src/app/page.tsx` lines 55-83 | exact |
| `src/components/sections/Expertise.tsx` | component | request-response | `src/app/page.tsx` lines 85-175 | exact |
| `src/components/sections/WhyChooseUs.tsx` | component | request-response | `src/app/page.tsx` lines 177-226 | exact |
| `src/components/sections/Contact.tsx` | component | request-response | `src/app/page.tsx` lines 228-273 | exact |
| `src/components/sections/AboutHero.tsx` | component | request-response | `src/app/about/page.tsx` lines 8-57 | exact |
| `src/components/sections/Experience.tsx` | component | request-response | `src/app/about/page.tsx` lines 59-162 | exact |
| `src/components/sections/SkillsExpertise.tsx` | component | request-response | `src/app/about/page.tsx` lines 164-215 | exact |
| `src/components/sections/Education.tsx` | component | request-response | `src/app/about/page.tsx` lines 217-266 | exact |
| `src/app/page.tsx` (rewritten to compose) | route | request-response | itself (current monolith becomes the extraction source) | exact |
| `src/app/about/page.tsx` (rewritten to compose) | route | request-response | `src/app/page.tsx`'s current `Header` import + composition shape | role-match |
| `src/components/Header.tsx` (modified) | component | request-response | itself | exact |
| `src/app/globals.css` (rewritten) | config | transform (build-time CSS) | itself (current v4-syntax-under-v3-engine file) | exact |
| `src/app/layout.tsx` (modified) | route/provider-mount | request-response | itself | exact |
| `postcss.config.mjs` (rewritten, becomes sole file) | config | transform | `postcss.config.js` / `postcss.config.mjs` (current duplicates) | exact |
| `.github/workflows/nextjs.yml` (modified) | config | batch | itself | exact |
| `next.config.js` (verified, kept as-is) | config | transform | itself vs. `next.config.ts`/`next.config.jsold` (anti-pattern reference) | exact |
| `src/hooks/useCapabilities.ts` | hook | event-driven | **none in codebase** — see No Analog Found | no-analog |
| `src/providers/CapabilitiesProvider.tsx` | provider | event-driven | **none in codebase** — see No Analog Found | no-analog |

**Deletions (no pattern extraction needed, just remove):** `next.config.ts`, `next.config.jsold`, `tailwind.config.js`, `tailwind.config.ts`, `postcss.config.js` (keep `.mjs`, rewritten), `src/app/page.tsx.bak`, `src/app/page.tsx.new`, `.github/workflows/.nextoldyml`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`. Also candidate: unused boilerplate SVGs in `public/` if no page references them after extraction (verify with grep during execution).

## Pattern Assignments

### `src/components/sections/*.tsx` (component, request-response) — mechanical extraction

**Analog:** `src/app/page.tsx` (full file, 277 lines) and `src/app/about/page.tsx` (full file, 271 lines) — these ARE the source of truth. Each `{/* X Section */}`-marked block becomes its own file verbatim, minus three scoped changes.

**Imports pattern** (`src/app/page.tsx` lines 1-2):
```tsx
import Image from "next/image";
import Header from "@/components/Header";
```
Section files only need the subset they actually use (e.g. `Services.tsx` needs `Image`, not `Header` — `Header` stays in the composing page). Use the `@/` alias for any internal import, never a relative path (see Shared Patterns below).

**Section boundary pattern** (`src/app/page.tsx` lines 55-83, the Services section, shown as the target shape):
```tsx
{/* Services Section */}
<section id="services" className="py-20 bg-gray-50 dark:bg-gray-900">
  <div className="container mx-auto max-w-6xl px-6">
    <h2 className="text-4xl font-bold text-center mb-16 text-primary dark:text-primary-light">Our Services</h2>
    <div className="grid md:grid-cols-2 gap-8">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:scale-105">
        ...
      </div>
      {/* <div ...Talent Assessment card... </div> */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:scale-105">
        ...
      </div>
    </div>
  </div>
</section>
```
Becomes (target shape per RESEARCH.md Pattern 1 — exact semantic token names are Claude's D-03/D-04 proposal, not fixed by this doc):
```tsx
// src/components/sections/Services.tsx — server component, no 'use client'
import Image from "next/image";

export default function Services() {
  return (
    <section id="services" className="py-20 bg-surface">
      <div className="container mx-auto max-w-6xl px-6">
        <h2 className="text-4xl font-bold text-center mb-16 text-brand">Our Services</h2>
        {/* grid content moved verbatim; dark: classes removed; text-primary -> text-brand, etc. */}
      </div>
    </section>
  );
}
```

**Dead-code deletion targets (D-06)** — delete, do not move, these exact blocks:
- `src/app/page.tsx` lines 32-49: commented hero CTA buttons (`{/* <div className="flex flex-col sm:flex-row...` through `</div> */}`)
- `src/app/page.tsx` lines 67-73: commented "Talent Assessment" card
- `src/components/Header.tsx` lines 29-31: commented "Jobs" nav `<Link>`

**`dark:` class removal pattern (D-02)** — every occurrence across both page files must be stripped, e.g. (`src/app/page.tsx` line 56): `bg-gray-50 dark:bg-gray-900` → `bg-gray-50` (then further renamed to the new semantic surface token). Also strip the entire `@media (prefers-color-scheme: dark)` block from `globals.css` (lines 31-44, see below). Roughly 61 occurrences total across `page.tsx`/`about/page.tsx` per CONTEXT.md D-02 — grep for `dark:` to confirm all are caught.

**Old-token → semantic-token rename surface (D-01/D-04)** — tokens currently in use that need remapping to `surface`/`ink`/`ink-muted`/`brand`/`accent`/`cta`/`border` utilities: `text-primary`, `text-primary-light`, `text-secondary`, `bg-primary`, `bg-primary-dark`, `bg-gray-50`, `bg-gray-100`, `bg-gray-800`, `bg-gray-900`, `text-gray-700`, `text-gray-200`, `border-gray-100`, `border-gray-700`, `border-gray-200`. Full list derived by grepping `page.tsx`, `about/page.tsx`, `Header.tsx` for `primary|secondary|gray-` during execution.

---

### `src/app/page.tsx` (route, request-response) — composition only

**Analog:** itself (current monolith) — target shape explicitly given in RESEARCH.md Pattern 1:
```tsx
import Header from "@/components/Header";
import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import Expertise from "@/components/sections/Expertise";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Hero />
        <Services />
        <Expertise />
        <WhyChooseUs />
        <Contact />
      </main>
    </>
  );
}
```
Per D-08: Home composes exactly these five sections in this order, nothing else.

---

### `src/app/about/page.tsx` (route, request-response) — composition only

**Analog:** current file's own `Header` import plus the above `page.tsx` composition pattern.

**Import fix while touching this file:** current line 2 uses a relative import (`import Header from "../../components/Header";`) — RESEARCH.md/CONTEXT.md both flag this as the one place that deviates from the `@/` alias convention. Since this file is already being rewritten for the section-composition change, fix it to `import Header from "@/components/Header";` to match `page.tsx`'s convention (this is not a D-05 scope violation — it's an import-path fix, not a markup/layout change).

Target shape (per D-07, RESEARCH.md structure):
```tsx
import Header from "@/components/Header";
import AboutHero from "@/components/sections/AboutHero";
import Experience from "@/components/sections/Experience";
import SkillsExpertise from "@/components/sections/SkillsExpertise";
import Education from "@/components/sections/Education";

export default function About() {
  return (
    <>
      <Header />
      <main className="pt-32 min-h-screen">
        <AboutHero />
        <Experience />
        <SkillsExpertise />
        <Education />
      </main>
    </>
  );
}
```

---

### `src/components/Header.tsx` (component, request-response)

**Analog:** itself (current 41-line file, read in full).

**Current full file** (for reference — every line is in scope for token rename, line 6 and 20/23/26/32 for `dark:` removal, lines 29-31 for deletion):
```tsx
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="fixed bg-gray-800 top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/android-chrome-512x512.png" alt="MVForster Talent Solutions" width={150} height={50} className="h-10 w-auto" priority />
          </Link>
          <div className="flex gap-8">
            <Link href="/about" className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary-light transition-colors">About</Link>
            <Link href="/#services" className="...">Services</Link>
            <Link href="/#expertise" className="...">Expertise</Link>
            {/* <Link href="/#jobs" ...>Jobs</Link> */}
            <Link href="/#contact" className="...">Contact</Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
```
**Scoped changes only:** (1) delete the commented Jobs `<Link>` (D-06), (2) strip every `dark:` class, (3) rename `bg-gray-800`/`bg-background`/`text-gray-700`/`text-gray-300`/`text-primary`/`border-gray-200` to new semantic tokens. **Note the pre-existing double-background bug** (`bg-gray-800` AND `bg-background/90` both on the `<header>`, line 6) — RESEARCH.md Pitfall 4 explicitly says this is **out of scope to "fix"** unless the plan scopes it in; it will naturally resolve once both classes map through the token rename, but don't restructure the className beyond the mechanical rename.

---

### `src/app/globals.css` (config, transform) — Tailwind v4 rewrite

**Analog:** itself (current 51-line file, already read in full) — this is the exact bug RESEARCH.md identifies: v4 syntax (`@theme inline`) running under a v3 engine, with broken font variable references.

**Current broken state (full file):**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --foreground: #1a2942;
  --primary: #1e6f5c;
  --primary-light: #29bb89;
  --primary-dark: #184d40;
  --secondary: #2d6187;
  --accent: #29bb89;
  --gray-50: #f8fafc;
  --gray-100: #f1f5f9;
  --gray-600: #475569;
  --gray-700: #334155;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-light: var(--primary-light);
  --color-primary-dark: var(--primary-dark);
  --color-secondary: var(--secondary);
  --color-accent: var(--accent);
  --font-sans: var(--font-geist-sans);   /* BUG: nonexistent — layout.tsx defines --font-inter */
  --font-mono: var(--font-geist-mono);   /* BUG: nonexistent, no mono font loaded anywhere */
}

@media (prefers-color-scheme: dark) {    /* DELETE per D-02 */
  :root { ... }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;  /* BUG: Inter never applies */
}
```

**Target pattern** (RESEARCH.md Architecture Patterns > Pattern 2 — placeholder hex values only, D-03 requires Claude to propose final values + WCAG AA contrast results in the plan):
```css
@import "tailwindcss";

@theme {
  --color-surface: #ffffff;
  --color-ink: #0f1b2e;
  --color-ink-muted: #45526b;
  --color-brand: #0b3d5c;
  --color-accent: #1f8a8c;
  --color-cta: #e8664a;
  --color-border: #d8dee6;

  --font-sans: var(--font-inter);
}

body {
  background: var(--color-surface);
  color: var(--color-ink);
  font-family: var(--font-sans), sans-serif;
}
```
No `@media (prefers-color-scheme: dark)` block at all (D-02). Verification gate per RESEARCH.md Pitfall 2: `npx tailwindcss -i ./src/app/globals.css -o /tmp/out.css` then grep for `.text-brand`/`.bg-surface` etc. — a successful `next build` is not sufficient proof the tokens resolved.

---

### `src/app/layout.tsx` (route/provider-mount, request-response)

**Analog:** itself (current 33-line file, already read in full).

**Current full file:**
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Micah Forster | Technical Recruitment Specialist",
  description: "...",
  icons: { icon: "favicon-16x16.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```
**Scoped change:** wrap `{children}` in `<CapabilitiesProvider>` (RESEARCH.md "Mounting" snippet):
```tsx
import { CapabilitiesProvider } from '@/providers/CapabilitiesProvider'
// ...
<body className={`${inter.variable} antialiased`}>
  <CapabilitiesProvider>{children}</CapabilitiesProvider>
</body>
```
`RootLayout` itself stays a server component — only the provider subtree is client-rendered. No other change to this file (title/metadata/font wiring stay as-is; the font bug is actually in `globals.css`'s `--font-sans` reference, not here — `layout.tsx` already correctly defines `--font-inter`).

---

## Shared Patterns

### `@/` import alias convention
**Source:** `tsconfig.json` (`@/*` → `./src/*`), observed consistently in `src/app/page.tsx` (`import Header from "@/components/Header"`), inconsistently in `src/app/about/page.tsx` (relative import).
**Apply to:** every new file (`sections/*.tsx`, `hooks/*.ts`, `providers/*.tsx`) and the `about/page.tsx` fix. Never introduce a new relative `../../` import.

### Server-component-by-default
**Source:** every existing file in `src/` (`page.tsx`, `about/page.tsx`, `Header.tsx`) — zero `'use client'` directives exist in this codebase today.
**Apply to:** all nine `sections/*.tsx` files stay plain server components (default export, PascalCase, no hooks, no `'use client'`). Only `src/hooks/useCapabilities.ts` and `src/providers/CapabilitiesProvider.tsx` get `'use client'` — per RESEARCH.md Anti-Patterns, do not mark a section client just to reach the capability hook (no section in this phase consumes it anyway).

### Default-exported PascalCase components with inline prop types
**Source:** `export default function Home()`, `export default function About()`, `export default function Header()` — no named exports anywhere in `src/`.
**Apply to:** every new section component (`export default function Hero()`, `export default function Services()`, etc.) and `CapabilitiesProvider` (named export is the one deliberate deviation, required because React Context needs both the provider component and a consumer hook exported — see RESEARCH.md code example, which exports `CapabilitiesProvider` and `useCapabilityVerdicts` as named exports since there's nothing to default-export two things from one file).

### JSX section-marker comments
**Source:** `{/* Services Section */}`, `{/* Expertise Section */}` etc. in `src/app/page.tsx`; `{/* Hero Section */}`, `{/* Experience Section */}` etc. in `src/app/about/page.tsx`.
**Apply to:** Once extracted, each marker comment can be dropped (the filename now carries that meaning) or kept as a top-of-file comment — either is acceptable; don't introduce new commented-out dead JSX per D-06's spirit of not extending the anti-pattern.

### Semantic token utilities only (D-04)
**Source:** none yet exists — this is a new convention `globals.css`'s `@theme` block establishes.
**Apply to:** every component file touched or created in this phase. Components must use only `bg-surface`, `text-ink`, `text-ink-muted`, `bg-brand`/`text-brand`, `bg-accent`/`text-accent`, `bg-cta`/`text-cta`, `border-border` — never raw Tailwind palette classes (`bg-gray-800`, `text-primary`, etc.) after the rewrite.

### Config-file singularity (D-10/FOUND-04)
**Source:** `.planning/codebase/CONCERNS.md`'s documented root cause of the current broken-tokens bug (coexisting dead config files).
**Apply to:** `next.config.js` (keep, delete `.ts`/`.jsold`), `postcss.config.mjs` (keep one, rewritten for v4, delete the other), zero `tailwind.config.*` files (v4 doesn't need one for this project).

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/hooks/useCapabilities.ts` | hook | event-driven | No hooks exist anywhere in `src/` today (zero `useState`/`useEffect`/custom hooks in the current codebase — confirmed by CONTEXT.md/RESEARCH.md's "Data Flow" audit). Use RESEARCH.md's "Code Examples > CapabilitiesProvider" section verbatim as the starting point (full `useCapabilities` implementation with `matchMedia`/WebGL probe/`navigator.connection`/`deviceMemory`/`hardwareConcurrency`, D-12/D-15/D-16 compliant) — it is MEDIUM confidence (adapted from prior milestone research, not yet executed), so the planner should treat it as a strong draft, not a locked contract, and verify the exact verdict names/file locations are still Claude's discretion per CONTEXT.md. |
| `src/providers/CapabilitiesProvider.tsx` | provider | event-driven | No Context providers, no `createContext`/`useContext` usage exists anywhere in `src/` today. Same source as above — RESEARCH.md's `CapabilitiesProvider`/`useCapabilityVerdicts` code example is the reference implementation to adapt, including the `deriveVerdicts()` signal-to-verdict mapping logic required by D-14. |

## Metadata

**Analog search scope:** `src/app/`, `src/components/`, `.github/workflows/`, repo root config files (`next.config.*`, `tailwind.config.*`, `postcss.config.*`, `package.json`) — entire active source tree (no `src/hooks/`, `src/providers/`, or `src/components/sections/` directories exist yet, confirmed via `find src -type f`).
**Files scanned:** 9 (`src/app/page.tsx`, `src/app/about/page.tsx`, `src/components/Header.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `next.config.js`, `next.config.ts`, `next.config.jsold`, `tailwind.config.js`/`.ts`, `postcss.config.js`/`.mjs`, `.github/workflows/nextjs.yml`, `package.json`) plus a full `find src -type f` directory listing.
**Pattern extraction date:** 2026-10-02
