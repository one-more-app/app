import { SplashScreen } from "@/components/SplashScreen";
import { SPLASH_MIN_DURATION_MS } from "@/components/OneMoreLogoMark";
import { useConnectivity } from "@/hooks/use-connectivity";
import { MaintenancePage } from "@/pages/MaintenancePage";
import { OfflinePage } from "@/pages/OfflinePage";
import { useEffect, useState, type ReactNode } from "react";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ConnectivityGate({ children }: { children: ReactNode }) {
  const { status } = useConnectivity();
  const [splashMinElapsed, setSplashMinElapsed] = useState(prefersReducedMotion);

  useEffect(() => {
    if (splashMinElapsed) return;

    if (prefersReducedMotion()) {
      setSplashMinElapsed(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setSplashMinElapsed(true);
    }, SPLASH_MIN_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [splashMinElapsed]);

  // Splash jusqu'à la fin mini de l'anim, quel que soit le statut réseau/API.
  if (!splashMinElapsed || status === "checking") {
    return <SplashScreen />;
  }

  if (status === "offline") {
    return <OfflinePage />;
  }

  if (status === "maintenance") {
    return <MaintenancePage />;
  }

  return <>{children}</>;
}
