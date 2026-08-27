import { Capacitor } from '@capacitor/core'

type HapticsModule = typeof import('@capacitor/haptics')

let hapticsMod: HapticsModule | null = null
let hapticsLoad: Promise<HapticsModule | null> | null = null

async function loadHaptics(): Promise<HapticsModule | null> {
    if (!Capacitor.isNativePlatform()) return null
    if (hapticsMod) return hapticsMod
    if (!hapticsLoad) {
        hapticsLoad = import('@capacitor/haptics')
            .then((mod) => {
                hapticsMod = mod
                return mod
            })
            .catch(() => {
                hapticsLoad = null
                return null
            })
    }
    return hapticsLoad
}

/** Précharge le plugin pour que le premier tick d'une roulette ne soit pas muet. */
export function primeHaptics(): void {
    void loadHaptics()
}

async function runImpact(style: 'Light' | 'Medium' | 'Heavy'): Promise<void> {
    const mod = await loadHaptics()
    if (!mod) return
    try {
        await mod.Haptics.impact({ style: mod.ImpactStyle[style] })
    } catch {
        // Ignore si Haptics indisponible (web, etc.)
    }
}

async function runNotification(
    type: 'Success' | 'Warning' | 'Error',
): Promise<void> {
    const mod = await loadHaptics()
    if (!mod) return
    try {
        await mod.Haptics.notification({ type: mod.NotificationType[type] })
    } catch {
        // Ignore si Haptics indisponible
    }
}

/** Retour haptique au changement de sélection (sliders, filtres, onglets) */
export async function hapticSelectionChanged(): Promise<void> {
    const mod = await loadHaptics()
    if (!mod) return
    try {
        await mod.Haptics.selectionChanged()
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
