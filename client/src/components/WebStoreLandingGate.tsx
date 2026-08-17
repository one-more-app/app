import { WebStoreLandingPage } from "@/pages/WebStoreLandingPage";
import {
  isWebStoreEventRoute,
  readWebStoreLandingRuntimeFlags,
  shouldShowWebStoreLanding,
} from "@/lib/web-store-landing";
import { Capacitor } from "@capacitor/core";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

export function WebStoreLandingGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const flags = readWebStoreLandingRuntimeFlags();

  if (
    shouldShowWebStoreLanding({
      isNative: Capacitor.isNativePlatform(),
      isDev: import.meta.env.DEV,
      isEventRoute: isWebStoreEventRoute(pathname),
      isE2e: flags.isE2e,
      forceStoreLanding: flags.forceStoreLanding,
    })
  ) {
    return <WebStoreLandingPage />;
  }

  return <>{children}</>;
}
