import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ReferralDrawerSource = "limit" | "invite" | "settings" | "apply";

type ReferralDrawerContextValue = {
  open: boolean;
  source: ReferralDrawerSource | null;
  openReferralDrawer: (source?: ReferralDrawerSource) => void;
  closeReferralDrawer: () => void;
};

const ReferralDrawerContext = createContext<ReferralDrawerContextValue | null>(
  null,
);

export function ReferralDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<ReferralDrawerSource | null>(null);

  const openReferralDrawer = useCallback((nextSource: ReferralDrawerSource = "invite") => {
    setSource(nextSource);
    setOpen(true);
  }, []);

  const closeReferralDrawer = useCallback(() => {
    setOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      open,
      source,
      openReferralDrawer,
      closeReferralDrawer,
    }),
    [open, source, openReferralDrawer, closeReferralDrawer],
  );

  return (
    <ReferralDrawerContext.Provider value={value}>
      {children}
    </ReferralDrawerContext.Provider>
  );
}

export function useReferralDrawer() {
  const ctx = useContext(ReferralDrawerContext);
  if (!ctx) {
    throw new Error("useReferralDrawer must be used within ReferralDrawerProvider");
  }
  return ctx;
}
