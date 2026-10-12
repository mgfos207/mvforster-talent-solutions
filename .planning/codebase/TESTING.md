# Testing Patterns

**Analysis Date:** 2026-09-29

## Test Framework

**Runner:**
- None. No test runner is installed or configured. `package.json` `devDependencies` contains only `@eslint/eslintrc`, `@types/node`, `@types/react`, `@types/react-dom`, `autoprefixer`, `eslint`, `eslint-config-next`, `postcss`, `tailwindcss`, `typescript` — no Jest, Vitest, Mocha, or any test framework.
- No config file exists for any test runner (`jest.config.*`, `vitest.config.*`, `playwright.config.*`, etc. are all absent from the repo root).

**Assertion Library:**
- Not applicable — none installed.

**Run Commands:**
```bash
# No test script exists in package.json.
# Available scripts (package.json):
npm run dev     # next dev
npm run build   # next build
npm run start   # next start
npm run lint    # eslint
```
There is no `npm test` or `npm run test` script defined.

## Test File Organization

**Location:**
- Not applicable. A repo-wide search (`find . -iname "*.test.*" -o -iname "*.spec.*"`, excluding `node_modules`/`.next`) returned zero results. No test files exist anywhere in this codebase.

**Naming:**
- Not applicable — no naming convention has ever been established.

**Structure:**
```
No test directory structure exists.
```

## Test Structure

**Suite Organization:**
```typescript
// No test suites exist in this codebase.
```

**Patterns:**
- None observed. There is no setup/teardown, no assertion pattern, and no test utility code anywhere in `src/` or the repo root.

## Mocking

**Framework:** None.

**Patterns:**
```typescript
// No mocking patterns exist — there is nothing to mock yet since
// there is no data fetching, no API routes, and no external service
// calls in the codebase (see .planning/codebase/INTEGRATIONS.md-equivalent
// finding: this is a fully static marketing site).
```

**What to Mock:**
- Not applicable today. If tests are introduced, likely future mock targets would be:
  - `next/image` and `next/font/google` (used in `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/about/page.tsx`, `src/components/Header.tsx`) since these have Next.js-specific runtime behavior that is awkward under plain Jest/Vitest without the Next.js test transforms.

**What NOT to Mock:**
- Not applicable — no code exists yet that would need real-dependency testing (no business logic, no data layer).

## Fixtures and Factories

**Test Data:**
```typescript
// None exist. All content (job categories, bio text, experience entries)
// is hardcoded directly in JSX in src/app/page.tsx and src/app/about/page.tsx —
// there is no separate data file or fixture to reuse for tests.
```

**Location:**
- Not applicable.

## Coverage

**Requirements:** None enforced. No coverage tool is configured, and no CI coverage gate exists.

**View Coverage:**
```bash
# Not applicable — no coverage tooling is installed.
```

## Test Types

**Unit Tests:** None exist. If introduced, the natural target given the current codebase would be component rendering tests for `src/components/Header.tsx` and page-level smoke tests for `src/app/page.tsx`, `src/app/about/page.tsx`, `src/app/goals/page.tsx` using React Testing Library, since all current "logic" is pure JSX markup with no business rules to unit test in isolation.

**Integration Tests:** None exist. There are no API routes, server actions, or data-fetching integrations to test.

**E2E Tests:** Not used. `.playwright-mcp/` exists at the repo root but is an empty/tooling directory for the Playwright MCP server used interactively by Claude Code — it is not a Playwright test suite and contains no `*.spec.ts` E2E test files.

## CI Pipeline

- `.github/` directory exists but should be checked for workflow files if test automation is later added; no test-running CI step currently exists based on this analysis (only `lint`/`build`/`start` scripts are available to wire into CI).

## Common Patterns

**Async Testing:**
```typescript
// Not applicable — no async code exists in the codebase (no data fetching,
// no server actions, no API calls).
```

**Error Testing:**
```typescript
// Not applicable — no error handling paths exist to test.
```

## Recommendations for Introducing Tests

Since this repo has zero testing infrastructure, any phase that introduces tests must start from scratch:
1. Add a test runner — Vitest or Jest with `@testing-library/react` and `@testing-library/jest-dom` are the standard choice for a Next.js 14 App Router project like this one.
2. Add a `test`/`test:watch` script to `package.json` (currently missing entirely).
3. Establish file naming/location convention at the same time as adding the first test — there is no existing precedent to match, so pick co-located `*.test.tsx` next to components (e.g. `src/components/Header.test.tsx`) as the simplest option given the flat `src/components/` structure.
4. Mock `next/image`, `next/link`, and `next/font/google` per the chosen framework's Next.js testing guide, since every existing component (`src/app/layout.tsx`, `src/app/page.tsx`, `src/app/about/page.tsx`, `src/components/Header.tsx`) uses at least one of these.

---

*Testing analysis: 2026-09-29*
