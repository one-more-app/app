import { getApiBaseUrl, setOnApiUnreachable } from "@/lib/api";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ConnectivityStatus = "ok" | "offline" | "maintenance" | "checking";

type ConnectivityContextValue = {
  status: ConnectivityStatus;
  retry: () => Promise<void>;
  reportApiUnreachable: () => void;
};

const ConnectivityContext = createContext<ConnectivityContextValue | null>(null);

const PROBE_TIMEOUT_MS = 5_000;
const PROBE_INTERVAL_MS = 20_000;

function isBrowserOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

async function probeHealth(): Promise<boolean> {
  const baseUrl = getApiBaseUrl();
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}/health`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return false;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await res.json().catch(() => null)) as { status?: unknown } | null;
      if (body && typeof body === "object" && body.status != null && body.status !== "ok") {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConnectivityStatus>(() =>
    isBrowserOnline() ? "checking" : "offline",
  );
  const probeInFlight = useRef<Promise<void> | null>(null);

  const runProbe = useCallback(async () => {
    if (!isBrowserOnline()) {
      setStatus("offline");
      return;
    }

    if (probeInFlight.current) {
      await probeInFlight.current;
      return;
    }

    setStatus((previous) => {
      if (previous === "ok" || previous === "maintenance") return previous;
      return "checking";
    });

    probeInFlight.current = (async () => {
      const ok = await probeHealth();
      if (!isBrowserOnline()) {
        setStatus("offline");
        return;
      }
      setStatus(ok ? "ok" : "maintenance");
    })();

    try {
      await probeInFlight.current;
    } finally {
      probeInFlight.current = null;
    }
  }, []);

  const reportApiUnreachable = useCallback(() => {
    if (!isBrowserOnline()) {
      setStatus("offline");
      return;
    }
    setStatus((previous) =>
      previous === "ok" || previous === "checking" ? "maintenance" : previous,
    );
  }, []);

  const retry = useCallback(async () => {
    await runProbe();
  }, [runProbe]);

  useEffect(() => {
    setOnApiUnreachable(reportApiUnreachable);
    return () => setOnApiUnreachable(null);
  }, [reportApiUnreachable]);

  useEffect(() => {
    void runProbe();

    const onOnline = () => {
      void runProbe();
    };
    const onOffline = () => {
      setStatus("offline");
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [runProbe]);

  useEffect(() => {
    if (status !== "maintenance" && status !== "offline") return;

    const id = window.setInterval(() => {
      if (!isBrowserOnline()) {
        setStatus("offline");
        return;
      }
      void runProbe();
    }, PROBE_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [status, runProbe]);

  const value = useMemo(
    () => ({ status, retry, reportApiUnreachable }),
    [status, retry, reportApiUnreachable],
  );

  return (
    <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>
  );
}

export function useConnectivity(): ConnectivityContextValue {
  const ctx = useContext(ConnectivityContext);
  if (!ctx) {
    throw new Error("useConnectivity must be used within ConnectivityProvider");
  }
  return ctx;
}
