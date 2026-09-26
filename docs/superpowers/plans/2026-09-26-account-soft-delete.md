# Account Soft Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Soft-delete immédiat du compte via Settings (motif + commentaire), email brandé de confirmation, event OpenPanel client `account_deletion_requested`.

**Architecture:** Endpoint unique `DELETE /auth/account` : set `users.deletedAt`, revoke sessions + device tokens, persist feedback, send email best-effort. Client dialog remplace le mailto. Tracking OpenPanel côté client uniquement.

**Tech Stack:** NestJS + TypeORM + nodemailer (SMTP existant), React client, OpenPanel web SDK.

## Global Constraints

- Soft delete user only (`deletedAt`) — no cascade perfs/social, no anonymization, no hard delete.
- Feedback: in-app reason + optional comment **and** reply CTA in email.
- OpenPanel: client only, no PII in event props.
- Email style aligned with `event-thankyou-template.ts` (dark, lime accent, One More font).
- No commit unless user asks.

---

### Task 1: Schema — `deletedAt` + feedback table

**Files:**
- Create: `api/src/database/migrations/2000000000000-user-account-soft-delete.ts`
- Modify: `api/src/auth/entities/user.entity.ts`
- Create: `api/src/auth/entities/account-deletion-feedback.entity.ts`
- Modify: `api/src/database/typeorm.module.ts` (register entity)
- Modify: `api/src/database/data-source.ts` (register entity)

- [ ] Add `deletedAt` column + entity field
- [ ] Add `account_deletion_feedback` entity + migration
- [ ] Register in TypeORM entities lists

### Task 2: Backend deleteAccount + auth guards

**Files:**
- Modify: `api/src/auth/auth.service.ts`
- Modify: `api/src/auth/auth.controller.ts`
- Modify: `api/src/auth/auth.dto.ts`
- Modify: `api/src/auth/auth.module.ts`
- Modify: `api/src/auth/oauth.service.ts` (refuse soft-deleted)
- Modify: `api/src/notifications/device-tokens.service.ts` (`removeAllForUser`)
- Modify: `api/src/notifications/notifications.module.ts` (export DeviceTokensService)
- Create: `api/src/auth/tests/auth-delete-account.service.spec.ts`

- [ ] DTO `DeleteAccountDto` with reason enum + comment
- [ ] `deleteAccount` implementation
- [ ] Filter `deletedAt IS NULL` on login / refresh / me / identify / oauth
- [ ] Unit tests

### Task 3: Branded deletion email

**Files:**
- Create: `api/src/auth/emails/account-deletion-template.ts`
- Create: `api/src/auth/account-deletion-mail.service.ts`
- Wire into `AuthService.deleteAccount` + `AuthModule`

- [ ] Template HTML brandé
- [ ] Mail service SMTP (same env as event thankyou)
- [ ] Best-effort send from deleteAccount

### Task 4: Client Settings dialog + API + OpenPanel

**Files:**
- Create: `client/src/lib/account-api.ts`
- Modify: `client/src/pages/SettingsPage.tsx`
- Modify: `client/src/lib/translations.ts`
- Modify: `client/src/lib/analytics/events.ts`
- Modify: `app/.cursor/rules/openpanel-tracking.mdc`

- [ ] API helper `deleteAccount`
- [ ] Dialog motif + commentaire
- [ ] Track then delete then logout
- [ ] Taxonomy + docs

---

**Execution:** inline (user asked « implemente »).
