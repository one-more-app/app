package com.onemore.resttimer;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class RestTimerAlarmReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) {
            return;
        }

        RestTimerState state = RestTimerState.load(context);
        if (state == null) {
            RestTimerAlarmScheduler.cancelAll(context);
            RestTimerNotificationHelper.cancel(context);
            return;
        }

        long now = System.currentTimeMillis();
        String action = intent.getAction();

        if (RestTimerAlarmScheduler.ACTION_FINISHED.equals(action)) {
            handleFinished(context, state, now);
            return;
        }

        if (RestTimerAlarmScheduler.ACTION_PROGRESS.equals(action)) {
            handleProgress(context, state, now);
        }
    }

    private void handleFinished(Context context, RestTimerState state, long nowMs) {
        RestTimerAlarmScheduler.cancelAll(context);
        RestTimerState.clear(context);
        RestTimerNotificationHelper.showFinished(context, state);
    }

    private void handleProgress(Context context, RestTimerState state, long nowMs) {
        if (!state.isActive(nowMs)) {
            handleFinished(context, state, nowMs);
            return;
        }

        if (state.foregroundVisible) {
            RestTimerNotificationHelper.showOngoing(
                context,
                state,
                state.getProgressPercent(nowMs)
            );
        }

        RestTimerAlarmScheduler.scheduleNextProgress(context, state, nowMs);
    }
}
