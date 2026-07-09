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
}
