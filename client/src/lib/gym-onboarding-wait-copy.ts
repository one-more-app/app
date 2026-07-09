import { UI } from '@/lib/translations'

export function resolveGymWaitBodyCopy({
    hasGym,
    gymName,
    notificationsOn,
    locationOn,
    isNative,
}: {
    hasGym: boolean
    gymName: string
    notificationsOn: boolean
    locationOn: boolean
    isNative: boolean
}): string {
    if (!hasGym) {
        return UI.gymOnboardingWaitBodyNoGym
    }

    const locationReady = !isNative || locationOn
    if (notificationsOn && locationReady) {
        return UI.gymOnboardingWaitBodyReady.replace('{name}', gymName)
    }
    if (!notificationsOn && !locationReady && isNative) {
        return UI.gymOnboardingWaitBodyMissingBoth.replace('{name}', gymName)
    }
    if (!notificationsOn) {
        return UI.gymOnboardingWaitBodyMissingNotifications.replace('{name}', gymName)
    }
    return UI.gymOnboardingWaitBodyMissingLocation.replace('{name}', gymName)
}

export function resolveGymWaitRemindersHint({
    notificationsOn,
    locationOn,
    isNative,
}: {
    notificationsOn: boolean
    locationOn: boolean
    isNative: boolean
}): string {
    const locationReady = !isNative || locationOn
    if (notificationsOn && locationReady) {
        return UI.gymOnboardingWaitRemindersReady
    }
    return UI.gymOnboardingWaitRemindersPending
}
