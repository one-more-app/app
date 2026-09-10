# Onboarding : cascade de notifications

Date : 2026-09-10  
Statut : implémenté

## Problème

L’étape notifications de l’onboarding est trop statique : sous-titre redondant, cartes avec dégradés photo, seulement 2 mocks, pas de sensation « notif qui arrive ».

## Décisions

- Approche : cascade « push qui tombe » (slide-in from top + haptic Light à chaque arrivée).
- Sous-titre retiré de l’UI.
- Dégradés photo retirés.
- Image uniquement sur la 1ʳᵉ notif (séance Ambre). Image Tony retirée.
- 4 mocks alignés sur les copy push réelles de l’API.
- `prefers-reduced-motion` : tout visible d’un coup, sans cascade ni haptic.

## Mix des 4 notifs

| # | Type | Image | Timing d’entrée |
|---|---|---|---|
| 1 | Séance en cours (Ambre · squat) | oui | ~200 ms |
| 2 | Nouveau record (Tony · hammer curl) | non | ~700 ms |
| 3 | Série en danger | non | ~1200 ms |
| 4 | Réaction sur ta séance | non | ~1700 ms |

Stagger ≈ 500 ms. Animation ≈ 350–400 ms, `ease-out`, `slide-in-from-top` + fade.

## UI carte

- `bg-card`, `rounded-3xl`, `shadow-md`, `ring-1 ring-border/50`
- Header : logo accent + titre + heure + body
- Pas de gradient overlay sur l’image

## Fichiers

- `client/src/components/onboarding/OnboardingNotificationsStep.tsx`
- `client/src/lib/translations.ts` (nouvelles clés mock streak / réaction)

## Hors scope

- Changement du titre, CTA, logique push / skip
- Tests e2e (titre + CTA inchangés)
