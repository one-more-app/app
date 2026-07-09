import { registerPlugin } from "@capacitor/core";
import type { GymGeofencePlugin } from "./definitions";

const GymGeofence = registerPlugin<GymGeofencePlugin>("GymGeofence", {
  web: () => import("./web").then((m) => new m.GymGeofenceWeb()),
});

export * from "./definitions";
export { GymGeofence };
