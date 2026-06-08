import { Capacitor } from '@capacitor/core'

async function runImpact(style: 'Light' | 'Medium' | 'Heavy'): Promise<void> {
    if (!Capacitor.isNativePlatform()) return
    try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
        await Haptics.impact({ style: ImpactStyle[style] })
    } catch {
        // Ignore si Haptics indisponible (web, etc.)
    }
}

async function runNotification(
    type: 'Success' | 'Warning' | 'Error',
): Promise<void> {
    if (!Capacitor.isNativePlatform()) return
    try {
        const { Haptics, NotificationType } = await import('@capacitor/haptics')
        await Haptics.notification({ type: NotificationType[type] })
    } catch {
        // Ignore si Haptics indisponible
    }
}

/** Retour haptique au changement de sélection (sliders, filtres, onglets) */
export async function hapticSelectionChanged(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return
    try {
        const { Haptics } = await import('@capacitor/haptics')
        await Haptics.selectionChanged()
    } catch {
        // Ignore si Haptics indisponible
    }
}

/** Retour haptique léger (boutons, cartes, actions courantes) */
export async function hapticImpact(): Promise<void> {
    await runImpact('Light')
}

/** Retour haptique moyen (actions importantes, ouverture de drawer) */
export async function hapticImpactMedium(): Promise<void> {
    await runImpact('Medium')
}

/** Retour haptique fort (promotion de ligue, actions majeures) */
export async function hapticImpactHeavy(): Promise<void> {
    await runImpact('Heavy')
}

/** Retour haptique type succès (record, palier, célébration) */
export async function hapticNotificationSuccess(): Promise<void> {
    await runNotification('Success')
}

/** Retour haptique type avertissement (limite atteinte, etc.) */
export async function hapticNotificationWarning(): Promise<void> {
    await runNotification('Warning')
}

/** Retour haptique type erreur (échec d'action) */
export async function hapticNotificationError(): Promise<void> {
    await runNotification('Error')
}

/** Changement d'onglet ou de section dans la navigation */
export function hapticTab(): void {
    void hapticSelectionChanged()
}

/** Haptique adaptée au variant d'un bouton */
export function triggerButtonHaptic(variant?: string | null): void {
    if (variant === 'destructive' || variant === 'outline-destructive') {
        void hapticImpactMedium()
        return
    }
    if (variant === 'ghost' || variant === 'link' || variant === 'outline') {
        void hapticSelectionChanged()
        return
    }
    void hapticImpact()
}
