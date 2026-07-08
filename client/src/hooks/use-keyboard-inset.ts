import { Capacitor } from '@capacitor/core'
import { Keyboard } from '@capacitor/keyboard'
import { useEffect } from 'react'

/**
 * Expose la hauteur du clavier natif via la variable CSS `--keyboard-inset`
 * sur `<html>`, et bascule `data-keyboard-open` pour le styling.
 *
 * ⚠️ Stratégie DIFFÉRENTE par plateforme — ne pas uniformiser :
 *
 * - iOS : `KeyboardResize.None` (voir `capacitor.config.ts`) gèle la WebView,
 *   iOS ne pousse rien tout seul. C'est CE hook qui alimente `--keyboard-inset`
 *   pour que le drawer / la page se décale en CSS. Sans lui, tout passe sous
 *   le clavier.
 *
 * - Android : le champ `resize` du plugin est iOS-only. Sur Android c'est
 *   `MainActivity.applyForcedEdgeToEdgeInsets()` qui ajoute
 *   `padding-bottom = ime.bottom` au parent de la WebView → la WebView
 *   rétrécit de la hauteur du clavier, donc `position: fixed; bottom: 0`
 *   se retrouve AUTOMATIQUEMENT au-dessus du clavier. Appliquer en plus
 *   `--keyboard-inset` doublerait le décalage (drawer trop haut, max-height
 *   riquiqui, wheel picker coupé). On laisse donc `--keyboard-inset = 0px`.
 *
 * - Web (navigateur mobile) : fallback `visualViewport` — le browser fournit
 *   déjà la nouvelle hauteur visible, on l'expose en variable pour rester
 *   cohérent avec iOS.
 *
 * Règle si tu ajoutes un nouveau fix clavier : n'affecte QUE la plateforme
 * concernée (via `Capacitor.getPlatform()` ou du CSS `[data-platform="…"]`).
 */
export function useKeyboardInset() {
    useEffect(() => {
        if (typeof document === 'undefined') return

        const root = document.documentElement
        const setInset = (px: number) => {
            const clamped = Math.max(0, Math.round(px))
            root.style.setProperty('--keyboard-inset', `${clamped}px`)
            if (clamped > 0) {
                root.dataset.keyboardOpen = 'true'
            } else {
                delete root.dataset.keyboardOpen
            }
        }

        setInset(0)

        const platform = Capacitor.getPlatform()

        if (platform === 'ios') {
            const showHandle = Keyboard.addListener('keyboardWillShow', (info) => {
                setInset(info.keyboardHeight)
            })
            const hideHandle = Keyboard.addListener('keyboardWillHide', () => {
                setInset(0)
            })
            return () => {
                void showHandle.then((h) => h.remove())
                void hideHandle.then((h) => h.remove())
                setInset(0)
            }
        }

        if (platform === 'android') {
            // Rien à faire : MainActivity.java rétrécit déjà la WebView via
            // `padding-bottom = ime.bottom`. Toute valeur d'inset côté CSS
            // ferait double emploi.
            return
        }

        const vv = window.visualViewport
        if (!vv) return

        const updateFromVv = () => {
            const diff = window.innerHeight - (vv.height + vv.offsetTop)
            setInset(diff)
        }
        updateFromVv()
        vv.addEventListener('resize', updateFromVv)
        vv.addEventListener('scroll', updateFromVv)
        return () => {
            vv.removeEventListener('resize', updateFromVv)
            vv.removeEventListener('scroll', updateFromVv)
            setInset(0)
        }
    }, [])
}
