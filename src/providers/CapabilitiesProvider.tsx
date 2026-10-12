'use client';

import { createContext, useContext, useMemo } from "react";
import { deriveVerdicts, SSR_DEFAULT_SIGNALS, STATIC_VERDICTS } from "@/lib/capabilities";
import { useCapabilitySignals } from "@/hooks/useCapabilitySignals";
import type { Capabilities } from "@/types/capabilities";

const CapabilitiesContext = createContext<Capabilities | null>(null);

export function CapabilitiesProvider({ children }: { children: React.ReactNode }) {
  const signals = useCapabilitySignals();
  const value = useMemo<Capabilities>(
    () => ({ ...deriveVerdicts(signals), signals }),
    [signals],
  );

  return (
    <CapabilitiesContext.Provider value={value}>{children}</CapabilitiesContext.Provider>
  );
}

// Fail-static outside a provider, consistent with the core value that the
// page works when enhancements fail — never throws.
export function useCapabilities(): Capabilities {
  const context = useContext(CapabilitiesContext);
  return context ?? { ...STATIC_VERDICTS, signals: SSR_DEFAULT_SIGNALS };
}
