import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

type AppStateCallback = (isActive: boolean) => void;

let attached = false;
let removeNativeListener: (() => void) | null = null;
const subscribers = new Set<AppStateCallback>();

function ensureNativeListener(): void {
  if (attached || !Capacitor.isNativePlatform()) return;
  attached = true;

  void CapacitorApp.addListener("appStateChange", ({ isActive }) => {
    for (const callback of subscribers) {
      callback(isActive);
    }
  }).then((handle) => {
    removeNativeListener = () => {
      void handle.remove();
    };
  });
}

function teardownNativeListenerIfIdle(): void {
  if (subscribers.size > 0) return;
  removeNativeListener?.();
  removeNativeListener = null;
  attached = false;
}

/** Un seul listener natif `appStateChange`, dispatch vers les abonnés. */
export function subscribeAppStateChange(
  callback: AppStateCallback,
): () => void {
  if (!Capacitor.isNativePlatform()) return () => {};

  ensureNativeListener();
  subscribers.add(callback);

  return () => {
    subscribers.delete(callback);
    teardownNativeListenerIfIdle();
  };
}
