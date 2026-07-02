import { Capacitor } from '@capacitor/core'
import { Keyboard } from '@capacitor/keyboard'
import { useEffect } from 'react'

/**
 * Expose la hauteur du clavier natif via la variable CSS `--keyboard-inset`
 * sur l'élément `<html>`, et bascule `data-keyboard-open` pour le styling.
 *
 * Combiné avec `KeyboardResize.None` dans `capacitor.config.ts`, ça permet
 * aux drawers (Vaul) et écrans de se décaler en CSS proprement,
 * plutôt que de subir le resize WebView + scroll auto d'iOS qui pousse
 * les overlays hors de l'écran.
 *
 * Fallback web : écoute `visualViewport.resize` pour détecter l'ouverture
 * du clavier soft dans un navigateur mobile.
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

        if (Capacitor.isNativePlatform()) {
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
