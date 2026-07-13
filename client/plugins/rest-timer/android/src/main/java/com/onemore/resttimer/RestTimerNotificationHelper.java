package com.onemore.resttimer;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import java.util.Locale;

final class RestTimerNotificationHelper {

    static final int NOTIFICATION_ID = 42;
    /** v2 : visible écran verrouillé (IMPORTANCE_DEFAULT), sans son. */
    static final String CHANNEL_ID = "rest-timer-ongoing-v2";
    static final String CHANNEL_FINISHED_ID = "rest-timer-finished";

    private RestTimerNotificationHelper() {}

    static void ensureChannels(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }
        NotificationManager manager = getManager(context);
        if (manager == null) {
            return;
        }

        NotificationChannel ongoing = new NotificationChannel(
            CHANNEL_ID,
            "Temps de repos",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        ongoing.setDescription("Compte à rebours du repos en cours");
        ongoing.setShowBadge(false);
        ongoing.enableVibration(false);
        ongoing.setSound(null, null);
        ongoing.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        manager.createNotificationChannel(ongoing);

        NotificationChannel finished = new NotificationChannel(
            CHANNEL_FINISHED_ID,
            "Fin de repos",
            NotificationManager.IMPORTANCE_HIGH
        );
        finished.setDescription("Alerte quand le temps de repos est terminé");
        finished.enableVibration(true);
        manager.createNotificationChannel(finished);
    }

    static void showOngoing(Context context, RestTimerState state, int progressPercent) {
        ensureChannels(context);
        NotificationManager manager = getManager(context);
        if (manager == null) {
            return;
        }
        manager.notify(NOTIFICATION_ID, buildOngoing(context, state, progressPercent).build());
    }

    static void showFinished(Context context, RestTimerState state) {
        ensureChannels(context);
        NotificationManager manager = getManager(context);
        if (manager == null) {
            return;
        }
        manager.notify(NOTIFICATION_ID, buildFinished(context, state).build());
    }

    static void cancel(Context context) {
        NotificationManager manager = getManager(context);
        if (manager != null) {
            manager.cancel(NOTIFICATION_ID);
        }
    }

    static NotificationCompat.Builder buildOngoing(
        Context context,
        RestTimerState state,
        int progressPercent
    ) {
        int smallIcon = resolveNotificationIcon(context);
        long fireAtMs = state.getFireAtMs();
        int clampedProgress = Math.max(0, Math.min(100, progressPercent));

        return new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(smallIcon)
            .setContentTitle(state.title)
            .setContentText(formatExerciseName(state.exerciseName))
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .setUsesChronometer(true)
            .setChronometerCountDown(true)
            .setWhen(fireAtMs)
            .setProgress(100, clampedProgress, false)
            .setColor(Color.parseColor("#DFFF5E"))
            .setContentIntent(buildContentIntent(context, state.deepLinkRoute))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .setSilent(true);
    }

    static NotificationCompat.Builder buildFinished(Context context, RestTimerState state) {
        int smallIcon = resolveNotificationIcon(context);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_FINISHED_ID)
            .setSmallIcon(smallIcon)
            .setContentTitle(state.finishedTitle)
            .setContentText(formatExerciseName(state.exerciseName))
            .setAutoCancel(true)
            .setOngoing(false)
            .setShowWhen(true)
            .setWhen(System.currentTimeMillis())
            .setColor(Color.parseColor("#DFFF5E"))
            .setContentIntent(buildContentIntent(context, state.deepLinkRoute))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setDefaults(NotificationCompat.DEFAULT_VIBRATE);

        int soundRes = context
            .getResources()
            .getIdentifier("rest_timer_done", "raw", context.getPackageName());
        if (soundRes != 0) {
            builder.setSound(
                Uri.parse("android.resource://" + context.getPackageName() + "/" + soundRes)
            );
        } else {
            builder.setDefaults(NotificationCompat.DEFAULT_SOUND | NotificationCompat.DEFAULT_VIBRATE);
        }

        return builder;
    }

    private static PendingIntent buildContentIntent(Context context, String route) {
        String normalized = route.startsWith("/") ? route : "/" + route;
        String url = "https://localhost/#" + normalized;
        Intent launchIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        launchIntent.setPackage(context.getPackageName());
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        return PendingIntent.getActivity(context, NOTIFICATION_ID, launchIntent, flags);
    }

    private static int resolveNotificationIcon(Context context) {
        int resId = context
            .getResources()
            .getIdentifier("ic_stat_notification", "drawable", context.getPackageName());
        if (resId != 0) {
            return resId;
        }
        return android.R.drawable.ic_dialog_info;
    }

    private static NotificationManager getManager(Context context) {
        return (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
    }

    static String formatExerciseName(String name) {
        if (name == null) {
            return "";
        }
        String trimmed = name.trim();
        if (trimmed.isEmpty()) {
            return "";
        }
        return trimmed.substring(0, 1).toUpperCase(Locale.getDefault()) + trimmed.substring(1);
    }
}
