import type {
  RestTimerPermissionResult,
  RestTimerPlugin,
} from "./definitions";

const denied: RestTimerPermissionResult = { granted: false };

export class RestTimerWeb implements RestTimerPlugin {
  async start(): Promise<void> {
    /* Web: timer natif non supporté. */
  }

  async update(): Promise<void> {
    /* Web: timer natif non supporté. */
  }

  async setForegroundVisible(): Promise<void> {
    /* Web: timer natif non supporté. */
  }

  async cancel(): Promise<void> {
    /* Web: timer natif non supporté. */
  }

  async checkPermissions(): Promise<RestTimerPermissionResult> {
    return denied;
  }

  async requestPermissions(): Promise<RestTimerPermissionResult> {
    return denied;
  }
}
