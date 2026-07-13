package com.onemore.resttimer;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class RestTimerBootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            return;
        }

        RestTimerState state = RestTimerState.load(context);
        if (state == null) {
            return;
        }

        long now = System.currentTimeMillis();
        if (!state.isActive(now)) {
            RestTimerState.clear(context);
            RestTimerAlarmScheduler.cancelAll(context);
            RestTimerNotificationHelper.cancel(context);
            return;
        }

        RestTimerAlarmScheduler.scheduleAll(context, state);
        if (state.foregroundVisible) {
            RestTimerNotificationHelper.showOngoing(
                context,
                state,
                state.getProgressPercent(now)
            );
        }
    }
}
