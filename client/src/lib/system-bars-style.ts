import { SystemBarsStyle } from '@capacitor/core'
import type { ResolvedTheme } from '@/hooks/use-theme'

/** Routes plein écran (vidéo edge-to-edge) : pas de scrim ni padding html. */
export const IMMERSIVE_FULL_BLEED_ROUTES = new Set(['/onboarding', '/auth'])

/** Routes avec vidéo / fond sombre : icônes et texte de barre système clairs. */
const IMMERSIVE_DARK_ROUTES = IMMERSIVE_FULL_BLEED_ROUTES

export function getSystemBarsStyle(
    pathname: string,
    resolvedTheme: ResolvedTheme,
): SystemBarsStyle {
    if (IMMERSIVE_DARK_ROUTES.has(pathname)) {
        return SystemBarsStyle.Dark
    }
    return resolvedTheme === 'dark' ? SystemBarsStyle.Dark : SystemBarsStyle.Light
}
