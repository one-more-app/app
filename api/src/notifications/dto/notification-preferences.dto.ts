export type ReminderSlotDto = {
  weekday: number;
  hour: number;
  minute: number;
};

export type NotificationPreferencesDto = {
  streakReminders: boolean;
  friendRequests: boolean;
  friendAccepted: boolean;
  messages: boolean;
  sessionComments: boolean;
  friendTraining: boolean;
  friendRecords: boolean;
  weeklyRecap: boolean;
  reminderWeekdays: number[];
  reminderHour: number;
  reminderMinute: number;
  reminderSlots: ReminderSlotDto[];
};
