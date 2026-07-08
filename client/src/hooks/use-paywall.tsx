import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type PaywallSource = string;

type PaywallContextValue = {
  open: boolean;
  source: PaywallSource | null;
  openPaywall: (source?: PaywallSource) => Promise<boolean>;
  resolvePaywall: (result: boolean) => void;
};

const PaywallContext = createContext<PaywallContextValue | null>(null);

export function PaywallProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<PaywallSource | null>(null);
  const resolverRef = useRef<((result: boolean) => void) | null>(null);

  const openPaywall = useCallback(
    (nextSource: PaywallSource = "unknown"): Promise<boolean> => {
      if (resolverRef.current) {
        resolverRef.current(false);
        resolverRef.current = null;
      }
      setSource(nextSource);
      setOpen(true);
      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
      });
    },
    [],
  );

  const resolvePaywall = useCallback((result: boolean) => {
    setOpen(false);
    const resolver = resolverRef.current;
    resolverRef.current = null;
    resolver?.(result);
  }, []);

  const value = useMemo(
    () => ({ open, source, openPaywall, resolvePaywall }),
    [open, source, openPaywall, resolvePaywall],
  );

  return (
    <PaywallContext.Provider value={value}>{children}</PaywallContext.Provider>
  );
}

export function usePaywall() {
  const ctx = useContext(PaywallContext);
  if (!ctx) {
    throw new Error("usePaywall must be used within PaywallProvider");
  }
  return ctx;
}
