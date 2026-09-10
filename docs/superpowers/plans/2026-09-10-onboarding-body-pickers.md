# Onboarding body pickers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centrer les sélecteurs poids/taille/âge, labels 10 kg sur la règle, hero sur la ligne sélectionnée de la roue, haptique à chaque cran.

**Architecture:** Ajustements ciblés dans `OnboardingRulerPicker` et `OnboardingVerticalWheelPicker`. Haptique déjà fourni par `hapticSelectionChanged` / `WheelPicker` (`haptic` défaut `true`).

**Tech Stack:** React, Tailwind, `@ncdai/react-wheel-picker`, Capacitor Haptics via `@/lib/haptics`.

## Global Constraints

- Copy UI : aucun `--` ni `—` dans les chaînes affichées.
- Taille et âge : même composant / même rendu.
- Pas de changement API `OnboardingPage` sauf `className` de centrage si besoin.

---

## File map

| Fichier | Rôle |
|---|---|
| `client/src/components/onboarding/OnboardingRulerPicker.tsx` | Labels 10 kg + centrage + haptique conservé |
| `client/src/components/onboarding/OnboardingVerticalWheelPicker.tsx` | Hero sur highlight, unité à droite, centrage, haptique |

### Task 1: Règle poids — labels 10 kg + centrage

**Files:**
- Modify: `client/src/components/onboarding/OnboardingRulerPicker.tsx`

- [x] **Step 1:** Sous chaque cran majeur (`Math.round(option) % 10 === 0` pour step 0.5), afficher le label numérique (`text-[10px]` ou `text-xs`, `muted-foreground`, `tabular-nums`). Augmenter la hauteur du track si besoin pour accueillir labels.
- [x] **Step 2:** Vérifier `items-center` / full-width centré ; garder `hapticSelectionChanged` + `primeHaptics`.
- [x] **Step 3:** Vérifier visuellement sur `/#/onboarding?step=body` (poids).

### Task 2: Roue taille/âge — hero inline + unité + haptique

**Files:**
- Modify: `client/src/components/onboarding/OnboardingVerticalWheelPicker.tsx`

- [x] **Step 1:** Retirer le `<p>` hero au-dessus.
- [x] **Step 2:** `highlightItem` → `text-5xl sm:text-6xl font-bold italic` ; augmenter `optionItemHeight` / hauteur wrapper (`h-64` ou plus).
- [x] **Step 3:** Overlay unité à droite de la zone highlight (absolute, `pointer-events-none`).
- [x] **Step 4:** Ne pas passer `haptic={false}` ; garder `primeHaptics`.
- [x] **Step 5:** Vérifier taille + âge sur onboarding body.

### Task 3: Smoke rapide

- [x] **Step 1:** Lancer smoke body si dispo, ou check manuel + lint sur fichiers touchés.
