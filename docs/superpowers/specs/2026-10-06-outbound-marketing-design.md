# Marketing sortant piloté par n8n

Date : 2026-10-06  
Statut : validé (design)

## Problème

Les règles marketing (récaps, rappels, séquences D+1) vivent dans l’API : copy en dur, crons multiples, difficile à faire évoluer sans déploiement. L’objectif est de délocaliser **quand et à qui** dans n8n, tout en gardant **quoi et comment** (templates, consentement, envoi, tracking) dans l’API.

## Décisions

| Sujet | Choix |
|---|---|
| Orchestration | n8n déclenche ; l’API fan-out, filtre consentement, envoie |
| Contenu | Données structurées en base → `renderTransactionalEmail` |
| Email | AWS SES v2 + Configuration Set (open/click/bounce via SNS) |
| Push | FCM existant (`PushNotificationService`) |
| Segments | Prédicats TypeScript paramétrés, testés |
| Consentement | Soft opt-in, `marketingEmail` défaut `true`, désinscription globale |
| Listmonk | Non retenu pour le flux principal |

## Consentement (4 surfaces)

1. **Inscription** — mention légale étendue (emails + désinscription), pas de case à cocher.
2. **Réglages** — interrupteur « Emails One More » dans `NotificationSettingsCard`.
3. **Email marketing** — `footerLinks` (Se désinscrire / Gérer mes préférences) + en-têtes RFC 8058 (lot 3).
4. **Page publique** — `GET` / `POST /u/:token` servie par l’API (HTML sans JS).

Filtre envoi marketing : `marketingEmail` + absence dans `email_suppressions`. Transactionnel : pas de filtre marketing.

## Module `api/src/outbound/`

- `consent/` — suppressions, token, page unsubscribe
- `templates/` — rendu strict depuis `message_templates`
- `providers/` — SES
- `feedback/` — webhook SNS
- `segments/` — registre de prédicats
- `dispatch/` — send unitaire + dispatch batch + worker

## Endpoints

| Méthode | Route | Auth |
|---|---|---|
| POST | `/internal/outbound/send` | `X-Outbound-Api-Key` |
| POST | `/internal/outbound/dispatch` | idem |
| GET | `/internal/outbound/dispatch/:id` | idem |
| GET | `/internal/outbound/catalog` | idem (segments + templates en base) |
| POST | `/webhooks/ses` | Signature SNS AWS |
| GET/POST | `/u/:token` | Public |

## Tables

- `message_templates`, `outbound_messages`, `outbound_dispatches` (audit batch)
- `email_suppressions`
- Colonnes : `users.unsubscribeToken`, `notification_preferences.marketingEmail`

## Lots de livraison

1. Consentement + désinscription  
2. Templates + send unitaire  
3. SES + feedback OpenPanel + worker  
4. Segments + dispatch + migration crons marketing  

## Doc opérationnelle n8n

[`docs/outbound-n8n-reference.md`](../../outbound-n8n-reference.md) — exemples JSON, segments, templates seed, consentement.

[`docs/outbound-ses-setup.md`](../../outbound-ses-setup.md) — console AWS, secrets, Configuration Set, SNS, OpenPanel.

## Références code existant

- Layout email : `api/src/emails/transactional-layout.ts`
- OpenPanel : `api/src/analytics/analytics.service.ts`
- Push : `api/src/notifications/push-notification.service.ts`
- Garde admin (à ne pas réutiliser) : `api/src/rewards/guards/admin-api-key.guard.ts`
