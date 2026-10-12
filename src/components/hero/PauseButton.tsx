'use client';

type PauseButtonProps = {
  paused: boolean;
  onToggle: () => void;
};

// A native button element toggle (never a div) so keyboard operability and
// AT semantics are free. Per the WAI-ARIA APG toggle-button pattern, a button
// whose aria-label changes with state should NOT also carry aria-pressed
// (the two would announce contradictory/duplicate state) — the dynamic
// aria-label IS the "equivalent state" D-13 allows instead of aria-pressed.
export default function PauseButton({ paused, onToggle }: PauseButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={paused ? "Play background animation" : "Pause background animation"}
      data-state={paused ? "paused" : "playing"}
      className="absolute bottom-36 right-4 md:right-6 z-20 h-10 w-10 inline-flex items-center justify-center rounded-full border border-on-brand/40 bg-brand-strong/50 text-on-brand backdrop-blur-sm transition-colors hover:bg-brand-strong/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-brand"
    >
      {paused ? (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M8 5.5v13l11-6.5z" />
        </svg>
      ) : (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      )}
    </button>
  );
}
