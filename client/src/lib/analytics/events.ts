/**
 * Taxonomie centralisée des événements OpenPanel.
 * Convention : snake_case, actions au passé.
 * Ne jamais inclure de PII (email, mot de passe) dans les propriétés d'événement.
 */

export const AnalyticsEvents = {
  // Navigation & engagement
  PAGE_VIEWED: "page_viewed",
  UI_ELEMENT_CLICKED: "ui_element_clicked",
  FEATURE_USED: "feature_used",

  // Auth & onboarding
  USER_REGISTERED: "user_registered",
  USER_LOGGED_IN: "user_logged_in",
  USER_LOGGED_OUT: "user_logged_out",
  ONBOARDING_STEP_COMPLETED: "onboarding_step_completed",
  ONBOARDING_COMPLETED: "onboarding_completed",

  // Exercices & performances
  EXERCISE_ADDED: "exercise_added",
  EXERCISE_REMOVED: "exercise_removed",
  EXERCISE_OPENED: "exercise_opened",
  PERFORMANCE_LOGGED: "performance_logged",
  PERFORMANCE_EDITED: "performance_edited",
  PERFORMANCE_DELETED: "performance_deleted",
  PERSONAL_RECORD_BROKEN: "personal_record_broken",
  LEAGUE_PROMOTED: "league_promoted",
  PERF_DRAWER_OPENED: "perf_drawer_opened",
  REST_TIMER_DISMISSED: "rest_timer_dismissed",
  DIALOG_OPENED: "dialog_opened",
  DIALOG_CLOSED: "dialog_closed",
  DRAWER_OPENED: "drawer_opened",
  DRAWER_CLOSED: "drawer_closed",
  NAV_ITEM_CLICKED: "nav_item_clicked",
  WHEEL_PICKER_CHANGED: "wheel_picker_changed",
  CELEBRATION_VIEWED: "celebration_viewed",
  SHARE_TRIGGERED: "share_triggered",

  // Social
  FRIEND_INVITE_SENT: "friend_invite_sent",
  FRIEND_INVITE_ACCEPTED: "friend_invite_accepted",
  FRIEND_REQUEST_SENT: "friend_request_sent",
  FRIEND_REQUEST_ACCEPTED: "friend_request_accepted",
  MESSAGE_SENT: "message_sent",
  PROFILE_SHARED: "profile_shared",

  // Accès & monétisation (RevenueCat branchera ici)
  EXERCISE_LIMIT_REACHED: "exercise_limit_reached",
  PAYWALL_VIEWED: "paywall_viewed",
  PURCHASE_STARTED: "purchase_started",
  PURCHASE_VALIDATED: "purchase_validated",
  PURCHASE_FAILED: "purchase_failed",
  SUBSCRIPTION_RENEWED: "subscription_renewed",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",

  // Satisfaction & rétention
  APP_REVIEW_PROMPTED: "app_review_prompted",
  APP_REVIEW_POSITIVE_MOMENT: "app_review_positive_moment",
  LEAGUE_PROMOTION_CELEBRATED: "league_promotion_celebrated",

  // Notifications
  PUSH_NOTIFICATION_ENABLED: "push_notification_enabled",
  PUSH_NOTIFICATION_DISABLED: "push_notification_disabled",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

/** Noms de pages normalisés pour les KPIs de navigation. */
export const PageNames: Record<string, string> = {
  "/": "index",
  "/home": "home",
  "/onboarding": "onboarding",
  "/auth": "auth",
  "/exercises": "exercises_list",
  "/history": "history",
  "/profile": "profile",
  "/settings": "settings",
  "/friends": "friends",
  "/stats": "stats",
};

export function resolvePageName(pathname: string): string {
  if (PageNames[pathname]) return PageNames[pathname];

  if (pathname.startsWith("/exercise/")) return "exercise_detail";
  if (pathname.startsWith("/invite/")) return "invite_landing";
  if (pathname.startsWith("/friends/chat/")) return "chat";
  if (pathname.startsWith("/friends/preview/")) return "user_preview";
  if (pathname.startsWith("/friends/")) return "friend_profile";

  return pathname.replace(/^\//, "").replace(/\//g, "_") || "unknown";
}
