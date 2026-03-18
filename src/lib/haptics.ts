import { Capacitor } from '@capacitor/core'

/** Retour haptique au changement de sélection (idéal pour slider) */
export async function hapticSelectionChanged(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return
    try {
        const { Haptics } = await import('@capacitor/haptics')
        await Haptics.selectionChanged()
    } catch {
        // Ignore si Haptics indisponible (web, etc.)
    }
}

/** Retour haptique léger (boutons, etc.) */
export async function hapticImpact(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return
    try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
        await Haptics.impact({ style: ImpactStyle.Light })
    } catch {
        // Ignore si Haptics indisponible
    }
}

/** Retour haptique type succès (record, palier, etc.) */
export async function hapticNotificationSuccess(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return
    try {
        const { Haptics, NotificationType } = await import('@capacitor/haptics')
        await Haptics.notification({ type: NotificationType.Success })
    } catch {
        // Ignore si Haptics indisponible
    }
}
