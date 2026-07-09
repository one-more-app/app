package com.onemore.gymgeofence;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import com.google.android.gms.location.Geofence;
import com.google.android.gms.location.GeofencingEvent;

public class GeofenceBroadcastReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        GeofencingEvent event = GeofencingEvent.fromIntent(intent);
        if (event == null) return;
        if (event.hasError()) return;

        if (event.getGeofenceTransition() == Geofence.GEOFENCE_TRANSITION_ENTER) {
            GymGeofencePlugin.showEnterNotification(context.getApplicationContext());
        }
    }
}
