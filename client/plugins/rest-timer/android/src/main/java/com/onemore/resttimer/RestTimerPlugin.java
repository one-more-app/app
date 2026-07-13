package com.onemore.resttimer;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.time.Instant;
import java.time.format.DateTimeParseException;

@CapacitorPlugin(
    name = "RestTimer",
    permissions = { @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications") }
)
public class RestTimerPlugin extends Plugin {

    @Override
    public void load() {
        RestTimerNotificationHelper.ensureChannels(getContext());
    }

    @PluginMethod
    public void start(PluginCall call) {
        String createdAt = call.getString("createdAt");
        Double targetMs = call.getDouble("targetMs");
        String exerciseId = call.getString("exerciseId", "");
        String exerciseName = call.getString("exerciseName", "");
        String title = call.getString("title", "Repos");
        String finishedTitle = call.getString("finishedTitle", "Temps de repos terminé");
        String deepLinkRoute = call.getString("deepLinkRoute", "/home");

        if (createdAt == null || targetMs == null) {
            call.reject("createdAt et targetMs sont requis.");
            return;
        }

        if (!hasNotificationPermission()) {
            call.reject("Permission notifications refusée.", "NOT_AUTHORIZED");
            return;
        }

        long createdAtMs = parseIsoToMillis(createdAt);
        if (createdAtMs <= 0L) {
            call.reject("createdAt invalide.");
            return;
        }

        long target = Math.max(0L, Math.round(targetMs));
        long now = System.currentTimeMillis();
        long fireAt = createdAtMs + target;
        if (fireAt <= now) {
            cancelInternal();
            call.resolve();
            return;
        }

        RestTimerState state = new RestTimerState(
            createdAtMs,
            target,
            exerciseId,
            exerciseName,
            title,
            finishedTitle,
            deepLinkRoute,
            true
        );
        state.save(getContext());
        RestTimerAlarmScheduler.scheduleAll(getContext(), state);
        RestTimerNotificationHelper.showOngoing(
            getContext(),
            state,
            state.getProgressPercent(now)
        );
        call.resolve();
    }

    @PluginMethod
    public void update(PluginCall call) {
        Double targetMs = call.getDouble("targetMs");
        if (targetMs == null) {
            call.reject("targetMs est requis.");
            return;
        }

        RestTimerState state = RestTimerState.load(getContext());
        if (state == null) {
            call.resolve();
            return;
        }

        long target = Math.max(0L, Math.round(targetMs));
        long now = System.currentTimeMillis();
        RestTimerState updated = state.withTargetMs(target);
        long fireAt = updated.getFireAtMs();

        if (fireAt <= now) {
            cancelInternal();
            call.resolve();
            return;
        }

        updated.save(getContext());
        RestTimerAlarmScheduler.scheduleAll(getContext(), updated);
        if (updated.foregroundVisible) {
            RestTimerNotificationHelper.showOngoing(
                getContext(),
                updated,
                updated.getProgressPercent(now)
            );
        }
        call.resolve();
    }

    @PluginMethod
    public void setForegroundVisible(PluginCall call) {
        Boolean visible = call.getBoolean("visible");
        if (visible == null) {
            call.reject("visible est requis.");
            return;
        }

        RestTimerState state = RestTimerState.load(getContext());
        if (state == null) {
            call.resolve();
            return;
        }

        RestTimerState updated = state.withForegroundVisible(visible);
        updated.save(getContext());

        long now = System.currentTimeMillis();
        if (!updated.isActive(now)) {
            cancelInternal();
            call.resolve();
            return;
        }

        if (visible) {
            RestTimerNotificationHelper.showOngoing(
                getContext(),
                updated,
                updated.getProgressPercent(now)
            );
        } else {
            RestTimerNotificationHelper.cancel(getContext());
        }
        call.resolve();
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        cancelInternal();
        call.resolve();
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        call.resolve(buildPermissionResult());
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (hasNotificationPermission()) {
            call.resolve(buildPermissionResult());
            return;
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            call.resolve(buildPermissionResult());
            return;
        }
        requestPermissionForAlias("notifications", call, "permissionsCallback");
    }

    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        call.resolve(buildPermissionResult());
    }

    private void cancelInternal() {
        RestTimerState.clear(getContext());
        RestTimerAlarmScheduler.cancelAll(getContext());
        RestTimerNotificationHelper.cancel(getContext());
    }

    private JSObject buildPermissionResult() {
        JSObject ret = new JSObject();
        ret.put("granted", hasNotificationPermission());
        return ret;
    }

    private boolean hasNotificationPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            return NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
        }
        return (
            ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED
        );
    }

    private long parseIsoToMillis(String createdAt) {
        try {
            return Instant.parse(createdAt).toEpochMilli();
        } catch (DateTimeParseException ignored) {
            return -1L;
        }
    }
}
