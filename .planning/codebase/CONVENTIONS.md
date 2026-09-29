# Coding Conventions

**Analysis Date:** 2026-09-29

## Naming Patterns

**Files:**
- Route pages use the Next.js App Router convention: `src/app/<route>/page.tsx` (e.g. `src/app/about/page.tsx`, `src/app/goals/page.tsx`).
- The root layout is `src/app/layout.tsx`.
- Shared components use PascalCase filenames matching their default export: `src/components/Header.tsx` exports `Header`.
- Stray/backup files exist alongside real source and are NOT part of the build but sit in the tree: `src/app/page.tsx.bak`, `src/app/page.tsx.new`. These are dead weight — do not treat them as reference implementations, and remove them if touching `src/app/page.tsx`.

**Functions/Components:**
- React components are default-exported functions named in PascalCase matching the route/purpose: `export default function Home()`, `export default function About()`, `export default function RootLayout()`, `export default function Header()`.
- No named (non-default) component exports observed anywhere in `src/`.

**Variables:**
- Local consts use camelCase (e.g. `inter` in `src/app/layout.tsx` for the `next/font/google` instance).
- No hooks, no state variables, no custom variable-heavy logic exists yet — the codebase is presentational/static JSX only.

**Types:**
- Inline TypeScript types are used directly in function signatures rather than separate `type`/`interface` declarations, e.g. `src/app/layout.tsx`:
  ```typescript
  export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
  ```
- No dedicated `types/` directory or shared type definition files exist. If adding shared types, there is no established convention to follow — establish one (e.g. `src/types/*.ts`) rather than inferring from precedent.

## Code Style

**Formatting:**
- No Prettier config file exists (no `.prettierrc*`). Formatting is whatever the author's editor produced — inconsistent indentation of nested JSX exists in places (e.g. `src/app/about/page.tsx` lines 9-11 have irregular indentation of nested `<div>` elements).
- 2-space indentation is the dominant style across all files.
- Double quotes are used for imports (`"next/image"` in `page.tsx`), but single quotes appear in `src/components/Header.tsx` (`'next/link'`, `'next/image'`). No enforced consistency — ESLint does not include a quote-style rule.

**Linting:**
- ESLint config: `eslint.config.mjs` (flat config format).
- Extends `next/core-web-vitals` and `next/typescript` via `FlatCompat` from `@eslint/eslintrc`.
- Ignores: `node_modules/**`, `.next/**`, `out/**`, `build/**`, `next-env.d.ts`.
- No custom rules added beyond the Next.js defaults. No `no-unused-vars`, import-order, or accessibility-specific overrides configured explicitly (these come only from whatever `next/core-web-vitals` bundles).
- Run via `npm run lint` (calls `eslint` directly — see `package.json`).

## Import Organization

**Order:**
- No enforced import order (no `eslint-plugin-import` or `simple-import-sort` configured). Observed pattern in existing files:
  1. External/framework imports first (`next/image`, `next/link`, `next/font/google`)
  2. Local component imports next, using the `@/` path alias in most files but relative paths in at least one file
  3. CSS imports last, only in `layout.tsx` (`import "./globals.css"`)

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in `tsconfig.json` `compilerOptions.paths`).
- Usage is inconsistent: `src/app/page.tsx` imports `Header` via `import Header from "@/components/Header"`, but `src/app/about/page.tsx` imports the same component via a relative path `import Header from "../../components/Header"`. When adding new imports of internal modules, prefer the `@/` alias — it is the established path mapping even though not universally applied yet.

## Error Handling

**Patterns:**
- No error handling exists anywhere in the codebase. There are no `try`/`catch` blocks, no API routes, no form submissions, no data fetching, and no Next.js `error.tsx` or `not-found.tsx` files. The site is 100% static marketing content with no client-side or server-side logic beyond rendering JSX.
- If server actions, forms, or data fetching are introduced, there is no existing pattern to extend — establish conventional Next.js error boundaries (`error.tsx`) and typed error returns from the start.

## Logging

**Framework:** None. No `console.log`, logging library, or telemetry exists in `src/`.

**Patterns:**
- Not applicable — no logging present anywhere in the codebase.

## Comments

**When to Comment:**
- JSX section markers are the dominant comment style, used to label major page sections: `{/* Hero Section with Parallax */}`, `{/* Services Section */}`, `{/* Expertise Section */}`, `{/* Why Choose Us Section */}`, `{/* Contact Section */}` (all in `src/app/page.tsx`); `{/* Hero Section */}`, `{/* Experience Section */}`, `{/* Skills & Expertise Section */}`, `{/* Education Section */}` (all in `src/app/about/page.tsx`).
- Large blocks of commented-out JSX are left in place rather than deleted, e.g. a commented-out CTA button block in `src/app/page.tsx` (lines 32-49) and a commented-out "Talent Assessment" card (lines 67-73), and a commented-out "Jobs" nav link in `src/components/Header.tsx` (lines 29-31). When editing these files, either restore or delete dead commented blocks rather than adding more — the pattern of accumulating commented-out markup is a growing convention that should not be extended further.

**JSDoc/TSDoc:**
- Not used anywhere. No function, component, or type in the codebase has a JSDoc/TSDoc block.

## Function Design

**Size:** Page components are large single functions containing the entire page markup inline (e.g. `src/app/page.tsx` is 277 lines as one `Home()` function; `src/app/about/page.tsx` is 271 lines as one `About()` function). There is no decomposition into sub-components for repeated structures (e.g. the experience-card markup in `about/page.tsx` is duplicated four times inline rather than extracted into a reusable component).

**Parameters:** Only `RootLayout` takes a parameter (`children`), destructured directly in the function signature with an inline `Readonly<{...}>` type. No other component in the codebase accepts props.

**Return Values:** All components return JSX directly from a single `return (...)` statement; no early returns, conditional rendering, or loading/error states exist.

## Module Design

**Exports:** Every file uses a single `export default function ...`. No named exports, no barrel files (`index.ts`), and no multi-export modules exist in `src/`.

**Barrel Files:** Not used. `src/components/` is a flat directory with one file (`Header.tsx`) imported directly by consumers.

## Tailwind / Styling Conventions

- Tailwind CSS v3 (`tailwindcss@3.3.3` per `package.json`, with both `tailwind.config.js` and `tailwind.config.ts` present — duplicate configs exist; `tailwind.config.ts` should be treated as the source of truth for new work since `.ts` typically wins in Next.js tooling resolution, but verify which one Tailwind actually picks up before relying on custom theme values).
- Custom CSS variables for theming are defined in `src/app/globals.css` under `:root` and re-mapped through an `@theme inline` block (`--color-primary`, `--color-secondary`, `--color-accent`, etc.), with dark-mode overrides under `@media (prefers-color-scheme: dark)`.
- Utility classes are applied directly and verbosely inline on every element — no `clsx`/`cn()` helper, no extracted className constants, no CSS Modules. Repeated class strings (e.g. `"bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg"`) are copy-pasted across many elements rather than factored into a shared component or utility.
- Dark mode is implemented via Tailwind's `dark:` variant classes applied ad hoc per element, driven by the `prefers-color-scheme` media query in `globals.css` rather than a `class`-based toggle.

---

*Convention analysis: 2026-09-29*
