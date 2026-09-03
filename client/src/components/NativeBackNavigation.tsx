import {
  applyLocationToHistoryStack,
  APP_BACK_HOME_PATH,
  canGoBackInAppHistory,
  clickHardwareBackControl,
  dismissOpenOverlay,
  hasHardwareBackControl,
  hasOpenOverlay,
  isAndroidBackButtonMuted,
  isAppBackNavigateAction,
  resolveAppBackAction,
  runHardwareBackHandlers,
  setInAppHistoryDepth,
} from "@/lib/app-back-navigation";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useEffect, useRef } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";

/**
 * Back matériel Android : overlays, étapes d'onboarding, historique, onglets.
 * `exitApp` seulement à l'accueil / auth. L'onboarding ne quitte jamais.
 */
export function NativeBackNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const stackRef = useRef<string[]>([]);
  const locationRef = useRef(location);
  const navigateRef = useRef(navigate);

  locationRef.current = location;
  navigateRef.current = navigate;

  useEffect(() => {
    stackRef.current = applyLocationToHistoryStack(
      stackRef.current,
      navigationType,
      location.key,
    );
    setInAppHistoryDepth(stackRef.current.length);
  }, [location.key, navigationType]);

  useEffect(() => {
    return () => {
      setInAppHistoryDepth(0);
    };
  }, []);

  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;

    const handlerPromise = CapacitorApp.addListener("backButton", () => {
      if (isAndroidBackButtonMuted()) return;

      const { pathname, search } = locationRef.current;
      const action = resolveAppBackAction({
        hasOpenOverlay: hasOpenOverlay(document),
        hasVisibleBackControl: hasHardwareBackControl(document),
        canGoBack: canGoBackInAppHistory(),
        pathname,
        search,
      });

      if (action === "dismiss-overlay") {
        dismissOpenOverlay(document);
        return;
      }
      if (runHardwareBackHandlers()) return;
      if (action === "click-back-control") {
        clickHardwareBackControl(document);
        return;
      }
      if (isAppBackNavigateAction(action)) {
        navigateRef.current(action.to, { replace: true });
        return;
      }
      if (action === "history-back") {
        navigateRef.current(-1);
        return;
      }
      if (action === "go-home") {
        navigateRef.current(APP_BACK_HOME_PATH, { replace: true });
        return;
      }
      if (action === "stay") return;
      CapacitorApp.exitApp();
    });

    return () => {
      handlerPromise.then((handle) => handle.remove());
    };
  }, []);

  return null;
}
