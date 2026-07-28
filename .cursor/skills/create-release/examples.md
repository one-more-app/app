# Exemples de release notes (One More)

Référence pour calquer le ton et la structure. Les `—` des anciennes notes sont remplacés par `·` (règle copywriting actuelle).

## Mode changelog · structure cible (inspiré v0.1.1 / v0.1.2)

```markdown
# One More · Notes de version

**Période couverte :** 17 → 20 juillet 2026
**Contributeurs :** [Vixxs](https://github.com/one-more-app/app/commits?author=Vixxs), [tom-guastapaglia](https://github.com/one-more-app/app/commits?author=tom-guastapaglia)

## Nouveautés

- **Stand événementiel** : module événement côté API (entrées, records, statut célébration) et interface web dédiée. Écran TV leaderboard en direct (`/#/event/leaderboard`) avec alternance Hommes/Femmes. ([2cf87d1](https://github.com/one-more-app/app/commit/2cf87d1fc6286177aa53513472c9e511e885402c))
- **AppsFlyer OneLink** : liens d'invitation intelligents avec ouverture directe de l'app et récupération du code parrain. ([3931be3](https://github.com/one-more-app/app/commit/3931be3fbd0cff0b5ffa78c5ddb1c674cd42f8da))

## Corrections

- **Rest timer et fluidité UI** : opérations UIKit du timer de repos sur le thread principal (iOS). GIFs mis en pause quand une modale s'ouvre. ([6869a18](https://github.com/one-more-app/app/commit/6869a1855fa2bc245f506823d6c0a4d78a47ae3f))

## Divers

- **Stats publiques API** : endpoint `GET /public/stats/personal-records` pour le site marketing. ([ada3f69](https://github.com/one-more-app/app/commit/ada3f699e7a7bfdfa334b6a5f9a793bb90419a24))

**Full Changelog**: https://github.com/one-more-app/app/compare/v0.1.1...v0.1.2
```

## Mode store · ton produit (inspiré v0.1.4)

```markdown
Events et classements

Participe aux events One-More et grimpe le leaderboard face à la communauté. Ton nom, ta place, tes chiffres.

Réagis aux séances

Un tap suffit pour saluer un PR ou encourager un pote, sans couper ta concentration.

Mode hors ligne renforcé

L'app reste fiable en sous-sol ou en zone blanche. Tes séances se synchronisent dès que le réseau revient.

Rest timer plus fluide

Le compteur de repos a été optimisé pour réagir plus vite entre deux séries.

Quelques retouches sous le capot que tu ne verras pas, mais que tu ressentiras.
```

## Anti-pattern (ne pas reproduire)

```markdown
**Full Changelog**: https://github.com/one-more-app/app/compare/v0.1.5...v0.1.6
```

Trop pauvre : réservé au cas « notes minimales » demandé explicitement.

## Métadonnées GitHub

| Champ | Valeur |
|-------|--------|
| Tag | `vX.Y.Z` |
| Title | `Release vX.Y.Z` |
| Target | `main` (sauf consigne) |
