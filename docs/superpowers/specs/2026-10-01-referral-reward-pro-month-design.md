# Parrainage : t-shirt → 1 mois PRO gratuit

Date : 2026-10-01  
Statut : validé (design)

## Problème

Aujourd’hui, à **5 filleuls**, le parrain débloque un **t-shirt édition limitée** (claim adresse, gate app, Notion/ops). On veut remplacer cette récompense par **1 mois de PRO gratuit**, tout en préservant le flow t-shirt pour ceux qui l’ont déjà débloqué.

## Décisions

| Sujet | Choix |
|---|---|
| Bénéficiaire | Parrain uniquement |
| Seuil | Inchangé : 5 filleuls |
| Attribution | Automatique (grant promo RevenueCat) + notif |
| Déjà PRO | Bloc parrainage masqué (inchangé) — pas de cas gift sur abonné actif |
| Legacy t-shirt | Conservé pour utilisateurs déjà débloqués / claim en cours |
| Nouveaux unlocks | 1 mois PRO (plus de t-shirt referral) |
| Pack annuel (2 t-shirts) | Hors scope, inchangé |
| Bonus exercices | Inchangé (+10 / filleul) |
| Mécanisme PRO | Grant promotional RevenueCat (pas de flag local seul) |

Hors scope : codes promo internes, crédits PRO génériques, récompense filleul, modification du pack annuel.

## Flux produit

### Nouveau chemin (pas encore débloqué)

1. Parrain partage son `inviteCode` ; filleuls s’inscrivent / appliquent le code.
2. Compteur `referralCount` atteint **5**.
3. Backend : grant promo RC entitlement `premium` ~**30 jours** (idempotent, 1× par user).
4. Webhook RC `TEMPORARY_ENTITLEMENT_GRANT` → `users.isPremium = true`.
5. Notif push + event realtime : mois PRO offert (plus de `tshirtUnlocked`).
6. UI battle pass / banner affiche « 1 mois PRO » (pas de formulaire adresse, pas de gate claim).
7. À l’expiration RC → webhook `EXPIRATION` → `isPremium = false`.

### Chemin legacy (déjà débloqué t-shirt)

1. Une row `tshirt_reward_claims` de type `referral_limited` existe déjà.
2. UI **t-shirt actuelle** conservée (banner, battle pass, claim adresse).
3. Gate `App.tsx` reste active tant que le claim t-shirt est pending.
4. **Aucun** grant PRO referral pour ces users.

## Architecture technique

### Détection unlock

Dans `ReferralService` (après apply code / signup), quand `hasJustUnlockedTshirtReward` (ou équivalent seuil 5) :

- Si claim t-shirt `referral_limited` déjà présent → ne rien changer (legacy).
- Sinon → **grant PRO** (nouveau chemin), **ne pas** créer `ensureReferralPendingReward`.

### Grant RevenueCat

- Nouveau helper dans `BillingService` (ou module dédié) : appel API RC promotional entitlement.
- Env : secret API RC, entitlement id (défaut `premium`), durée ~1 mois.
- Enregistrement d’attribution (table ou colonne) pour **idempotence** : un seul gift referral par user.
- Retry / log si l’appel RC échoue ; l’user reste éligible jusqu’à succès (pas de fallback t-shirt).

### Accès / API

- `GET /me/access` : exposer un signal clair du type de récompense :
  - `referralRewardKind: 'tshirt' | 'pro_month' | null`
  - éligibilité / unlocked selon le cas
- `pendingRewards` / gate claim : uniquement pour t-shirts encore pending (referral legacy + annual pack).

### UI client

- Si `referralRewardKind === 'tshirt'` (legacy) → composants / copy t-shirt actuels.
- Sinon → battle pass / banner / traductions orientés « 1 mois PRO ».
- Visuel nœud cadeau adapté pour le chemin PRO.
- Bloc parrainage toujours masqué si `isPremium`.

### Notifications

- Remplacer le message « T-shirt débloqué » par « 1 mois PRO offert » pour le nouveau chemin.
- Legacy : conserver les notifs / états t-shirt existants.

## Erreurs & cas limites

| Cas | Comportement |
|---|---|
| Grant RC échoue | Retry + log ; pas de t-shirt de secours ; retry jusqu’à succès |
| User déjà PRO au unlock | Edge rare (bloc masqué) → skip grant |
| Double événement unlock | Idempotence via record d’attribution |
| Filleul | Aucun mois PRO |
| Claim t-shirt annual pack | Inchangé |

## Tests attendus

- 5ᵉ filleul sans claim t-shirt → grant RC appelé 1× + notif PRO.
- User avec `referral_limited` claim → pas de grant ; UI t-shirt.
- Re-apply / double trigger → pas de second grant.
- Gate adresse uniquement si pending t-shirt.
- Copy / battle pass selon `referralRewardKind`.

## Fichiers impactés (indicatif)

- API : `referral.service.ts`, `access.service.ts`, `access-config.ts`, `billing.service.ts`, `rewards.service.ts`, `notification-dispatch.service.ts`
- Client : `referral/*`, `translations.ts`, `App.tsx` (gate), éventuellement `rewards-api` / `social-api`
- Docs / env : variables RC pour promotional grants
