# Referral Reward → 1 mois PRO Implementation Plan

> Execute inline. **Do not commit unless user asks.**

**Goal:** 5 filleuls → 1 mois PRO (grant RC), legacy t-shirt conservé si claim `referral_limited` existe.

See design: `docs/superpowers/specs/2026-10-01-referral-reward-pro-month-design.md`

## Tasks

1. Migration + entity `referral_pro_grants`
2. `BillingService.grantPromotionalPremium`
3. Stop new referral t-shirt claims + `ensureReferralProGrant` (Social)
4. Access `referralRewardKind`
5. ReferralService unlock + notifs
6. Client UI duale
7. Analytics + tests
