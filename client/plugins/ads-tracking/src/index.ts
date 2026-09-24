import { registerPlugin } from "@capacitor/core";
import type { AdsTrackingPlugin } from "./definitions";

const AdsTracking = registerPlugin<AdsTrackingPlugin>("AdsTracking", {
  web: () => import("./web").then((m) => new m.AdsTrackingWeb()),
});

export * from "./definitions";
export { AdsTracking };
