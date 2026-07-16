export type RestTimerStartParams = {
  createdAt: string;
  targetMs: number;
  exerciseId: string;
  exerciseName: string;
  title: string;
  finishedTitle: string;
  deepLinkRoute: string;
};

export type RestTimerPermissionResult = {
  granted: boolean;
};

export interface RestTimerPlugin {
  start(params: RestTimerStartParams): Promise<void>;
  update(params: { targetMs: number }): Promise<void>;
  setForegroundVisible(params: { visible: boolean }): Promise<void>;
  cancel(): Promise<void>;
  consumeSuppressToastExerciseId(): Promise<{ exerciseId: string | null }>;
  checkPermissions(): Promise<RestTimerPermissionResult>;
  requestPermissions(): Promise<RestTimerPermissionResult>;
}
