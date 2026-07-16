import { UI } from '@/lib/translations'

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
