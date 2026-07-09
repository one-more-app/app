export type GymGeofencePermissionResult = {
  ready: boolean;
  location: 'granted' | 'denied' | 'prompt';
  backgroundLocation: 'granted' | 'denied' | 'prompt';
  needsSettings: boolean;
};

export interface GymGeofencePlugin {
  register(options: {
    lat: number;
    lng: number;
    radiusM: number;
    identifier: string;
    notificationTitle: string;
    notificationBody: string;
    deepLinkRoute: string;
  }): Promise<void>;
  unregister(): Promise<void>;
  checkPermissions(): Promise<GymGeofencePermissionResult>;
  requestPermissions(): Promise<GymGeofencePermissionResult>;
  openSettings(): Promise<void>;
}
