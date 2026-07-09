package com.onemore.gymgeofence;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.location.Geofence;
import com.google.android.gms.location.GeofencingClient;
import com.google.android.gms.location.GeofencingRequest;
import com.google.android.gms.location.LocationServices;

@CapacitorPlugin(name = "GymGeofence")
public class GymGeofencePlugin extends Plugin {

    private static final String PREFS = "gym_geofence_prefs";
    private static final String KEY_TITLE = "notification_title";
    private static final String KEY_BODY = "notification_body";
    private static final String KEY_ROUTE = "deep_link_route";
    private static final String KEY_IDENTIFIER = "geofence_identifier";
    private static final int NOTIFICATION_ID = 43;
    private static final String CHANNEL_ID = "gym-reminder";

    private GeofencingClient geofencingClient;

    @Override
    public void load() {
        geofencingClient = LocationServices.getGeofencingClient(getContext());
        ensureNotificationChannel();
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

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
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

    private void ensureNotificationChannel() {
        ensureStaticNotificationChannel(getContext());
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
