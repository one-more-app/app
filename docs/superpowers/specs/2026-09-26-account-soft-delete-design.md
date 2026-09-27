# Soft delete compte + email confirmation + tracking OpenPanel

Date : 2026-09-26  
Statut : implémenté

## Problème

Aujourd’hui, « Supprimer mon compte » dans Settings ouvre un `mailto` pré-rempli vers `admin@one-more.app`. Aucune suppression réelle, pas de confirmation produit, pas de collecte structurée de motifs, pas de tracking.

On veut :

1. Soft-delete immédiat du compte utilisateur à la confirmation.
2. Email brandé (style event thank-you) confirmant la suppression et invitant à répondre pour plus de détail.
3. Collecte de motif + commentaire dans l’app avant suppression.
4. Event OpenPanel client `account_deletion_requested` pour tracker les demandes.

## Décisions

| Sujet | Choix |
|---|---|
| Soft delete | Immédiat (`users.deletedAt`), pas de hard delete auto, pas d’anonymisation |
| Données associées | Uniquement le user : `deletedAt` + révocation sessions / device tokens. Pas de cascade soft-delete perfs / social |
| Feedback | Motif + commentaire dans l’app **et** invite à répondre dans l’email |
| OpenPanel | Client uniquement (avant l’appel API) |
| Architecture | Endpoint unique `DELETE /auth/account` |

Hors scope : hard delete / purge GDPR, anonymisation PII, soft-delete cascade des données métier, tracking OpenPanel serveur, période de grâce avec restauration self-service.

## Flux produit

1. Settings → « Supprimer mon compte » ouvre un **dialog** (remplace le `mailto`).
2. Dialog : confirmation claire + sélection d’un **motif** (liste fixe) + **commentaire libre optionnel** (obligatoire si motif `other`).
3. Confirm → client track `account_deletion_requested` (props non-PII) → `DELETE /auth/account` avec `{ reason, comment? }`.
4. API : set `deletedAt`, revoke sessions + device tokens, persiste le feedback, envoie l’email brandé (best-effort).
5. Client : logout local + message de succès (« compte supprimé, email de confirmation envoyé ») → écran auth.
6. Auth ultérieure (login email, OAuth, refresh) : refuse si `deletedAt IS NOT NULL`.

## Motifs de suppression

Clés stables (API + OpenPanel), labels FR côté UI :

| Clé | Label |
|---|---|
| `too_expensive` | Trop cher |
| `not_useful` | Pas assez utile au quotidien |
| `missing_features` | Fonctionnalités manquantes |
| `bugs_or_friction` | Bugs / friction |
| `privacy` | Confidentialité / données |
| `other` | Autre |

Commentaire : optionnel, max ~1000 caractères ; **requis** si `reason === 'other'`.

## Architecture technique

### Données

- Migration : `users.deletedAt TIMESTAMPTZ NULL`
- Table `account_deletion_feedback` (ou équivalent) :
  - `id`, `userId`, `reason`, `comment` (nullable), `createdAt`
  - Permet de conserver le motif sans polluer `users`

### Backend

- `AuthService.deleteAccount(userId, { reason, comment? })` :
  1. Si déjà soft-deleted → réponse idempotente (404 ou 410).
  2. `users.deletedAt = now()`.
  3. Revoke toutes les sessions (`revokedAt`).
  4. Désactive / purge les device tokens push de l’user.
  5. Insert feedback (`reason`, `comment`).
  6. Envoi email brandé (best-effort : échec mail loggé, delete non rollbacké).
- Endpoint : `DELETE /auth/account` (auth required), body DTO validé (`reason` enum + `comment` optionnel).
- Lookups auth : filtre `deletedAt IS NULL` sur login email, OAuth, refresh session.

### Email

- Nouveau template `account-deletion-template.ts`, même style que `event-thankyou-template.ts` (font One More, couleurs, logo, layout table email-safe).
- Contenu : confirmation de suppression + remerciement + CTA « Répondre » (reply-to support).
- Envoi via le transporteur SMTP déjà utilisé pour l’event thank-you.

### Client

- Remplacer `handleDeleteAccount` (mailto) par dialog + API.
- Ajouter `AnalyticsEvents.ACCOUNT_DELETION_REQUESTED` dans la taxonomie.
- Props trackées (non-PII) : `reason`, `has_comment` (bool), `is_premium` (bool).
- Mettre à jour `openpanel-tracking.mdc`.
- Strings UI FR dans `translations.ts`.

## Gestion d’erreurs

| Cas | Comportement |
|---|---|
| User déjà soft-deleted | 404/410 idempotent |
| API / réseau échoue | Toast erreur, pas de logout |
| Email échoue | Log serveur ; soft delete + logout client OK |
| Motif `other` sans commentaire | Validation client + serveur |

## Tests

- Unit API : `deleteAccount` set `deletedAt`, revoke sessions, ne rollback pas si mail fail.
- Unit API : login / refresh refusent un user soft-deleted.
- Client : validation dialog (motif requis, `other` + commentaire).
- Taxonomie : event `account_deletion_requested` présent et documenté.

## Succès

- Un utilisateur confirmé ne peut plus se reconnecter.
- Il reçoit un email brandé de confirmation avec invite à répondre.
- OpenPanel reçoit un event client par demande, avec motif structuré.
- Plus aucun flux `mailto` pour la suppression de compte.
