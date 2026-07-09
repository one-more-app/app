import type {
  GymGeofencePermissionResult,
  GymGeofencePlugin,
} from "./definitions";

const denied: GymGeofencePermissionResult = {
  ready: false,
  location: "denied",
  backgroundLocation: "denied",
  needsSettings: false,
};

export class GymGeofenceWeb implements GymGeofencePlugin {
  async register(): Promise<void> {
    /* Web: géofencing non supporté. */
  }

  async unregister(): Promise<void> {
    /* Web: géofencing non supporté. */
  }

  async checkPermissions(): Promise<GymGeofencePermissionResult> {
    return denied;
  }

  async requestPermissions(): Promise<GymGeofencePermissionResult> {
    return denied;
  }

  async openSettings(): Promise<void> {
    /* Web: géofencing non supporté. */
  }
}
