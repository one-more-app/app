package com.onemore.gymgeofence;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.app.NotificationCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.android.gms.location.Geofence;
import com.google.android.gms.location.GeofencingClient;
import com.google.android.gms.location.GeofencingRequest;
import com.google.android.gms.location.LocationServices;

@CapacitorPlugin(
    name = "GymGeofence",
    permissions = {
        @Permission(
            strings = { Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION },
            alias = "location"
        ),
        @Permission(strings = { Manifest.permission.ACCESS_BACKGROUND_LOCATION }, alias = "backgroundLocation"),
    }
)
public class GymGeofencePlugin extends Plugin {

    private static final String PREFS = "gym_geofence_prefs";
    private static final String KEY_TITLE = "notification_title";
    private static final String KEY_BODY = "notification_body";
    private static final String KEY_ROUTE = "deep_link_route";
    private static final String KEY_IDENTIFIER = "geofence_identifier";
    private static final int NOTIFICATION_ID = 43;
    private static final String CHANNEL_ID = "gym-reminder";

    private GeofencingClient geofencingClient;
    private PluginCall pendingPermissionCall;

    @Override
    public void load() {
        geofencingClient = LocationServices.getGeofencingClient(getContext());
        ensureNotificationChannel();
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        resolvePendingPermissionCall();
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        call.resolve(buildPermissionResult());
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        JSObject current = buildPermissionResult();
        if (current.getBoolean("ready", false)) {
            call.resolve(current);
            return;
        }
        if (current.getBoolean("needsSettings", false)) {
            call.resolve(current);
            return;
        }
        if (pendingPermissionCall != null) {
            call.resolve(buildPermissionResult());
            return;
        }

        pendingPermissionCall = call;
        if (getPermissionState("location") != PermissionState.GRANTED) {
            requestPermissionForAlias("location", call, "permissionsCallback");
            return;
        }
        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q &&
            getPermissionState("backgroundLocation") != PermissionState.GRANTED
        ) {
            requestPermissionForAlias("backgroundLocation", call, "permissionsCallback");
            return;
        }
        resolvePendingPermissionCall();
    }

    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        pendingPermissionCall = null;
        if (getPermissionState("location") != PermissionState.GRANTED) {
            call.resolve(buildPermissionResult());
            return;
        }
        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q &&
            getPermissionState("backgroundLocation") != PermissionState.GRANTED
        ) {
            pendingPermissionCall = call;
            requestPermissionForAlias("backgroundLocation", call, "permissionsCallback");
            return;
        }
        call.resolve(buildPermissionResult());
    }

    private void resolvePendingPermissionCall() {
        if (pendingPermissionCall == null) {
            return;
        }
        PluginCall call = pendingPermissionCall;
        pendingPermissionCall = null;
        call.resolve(buildPermissionResult());
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        if (tryOpenBackgroundLocationPermissionFlow(call, "openSettingsCallback")) {
            return;
        }
        openApplicationDetailsSettings();
        call.resolve();
    }

    @PermissionCallback
    private void openSettingsCallback(PluginCall call) {
        call.resolve();
    }

    private boolean tryOpenBackgroundLocationPermissionFlow(PluginCall call, String callbackName) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            return false;
        }
        if (getPermissionState("location") != PermissionState.GRANTED) {
            return false;
        }
        if (getPermissionState("backgroundLocation") == PermissionState.GRANTED) {
            return false;
        }
        if (getPermissionState("backgroundLocation") != PermissionState.PROMPT) {
            return false;
        }
        requestPermissionForAlias("backgroundLocation", call, callbackName);
        return true;
    }

    private void openApplicationDetailsSettings() {
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        Uri uri = Uri.fromParts("package", getContext().getPackageName(), null);
        intent.setData(uri);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
    }

    @PluginMethod
    public void register(PluginCall call) {
        Double lat = call.getDouble("lat");
        Double lng = call.getDouble("lng");
        Double radiusM = call.getDouble("radiusM");
        String identifier = call.getString("identifier", "one-more-home-gym");
        String title = call.getString("notificationTitle", "Tu es à la salle");
        String body = call.getString("notificationBody", "Enregistre ta perf.");
        String route = call.getString("deepLinkRoute", "/home");

        if (lat == null || lng == null || radiusM == null) {
            call.reject("lat, lng et radiusM sont requis.");
            return;
        }

        JSObject permissions = buildPermissionResult();
        if (!permissions.getBoolean("ready", false)) {
            call.reject("Permissions de localisation insuffisantes.", "NOT_AUTHORIZED");
            return;
        }

        SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs
            .edit()
            .putString(KEY_TITLE, title)
            .putString(KEY_BODY, body)
            .putString(KEY_ROUTE, route)
            .putString(KEY_IDENTIFIER, identifier)
            .apply();

        Geofence geofence = new Geofence.Builder()
            .setRequestId(identifier)
            .setCircularRegion(lat, lng, radiusM.floatValue())
            .setExpirationDuration(Geofence.NEVER_EXPIRE)
            .setTransitionTypes(Geofence.GEOFENCE_TRANSITION_ENTER)
            .build();

        GeofencingRequest request = new GeofencingRequest.Builder()
            .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER)
            .addGeofence(geofence)
            .build();

        Intent intent = new Intent(getContext(), GeofenceBroadcastReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            getContext(),
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
        );

        geofencingClient
            .addGeofences(request, pendingIntent)
            .addOnSuccessListener(unused -> call.resolve())
            .addOnFailureListener(e -> call.reject("Impossible d'enregistrer le géofence: " + e.getMessage()));
    }

    @PluginMethod
    public void unregister(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String identifier = prefs.getString(KEY_IDENTIFIER, "one-more-home-gym");

        Intent intent = new Intent(getContext(), GeofenceBroadcastReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            getContext(),
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
        );

        geofencingClient
            .removeGeofences(pendingIntent)
            .addOnSuccessListener(unused -> {
                prefs.edit().clear().apply();
                call.resolve();
            })
            .addOnFailureListener(e -> call.reject("Impossible de retirer le géofence: " + e.getMessage()));
    }

    static void showEnterNotification(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String title = prefs.getString(KEY_TITLE, "Tu es à la salle");
        String body = prefs.getString(KEY_BODY, "Enregistre ta perf.");
        String route = prefs.getString(KEY_ROUTE, "/home");

        ensureStaticNotificationChannel(context);

        String url = "https://localhost/#" + route;
        Intent launchIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        launchIntent.setPackage(context.getPackageName());
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent contentIntent = PendingIntent.getActivity(
            context,
            NOTIFICATION_ID,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        int smallIcon = resolveNotificationIcon(context);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(smallIcon)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(contentIntent)
            .setColor(Color.parseColor("#DFFF5E"));

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, builder.build());
        }
    }

    private JSObject buildPermissionResult() {
        PermissionState locationState = getPermissionState("location");
        boolean locationGranted = locationState == PermissionState.GRANTED;
        PermissionState backgroundState =
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                ? getPermissionState("backgroundLocation")
                : PermissionState.GRANTED;
        boolean backgroundGranted =
            Build.VERSION.SDK_INT < Build.VERSION_CODES.Q || backgroundState == PermissionState.GRANTED;

        boolean needsSettings = false;
        if (!locationGranted) {
            needsSettings = locationState != PermissionState.PROMPT;
        } else if (!backgroundGranted) {
            needsSettings = backgroundState != PermissionState.PROMPT;
        }

        JSObject ret = new JSObject();
        ret.put("ready", locationGranted && backgroundGranted);
        ret.put("location", permissionStateToString(locationState, locationGranted));
        ret.put(
            "backgroundLocation",
            permissionStateToString(backgroundState, backgroundGranted)
        );
        ret.put("needsSettings", needsSettings);
        return ret;
    }

    private String permissionStateToString(PermissionState state, boolean granted) {
        if (granted) {
            return "granted";
        }
        if (state == PermissionState.PROMPT) {
            return "prompt";
        }
        return "denied";
    }

    private void ensureNotificationChannel() {
        ensureStaticNotificationChannel(getContext());
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

    private static void ensureStaticNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Rappel salle",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Notification quand tu arrives à ta salle.");
        manager.createNotificationChannel(channel);
    }
}
