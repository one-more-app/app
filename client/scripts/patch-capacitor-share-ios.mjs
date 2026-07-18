/**
 * Capacitor Share iOS : présenter UIActivityViewController depuis le VC
 * le plus haut au lieu de rejeter quand presentedViewController != nil.
 * Fix freeze Partager avec modale célébration ouverte.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const target = path.join(
  root,
  'node_modules/@capacitor/share/ios/Sources/SharePlugin/SharePlugin.swift',
)

const marker = 'One More: present share from topmost view controller'

let source
try {
  source = readFileSync(target, 'utf8')
} catch {
  console.warn('[patch-share-ios] SharePlugin.swift introuvable — skip')
  process.exit(0)
}

if (source.includes(marker)) {
  process.exit(0)
}

const needle = `            if self?.bridge?.viewController?.presentedViewController != nil {
                call.reject("Can't share while sharing is in progress")
                return
            }
            self?.setCenteredPopover(actionController)
            self?.bridge?.viewController?.present(actionController, animated: true, completion: nil)`

const replacement = `            // ${marker}
            guard let root = self?.bridge?.viewController else {
                call.reject("No view controller")
                return
            }
            var presenter = root
            while let presented = presenter.presentedViewController {
                if presented is UIActivityViewController {
                    call.reject("Can't share while sharing is in progress")
                    return
                }
                presenter = presented
            }
            self?.setCenteredPopover(actionController)
            presenter.present(actionController, animated: true, completion: nil)`

if (!source.includes(needle)) {
  console.warn('[patch-share-ios] SharePlugin.swift pattern introuvable — skip')
  process.exit(0)
}

writeFileSync(target, source.replace(needle, replacement), 'utf8')
console.log('[patch-share-ios] SharePlugin.swift patched')
