package com.onemore.gymgeofence;

import android.content.Context;
import android.content.SharedPreferences;

final class GymGeofenceCooldown {

    private static final String PREFS = "gym_geofence_prefs";
    private static final String KEY_LAST_NOTIF_MS = "last_notification_ms";
    static final long COOLDOWN_MS = 4L * 60L * 60L * 1000L;

    private GymGeofenceCooldown() {}

    static boolean canNotify(Context context) {
        long last = prefs(context).getLong(KEY_LAST_NOTIF_MS, 0L);
        if (last <= 0L) return true;
        return System.currentTimeMillis() - last >= COOLDOWN_MS;
    }

    static void markNotified(Context context) {
        prefs(context).edit().putLong(KEY_LAST_NOTIF_MS, System.currentTimeMillis()).apply();
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }
}
