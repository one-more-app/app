import type { AnalyticsContext } from "@/lib/analytics";
import { createContext, useContext } from "react";

const AnalyticsContext = createContext<AnalyticsContext>({});

export function AnalyticsContextProvider({
  value,
  children,
}: {
  value: AnalyticsContext;
  children: React.ReactNode;
}) {
  return (
    <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
  );
}

export function useAnalyticsContext(): AnalyticsContext {
  return useContext(AnalyticsContext);
}
