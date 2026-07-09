import type { GymGeofencePlugin } from "./definitions";

export class GymGeofenceWeb implements GymGeofencePlugin {
  async register(): Promise<void> {
    /* Web: géofencing non supporté. */
  }

  async unregister(): Promise<void> {
    /* Web: géofencing non supporté. */
  }
}
