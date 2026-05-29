import { Capacitor } from '@capacitor/core'

const SIDES = ['top', 'right', 'bottom', 'left'] as const

/**
 * Lit env(safe-area-inset-*) via un élément sonde et recopie sur --safe-area-inset-*
 * (utile quand var(--safe-top) reste à 0 sur iOS / certains WebView Android).
 */
export function syncSafeAreaCssVariables(): void {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const probe = document.createElement('div')
    probe.setAttribute('aria-hidden', 'true')
    probe.style.cssText =
        'position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;padding:0;'
    document.body.appendChild(probe)

    for (const side of SIDES) {
        probe.style.paddingTop = '0'
        probe.style.paddingRight = '0'
        probe.style.paddingBottom = '0'
        probe.style.paddingLeft = '0'
        probe.style.setProperty(`padding-${side}`, `env(safe-area-inset-${side})`)
        const value = getComputedStyle(probe).getPropertyValue(`padding-${side}`).trim()
        if (value && value !== '0px') {
            root.style.setProperty(`--safe-area-inset-${side}`, value)
        }
    }

    probe.remove()
}

export function scheduleSafeAreaCssSync(): void {
    if (!Capacitor.isNativePlatform()) return
    syncSafeAreaCssVariables()
    requestAnimationFrame(syncSafeAreaCssVariables)
    window.addEventListener('resize', syncSafeAreaCssVariables)
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', syncSafeAreaCssVariables)
    }
}
