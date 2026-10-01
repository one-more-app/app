import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { getApiBaseUrl, setOnApiUnreachable } from "@/lib/api";
import {
  minVersionForPlatform,
  shouldForceUpdateFromHealth,
  type HealthProbeBody,
} from "@/lib/force-update-from-health";
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

export type ConnectivityStatus =
  | "ok"
  | "offline"
  | "maintenance"
  | "update_required"
  | "checking";

type ConnectivityContextValue = {
  status: ConnectivityStatus;
  retry: () => Promise<void>;
  reportApiUnreachable: () => void;
};

type ProbeResult = "ok" | "offline" | "maintenance" | "update_required";

const ConnectivityContext = createContext<ConnectivityContextValue | null>(null);

const PROBE_TIMEOUT_MS = 5_000;
const PROBE_INTERVAL_MS = 20_000;

function isBrowserOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

async function readNativeMarketingVersion(): Promise<string> {
  if (!Capacitor.isNativePlatform()) return "";
  try {
    const info = await Promise.race([
      App.getInfo(),
      new Promise<never>((_, reject) =>
        window.setTimeout(
          () => reject(new Error("App.getInfo timeout")),
          PROBE_TIMEOUT_MS,
        ),
      ),
    ]);
    return String(info.version ?? "").trim();
  } catch {
    return ""; // fail-open
  }
}

async function probeHealth(): Promise<ProbeResult> {
  const baseUrl = getApiBaseUrl();
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}/health`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    // Réponse reçue = réseau OK. Un statut/body mauvais ⇒ maintenance API.
    if (!res.ok) return "maintenance";
    const contentType = res.headers.get("content-type") ?? "";
    let body: HealthProbeBody | null = null;
    if (contentType.includes("application/json")) {
      body = (await res.json().catch(() => null)) as HealthProbeBody | null;
      if (body && typeof body === "object" && body.status != null && body.status !== "ok") {
        return "maintenance";
      }
    }
    const isNativePlatform = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    // Lecture de la version native seulement si un min existe (lazy).
    if (isNativePlatform && minVersionForPlatform(body, platform)) {
      const currentVersion = await readNativeMarketingVersion();
      if (
        shouldForceUpdateFromHealth({
          isNativePlatform,
          platform,
          currentVersion,
          body,
        })
      ) {
        return "update_required";
      }
    }
    return "ok";
  } catch {
    // Timeout / DNS / Failed to fetch = pas de joignabilité réelle.
    return "offline";
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
    // navigator.onLine=false est un signal fiable « offline ».
    // navigator.onLine=true ne l'est pas : on probe toujours l'API.
    if (!isBrowserOnline()) {
      setStatus("offline");
      return;
    }

    if (probeInFlight.current) {
      await probeInFlight.current;
      return;
    }

    setStatus((previous) => {
      if (
        previous === "ok" ||
        previous === "maintenance" ||
        previous === "offline" ||
        previous === "update_required"
      ) {
        return previous;
      }
      return "checking";
    });

    probeInFlight.current = (async () => {
      const result = await probeHealth();
      if (!isBrowserOnline()) {
        setStatus("offline");
        return;
      }
      setStatus(result);
    })();

    try {
      await probeInFlight.current;
    } finally {
      probeInFlight.current = null;
    }
  }, []);

  const reportApiUnreachable = useCallback(() => {
    // Échec réseau immédiat → offline tout de suite, puis probe pour
    // affiner (maintenance si l'API répond unhealthy).
    setStatus((previous) =>
      previous === "ok" || previous === "checking" ? "offline" : previous,
    );
    void runProbe();
  }, [runProbe]);

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
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void runProbe();
      }
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [runProbe]);

  useEffect(() => {
    if (status !== "maintenance" && status !== "offline" && status !== "update_required") return;

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
