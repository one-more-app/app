# Blocage de version (force update)

Date : 2026-10-01  
Statut : validé (design)

## Problème

Les builds natives trop anciennes peuvent rester utilisables alors qu’une version store corrige un bug critique ou casse la compatibilité API. Il n’existe aujourd’hui aucun mécanisme pour forcer la mise à jour.

## Décisions

| Sujet | Choix |
|---|---|
| Type de blocage | Hard only (plein écran, pas de dismiss) |
| Source de config | Env API exposée via `GET /health` |
| Plateformes | `minVersion.ios` + `minVersion.android` séparées |
| Web | Non bloqué |
| Identifiant version | Marketing semver (`App.getInfo().version`) |
| Intégration client | Enrichir le probe ConnectivityGate existant |
| Fail-open | Env absente, parse invalide, version client inconnue → pas de blocage |

Hors scope : soft update, admin UI, blocage web, refus HTTP 426 sur les routes métier.

## Architecture

```
API /health ──► ConnectivityProvider (probe)
                    │
                    ├─ offline
                    ├─ maintenance
                    ├─ update_required ──► ForceUpdatePage (CTA store)
                    └─ ok ──► app
```

Une seule sonde au cold start, resume (visibility), interval quand bloqué, et retry manuel.

## API

### `GET /health` (enrichi, rétrocompatible)

```json
{
  "status": "ok",
  "minVersion": {
    "ios": "1.4.0",
    "android": "1.4.0"
  }
}
```

### Env

- `MIN_APP_VERSION_IOS` — ex. `1.4.0` ; vide / absent → pas de min iOS
- `MIN_APP_VERSION_ANDROID` — idem Android

Règles serveur :
- Toujours renvoyer `status: "ok"` si le process est sain (inchangé pour les probes infra).
- Inclure `minVersion` avec les valeurs présentes uniquement (clés omises si env vide).
- Ne pas valider / rejeter la requête selon la version client : le gate est côté client.

## Client

### Probe (`use-connectivity`)

1. Fetch `/health` (timeout / erreurs inchangés → offline ou maintenance).
2. Si unhealthy → `maintenance`.
3. Si plateforme native (`Capacitor.isNativePlatform`) :
   - Lire `App.getInfo().version`.
   - Prendre `minVersion.ios` ou `minVersion.android` selon `Capacitor.getPlatform()`.
   - Normaliser un éventuel préfixe `v`.
   - Comparer major.minor.patch (semver strict, sans prerelease/build).
   - Si `current < min` → `update_required`.
4. Web, min manquante, version inconnue / parse fail → `ok`.

Priorité des statuts : `offline` > `maintenance` > `update_required` > `ok`.

### Gate (`ConnectivityGate`)

Nouvelle branche : si `status === "update_required"` → `ForceUpdatePage`.

### UI (`ForceUpdatePage`)

- Même layout que offline / maintenance (`ConnectivityStatusLayout` ou variante avec CTA store).
- Copy i18n FR (titre + hint).
- CTA principal : **Mettre à jour** → ouvre l’App Store / Play Store (URLs déjà utilisées ailleurs dans l’app).
- Pas de bouton Continuer / dismiss.
- Bouton **Réessayer** conservé (après update sans kill de l’app).

## Edge cases

| Cas | Comportement |
|---|---|
| Env vide | Pas de blocage pour cette plateforme |
| Version client `–` / getInfo fail | Fail-open (`ok`) |
| `v1.2.3` | Traité comme `1.2.3` |
| Égalité `current === min` | Autorisé |
| Redeploy API nouvelle min | Pris au prochain probe |

## Tests

- API : shape `/health` + lecture env (présente / absente).
- Utilitaire semver : `1.3.9 < 1.4.0`, égalité OK, préfixe `v`.
- Gate : native outdated → page ; web → passe.

## Fichiers touchés (indicatif)

- `api/src/app.controller.ts` (+ service / config env)
- `api/.env.example`
- `client/src/hooks/use-connectivity.tsx`
- `client/src/components/ConnectivityGate.tsx`
- `client/src/pages/ForceUpdatePage.tsx` (nouveau)
- `client/src/lib/translations.ts`
- Utilitaire comparaison version (client, éventuellement shared)
- Tests unitaires associés
