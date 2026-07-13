package com.onemore.resttimer;

import android.content.Context;
import android.content.SharedPreferences;

final class RestTimerState {

    static final String PREFS = "rest_timer_prefs";
    static final String KEY_CREATED_AT_MS = "created_at_ms";
    static final String KEY_TARGET_MS = "target_ms";
    static final String KEY_EXERCISE_ID = "exercise_id";
    static final String KEY_EXERCISE_NAME = "exercise_name";
    static final String KEY_TITLE = "title";
    static final String KEY_FINISHED_TITLE = "finished_title";
    static final String KEY_DEEP_LINK_ROUTE = "deep_link_route";
    static final String KEY_FOREGROUND_VISIBLE = "foreground_visible";

    final long createdAtMs;
    final long targetMs;
    final String exerciseId;
    final String exerciseName;
    final String title;
    final String finishedTitle;
    final String deepLinkRoute;
    final boolean foregroundVisible;

    RestTimerState(
        long createdAtMs,
        long targetMs,
        String exerciseId,
        String exerciseName,
        String title,
        String finishedTitle,
        String deepLinkRoute,
        boolean foregroundVisible
    ) {
        this.createdAtMs = createdAtMs;
        this.targetMs = targetMs;
        this.exerciseId = exerciseId;
        this.exerciseName = exerciseName;
        this.title = title;
        this.finishedTitle = finishedTitle;
        this.deepLinkRoute = deepLinkRoute;
        this.foregroundVisible = foregroundVisible;
    }

    long getFireAtMs() {
        return createdAtMs + targetMs;
    }

    int getProgressPercent(long nowMs) {
        if (targetMs <= 0) {
            return 100;
        }
        long elapsed = Math.max(0, nowMs - createdAtMs);
        return (int) Math.min(100, (elapsed * 100) / targetMs);
    }

    boolean isActive(long nowMs) {
        return nowMs < getFireAtMs();
    }

    void save(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs
            .edit()
            .putLong(KEY_CREATED_AT_MS, createdAtMs)
            .putLong(KEY_TARGET_MS, targetMs)
            .putString(KEY_EXERCISE_ID, exerciseId)
            .putString(KEY_EXERCISE_NAME, exerciseName)
            .putString(KEY_TITLE, title)
            .putString(KEY_FINISHED_TITLE, finishedTitle)
            .putString(KEY_DEEP_LINK_ROUTE, deepLinkRoute)
            .putBoolean(KEY_FOREGROUND_VISIBLE, foregroundVisible)
            .apply();
    }

    static void clear(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit().clear().apply();
    }

    static RestTimerState load(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (!prefs.contains(KEY_CREATED_AT_MS)) {
            return null;
        }
        return new RestTimerState(
            prefs.getLong(KEY_CREATED_AT_MS, 0L),
            prefs.getLong(KEY_TARGET_MS, 0L),
            prefs.getString(KEY_EXERCISE_ID, ""),
            prefs.getString(KEY_EXERCISE_NAME, ""),
            prefs.getString(KEY_TITLE, "Repos"),
            prefs.getString(KEY_FINISHED_TITLE, "Temps de repos terminé"),
            prefs.getString(KEY_DEEP_LINK_ROUTE, "/home"),
            prefs.getBoolean(KEY_FOREGROUND_VISIBLE, true)
        );
    }

    RestTimerState withTargetMs(long newTargetMs) {
        return new RestTimerState(
            createdAtMs,
            newTargetMs,
            exerciseId,
            exerciseName,
            title,
            finishedTitle,
            deepLinkRoute,
            foregroundVisible
        );
    }

    RestTimerState withForegroundVisible(boolean visible) {
        return new RestTimerState(
            createdAtMs,
            targetMs,
            exerciseId,
            exerciseName,
            title,
            finishedTitle,
            deepLinkRoute,
            visible
        );
    }
}
