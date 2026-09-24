export type AttAuthorizationStatus =
  | "authorized"
  | "denied"
  | "restricted"
  | "notDetermined"
  | "unavailable";

export type AttStatusResult = {
  status: AttAuthorizationStatus;
};

export interface AdsTrackingPlugin {
  getStatus(): Promise<AttStatusResult>;
  requestPermission(): Promise<AttStatusResult>;
}
