package com.onemore.resttimer;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

final class RestTimerAlarmScheduler {

    static final String ACTION_PROGRESS = "com.onemore.resttimer.ACTION_PROGRESS";
    static final String ACTION_FINISHED = "com.onemore.resttimer.ACTION_FINISHED";

    private static final int REQUEST_FINISHED = 4201;
    private static final int REQUEST_PROGRESS = 4202;
    private static final long PROGRESS_INTERVAL_MS = 2_000L;

    private RestTimerAlarmScheduler() {}

    static void scheduleAll(Context context, RestTimerState state) {
        cancelAll(context);
        long now = System.currentTimeMillis();
        long fireAt = state.getFireAtMs();
        if (fireAt <= now) {
            return;
        }

        scheduleFinished(context, fireAt);
        scheduleNextProgress(context, state, now);
    }

    static void cancelAll(Context context) {
        AlarmManager alarmManager = getAlarmManager(context);
        if (alarmManager == null) {
            return;
        }
        alarmManager.cancel(buildFinishedPendingIntent(context));
        alarmManager.cancel(buildProgressPendingIntent(context));
    }

    static void scheduleNextProgress(Context context, RestTimerState state, long nowMs) {
        long fireAt = state.getFireAtMs();
        if (fireAt <= nowMs) {
            return;
        }

        long remainingMs = fireAt - nowMs;
        long delayMs = Math.min(PROGRESS_INTERVAL_MS, remainingMs);
        if (delayMs <= 0L) {
            return;
        }

        long nextTick = nowMs + delayMs;
        AlarmManager alarmManager = getAlarmManager(context);
        if (alarmManager == null) {
            return;
        }

        PendingIntent pendingIntent = buildProgressPendingIntent(context);
        scheduleExact(alarmManager, nextTick, pendingIntent);
    }

    private static void scheduleFinished(Context context, long fireAtMs) {
        AlarmManager alarmManager = getAlarmManager(context);
        if (alarmManager == null) {
            return;
        }
        scheduleExact(alarmManager, fireAtMs, buildFinishedPendingIntent(context));
    }

    private static void scheduleExact(AlarmManager alarmManager, long triggerAtMs, PendingIntent pendingIntent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pendingIntent);
            return;
        }
        alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMs, pendingIntent);
    }

    private static PendingIntent buildFinishedPendingIntent(Context context) {
        Intent intent = new Intent(context, RestTimerAlarmReceiver.class);
        intent.setAction(ACTION_FINISHED);
        return PendingIntent.getBroadcast(
            context,
            REQUEST_FINISHED,
            intent,
            pendingIntentFlags()
        );
    }

    private static PendingIntent buildProgressPendingIntent(Context context) {
        Intent intent = new Intent(context, RestTimerAlarmReceiver.class);
        intent.setAction(ACTION_PROGRESS);
        return PendingIntent.getBroadcast(
            context,
            REQUEST_PROGRESS,
            intent,
            pendingIntentFlags()
        );
    }

    private static int pendingIntentFlags() {
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return flags;
    }

    private static AlarmManager getAlarmManager(Context context) {
        return (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    }
}
