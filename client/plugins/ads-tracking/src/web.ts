import type { AdsTrackingPlugin, AttStatusResult } from "./definitions";

export class AdsTrackingWeb implements AdsTrackingPlugin {
  async getStatus(): Promise<AttStatusResult> {
    return { status: "unavailable" };
  }

  async requestPermission(): Promise<AttStatusResult> {
    return { status: "unavailable" };
  }
}
