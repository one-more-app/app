import { UI } from '@/lib/translations'

export function isGymWaitPermissionsReady({
    hasGym,
    notificationsOn,
    locationOn,
    isNative,
}: {
    hasGym: boolean
    notificationsOn: boolean
    locationOn: boolean
    isNative: boolean
}): boolean {
    if (!hasGym || !notificationsOn) return false
    return !isNative || locationOn
}

export function resolveGymWaitHeadline({
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
        return UI.gymOnboardingWaitHeadlineNoGym
    }

    if (
        isGymWaitPermissionsReady({
            hasGym,
            notificationsOn,
            locationOn,
            isNative,
        })
    ) {
        return UI.gymOnboardingWaitHeadlineReady.replace('{name}', gymName)
    }

    return UI.gymOnboardingWaitHeadlineMissingPerms.replace('{name}', gymName)
}

export function resolveGymWaitMonitoringBody({
    gymName,
    isNative,
}: {
    gymName: string
    isNative: boolean
}): string {
    if (isNative) {
        return UI.gymOnboardingWaitMonitoringBodyNative.replace('{name}', gymName)
    }
    return UI.gymOnboardingWaitMonitoringBodyWeb
}
