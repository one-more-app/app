# Monthly XP Ranking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une page `/ranking` avec classements mensuels Potes et Salle, score = somme des XP du mois.

**Architecture:** Agrégation SQL sur `xp_events` pour une liste d’userIds (amis accepted ou membres salle opt-in). Nouveau module Nest `ranking`, flag `rankingOptIn` sur `user_gyms`, page client dédiée + entrées Amis / réglages salle. Pas de nouveau moteur de points.

**Tech Stack:** NestJS + TypeORM + Jest (API), React Router + SWR + Vitest (client), Postgres.

## Global Constraints

- Spec : `docs/superpowers/specs/2026-10-01-monthly-xp-ranking-design.md`
- Score = `SUM(xp_events.amount)` pour `activityDate` dans le mois `YYYY-MM` (toutes sources)
- Égalités : `MAX(earnedAt)` desc, puis `userId` asc
- Salle : opt-in défaut `false`, profil minimal (pas de détail de perfs)
- Route canonique client : `/ranking`
- Hors scope : bottom nav, mondial, push « dépassé », retune XP, exclusion sources, Redis
- Ne pas committer sauf demande explicite de l’utilisateur (ignorer les steps Commit tant que non demandé)
- Réponses et UI en français (clés `UI.*` dans `translations.ts`)

## File Structure

| File | Responsibility |
|---|---|
| `api/src/database/migrations/2050000000000-user-gym-ranking-opt-in.ts` | Colonne `rankingOptIn` |
| `api/src/gyms/entities/user-gym.entity.ts` | Champ entity + défaut false |
| `api/src/gyms/gyms.service.ts` / `gyms.controller.ts` | Exposer + PATCH opt-in |
| `api/src/ranking/lib/month-bounds.ts` | Parse `YYYY-MM` → start/end dates |
| `api/src/ranking/lib/rank-entries.ts` | Tri / rangs purs (testables) |
| `api/src/ranking/ranking.service.ts` | Agrégats friends / gym / recap |
| `api/src/ranking/ranking.controller.ts` | Routes HTTP |
| `api/src/ranking/ranking.module.ts` | Module Nest |
| `api/src/app.module.ts` | Import RankingModule |
| `client/src/lib/ranking-api.ts` | Fetch client |
| `client/src/lib/ranking-recap-seen.ts` | Flag localStorage récap |
| `client/src/pages/RankingPage.tsx` | Page Potes \| Salle |
| `client/src/components/ranking/*` | Liste, header me, CTA salle, sheet récap |
| `client/src/App.tsx` | Route `/ranking` |
| `client/src/pages/FriendsPage.tsx` | Bouton entrée classement |
| `client/src/components/settings/GymSettingsCard.tsx` | Toggle opt-in + lien |
| `client/src/lib/translations.ts` | Copy FR |
| `client/src/lib/gyms-api.ts` | Type `rankingOptIn` + patch |

---

### Task 1: Migration + opt-in salle

**Files:**
- Create: `api/src/database/migrations/2050000000000-user-gym-ranking-opt-in.ts`
- Modify: `api/src/gyms/entities/user-gym.entity.ts`
- Modify: `api/src/gyms/gyms.service.ts` (`UserGymResponse`, `toResponse`, `setRankingOptIn`)
- Modify: `api/src/gyms/gyms.controller.ts` (PATCH)
- Modify: `api/src/gyms/dto/` — créer `set-ranking-opt-in.dto.ts`
- Modify: `client/src/lib/gyms-api.ts`
- Test: `api/src/gyms/tests/gyms-ranking-opt-in.spec.ts` (si pattern service unitaire existant ; sinon test service via mock repo)

**Interfaces:**
- Produces:
  - `UserGymResponse.rankingOptIn: boolean`
  - `GymsService.setRankingOptIn(userId: string, enabled: boolean): Promise<UserGymResponse>`
  - `PATCH /gyms/me/ranking-opt-in` body `{ enabled: boolean }` → `{ gym: UserGymResponse }`

- [ ] **Step 1: Write migration**

```ts
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UserGymRankingOptIn2050000000000 implements MigrationInterface {
  name = 'UserGymRankingOptIn2050000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_gyms"
      ADD COLUMN "rankingOptIn" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_gyms" DROP COLUMN "rankingOptIn"
    `);
  }
}
```

- [ ] **Step 2: Entity + DTO + service + controller**

Sur `UserGymEntity` :

```ts
@Column({ type: 'boolean', default: false })
rankingOptIn!: boolean;
```

DTO :

```ts
import { IsBoolean } from 'class-validator';

export class SetRankingOptInDto {
  @IsBoolean()
  enabled!: boolean;
}
```

`toResponse` / `UserGymResponse` : ajouter `rankingOptIn: entity.rankingOptIn`.

`setRankingOptIn` : load gym, si absent → `NotFoundException('Aucune salle enregistrée.')`, sinon set + save + `toResponse`.

Controller :

```ts
@UseGuards(JwtAuthGuard)
@Patch('/me/ranking-opt-in')
async setRankingOptIn(
  @Req() req: { user: { sub: string } },
  @Body() body: SetRankingOptInDto,
) {
  const gym = await this.gymsService.setRankingOptIn(req.user.sub, body.enabled);
  return { gym };
}
```

Importer `Patch` depuis `@nestjs/common`.

- [ ] **Step 3: Client type + API**

Étendre `UserGym` avec `rankingOptIn: boolean`.

```ts
export async function setGymRankingOptIn(enabled: boolean): Promise<UserGym> {
  const data = await apiFetch<{ gym: UserGym }>("/gyms/me/ranking-opt-in", {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });
  return data.gym;
}
```

- [ ] **Step 4: Commit** (seulement si l’utilisateur le demande)

```bash
git add api/src/database/migrations/2050000000000-user-gym-ranking-opt-in.ts \
  api/src/gyms client/src/lib/gyms-api.ts
git commit -m "feat(gyms): add ranking opt-in flag"
```

---

### Task 2: Helpers purs mois + classement

**Files:**
- Create: `api/src/ranking/lib/month-bounds.ts`
- Create: `api/src/ranking/lib/rank-entries.ts`
- Create: `api/src/ranking/tests/month-bounds.spec.ts`
- Create: `api/src/ranking/tests/rank-entries.spec.ts`

**Interfaces:**
- Produces:
  - `parseYearMonth(month: string): { year: number; monthIndex: number }` — throw si invalide
  - `monthActivityDateBounds(month: string): { start: string; end: string }` — `YYYY-MM-DD` inclusifs
  - `type XpAggRow = { userId: string; xp: number; lastEarnedAt: Date | null }`
  - `sortXpAggRows(rows: XpAggRow[]): XpAggRow[]`
  - `withRanks<T extends { xp: number; lastEarnedAt: Date | null; userId: string }>(rows: T[]): (T & { rank: number })[]`

- [ ] **Step 1: Write failing tests**

`month-bounds.spec.ts` :

```ts
import { monthActivityDateBounds, parseYearMonth } from '../lib/month-bounds.js';

describe('monthActivityDateBounds', () => {
  it('returns inclusive calendar bounds', () => {
    expect(monthActivityDateBounds('2026-02')).toEqual({
      start: '2026-02-01',
      end: '2026-02-28',
    });
    expect(monthActivityDateBounds('2026-10')).toEqual({
      start: '2026-10-01',
      end: '2026-10-31',
    });
  });

  it('rejects invalid month', () => {
    expect(() => parseYearMonth('2026-13')).toThrow();
    expect(() => parseYearMonth('26-10')).toThrow();
  });
});
```

`rank-entries.spec.ts` :

```ts
import { sortXpAggRows, withRanks } from '../lib/rank-entries.js';

describe('sortXpAggRows', () => {
  it('orders by xp desc, then lastEarnedAt desc, then userId asc', () => {
    const a = {
      userId: 'a',
      xp: 100,
      lastEarnedAt: new Date('2026-10-01T10:00:00Z'),
    };
    const b = {
      userId: 'b',
      xp: 100,
      lastEarnedAt: new Date('2026-10-02T10:00:00Z'),
    };
    const c = { userId: 'c', xp: 50, lastEarnedAt: null };
    expect(sortXpAggRows([a, c, b]).map((r) => r.userId)).toEqual([
      'b',
      'a',
      'c',
    ]);
  });
});

describe('withRanks', () => {
  it('assigns dense ranks 1..n after sort', () => {
    const ranked = withRanks([
      { userId: 'x', xp: 10, lastEarnedAt: null },
      { userId: 'y', xp: 20, lastEarnedAt: null },
    ]);
    expect(ranked.map((r) => [r.userId, r.rank])).toEqual([
      ['y', 1],
      ['x', 2],
    ]);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd api && npm test -- ranking/tests/month-bounds.spec.ts ranking/tests/rank-entries.spec.ts
```

Expected: FAIL (modules missing)

- [ ] **Step 3: Implement helpers**

`month-bounds.ts` : regex `^(\d{4})-(\d{2})$`, month 1–12, `end` = dernier jour via `new Date(Date.UTC(year, monthIndex, 0))` formaté `YYYY-MM-DD`.

`rank-entries.ts` :

```ts
export function sortXpAggRows(rows: XpAggRow[]): XpAggRow[] {
  return [...rows].sort((a, b) => {
    if (b.xp !== a.xp) return b.xp - a.xp;
    const at = a.lastEarnedAt?.getTime() ?? 0;
    const bt = b.lastEarnedAt?.getTime() ?? 0;
    if (bt !== at) return bt - at;
    return a.userId.localeCompare(b.userId);
  });
}

export function withRanks<T extends XpAggRow>(rows: T[]): (T & { rank: number })[] {
  return sortXpAggRows(rows).map((row, i) => ({ ...row, rank: i + 1 }));
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd api && npm test -- ranking/tests/month-bounds.spec.ts ranking/tests/rank-entries.spec.ts
```

- [ ] **Step 5: Commit** (si demandé)

```bash
git add api/src/ranking/lib api/src/ranking/tests
git commit -m "feat(ranking): add month bounds and rank helpers"
```

---

### Task 3: RankingService — friends + gym + recap

**Files:**
- Create: `api/src/ranking/dto/ranking-response.dto.ts`
- Create: `api/src/ranking/ranking.service.ts`
- Create: `api/src/ranking/ranking.controller.ts`
- Create: `api/src/ranking/ranking.module.ts`
- Create: `api/src/ranking/tests/ranking.service.spec.ts`
- Modify: `api/src/app.module.ts`

**Interfaces:**
- Consumes: `getAcceptedFriendIds`, `XpEventEntity`, `UserGymEntity`, `UserProfileEntity`, `UserEntity`, `LeagueService.buildSummary`, `monthActivityDateBounds`, `withRanks`
- Produces DTOs :

```ts
export type RankingEntryDto = {
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  xp: number;
  rank: number;
  globalRank: string | null; // RankId or null
};

export type RankingListResponse = {
  month: string;
  entries: RankingEntryDto[];
  me: { userId: string; xp: number; rank: number; globalRank: string | null };
  meta?: { rankingOptIn?: boolean; hasGym?: boolean; placeName?: string | null };
};

export type RankingRecapResponse = {
  month: string;
  xp: number;
  activeDays: number;
  friends: { rank: number; total: number } | null;
  gym: { rank: number; total: number } | null;
};
```

- Endpoints :
  - `GET /ranking/friends?month=YYYY-MM`
  - `GET /ranking/gym?month=YYYY-MM`
  - `GET /ranking/me/recap?month=YYYY-MM`

- [ ] **Step 1: Write failing service tests (mocks)**

Couvrir au minimum :

1. Friends : n’inclut que les amis accepted + le viewer ; exclut `users.deletedAt != null`.
2. Agrégat XP : somme correcte sur bornes mois.
3. Gym : uniquement même `placeId` + `rankingOptIn` ; si viewer pas opt-in → `entries: []`, `meta.rankingOptIn: false`.
4. Recap : `activeDays` = count distinct `activityDate` avec XP > 0 dans le mois.

Structure mock typique (Jest) : repos `createQueryBuilder` / `find` spy ; assert appels et résultat.

- [ ] **Step 2: Run — expect FAIL**

```bash
cd api && npm test -- ranking/tests/ranking.service.spec.ts
```

- [ ] **Step 3: Implement RankingService**

Algorithme commun `buildForUserIds(viewerId, candidateIds, month)` :

1. `bounds = monthActivityDateBounds(month)`
2. Filtrer candidates : `users` où `deletedAt IS NULL` ; toujours inclure `viewerId` dans le set
3. Query :

```ts
await xpRepo
  .createQueryBuilder('e')
  .select('e.userId', 'userId')
  .addSelect('SUM(e.amount)', 'xp')
  .addSelect('MAX(e.earnedAt)', 'lastEarnedAt')
  .where('e.userId IN (:...ids)', { ids })
  .andWhere('e.activityDate >= :start', { start: bounds.start })
  .andWhere('e.activityDate <= :end', { end: bounds.end })
  .groupBy('e.userId')
  .getRawMany();
```

4. Users sans row → `xp: 0`, `lastEarnedAt: null`
5. `withRanks` → enrich profiles (`username`, `avatarUrl`)
6. `globalRank` : `leagueService.buildSummary(userId)` → `summary?.globalRank ?? null` (Promise.all ; OK pour N amis / salle plafonnée)
7. Cap salle : après tri, garder top **100** entries (le `me` doit rester cohérent même hors top : calculer rang avant slice ; si me hors top, toujours renseigner `me`, liste sans lui OK)

`listFriendsRanking(viewerId, month)` :
- ids = `[viewerId, ...await getAcceptedFriendIds(...)]`

`listGymRanking(viewerId, month)` :
- load viewer gym ; si null → `{ entries: [], me: {...xp...}, meta: { hasGym: false, rankingOptIn: false } }`
- si `!rankingOptIn` → même shape avec `hasGym: true`, `rankingOptIn: false`, entries vides (ne pas leak la liste)
- sinon ids = userIds de `user_gyms` où `placeId = viewer.placeId AND rankingOptIn = true`

`recap(viewerId, month)` :
- xp + activeDays via query distinct dates
- friends rank/total via listFriendsRanking
- gym rank/total seulement si opt-in, sinon `gym: null`

Controller : `JwtAuthGuard`, query `month` défaut = mois UTC courant formaté `YYYY-MM` (ou mois local serveur — documenter : **utiliser date UTC `YYYY-MM` du serveur** pour le défaut ; le client passera toujours le mois explicitement).

Module :

```ts
@Module({
  imports: [
    TypeOrmModule.forFeature([
      XpEventEntity,
      FriendshipEntity,
      UserGymEntity,
      UserProfileEntity,
      UserEntity,
    ]),
    LeagueModule,
  ],
  controllers: [RankingController],
  providers: [RankingService],
  exports: [RankingService],
})
export class RankingModule {}
```

Importer dans `AppModule`.

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd api && npm test -- ranking/tests/
```

- [ ] **Step 5: Commit** (si demandé)

```bash
git add api/src/ranking api/src/app.module.ts
git commit -m "feat(api): monthly XP ranking for friends and gym"
```

---

### Task 4: Client API + page Ranking

**Files:**
- Create: `client/src/lib/ranking-api.ts`
- Create: `client/src/lib/ranking-recap-seen.ts`
- Create: `client/src/lib/ranking-recap-seen.test.ts`
- Create: `client/src/pages/RankingPage.tsx`
- Create: `client/src/components/ranking/RankingList.tsx`
- Create: `client/src/components/ranking/RankingMeHeader.tsx`
- Create: `client/src/components/ranking/RankingGymGate.tsx`
- Create: `client/src/components/ranking/RankingMonthNav.tsx`
- Create: `client/src/components/ranking/RankingRecapSheet.tsx`
- Modify: `client/src/lib/translations.ts`
- Modify: `client/src/App.tsx`

**Interfaces:**
- Consumes: endpoints Task 3, `setGymRankingOptIn`
- Produces: page navigable `/ranking?tab=friends|gym&month=YYYY-MM`

- [ ] **Step 1: ranking-recap-seen tests + impl**

```ts
const key = (month: string) => `ranking-recap-seen:${month}`;

export function hasSeenRankingRecap(month: string): boolean {
  try {
    return localStorage.getItem(key(month)) === "1";
  } catch {
    return true; // fail closed: ne pas spammer
  }
}

export function markRankingRecapSeen(month: string): void {
  try {
    localStorage.setItem(key(month), "1");
  } catch {
    /* ignore */
  }
}
```

Vitest : mock `localStorage`.

- [ ] **Step 2: ranking-api.ts**

```ts
export async function fetchFriendsRanking(month: string) {
  return apiFetch<RankingListResponse>(
    `/ranking/friends?month=${encodeURIComponent(month)}`,
  );
}
// idem fetchGymRanking, fetchRankingRecap
```

- [ ] **Step 3: UI page**

- `BackHeader` titre `UI.rankingTitle`
- `RankingMonthNav` : mois courant label FR, prev (disabled si avant premier mois avec data optionnel — v1 : prev toujours, next disabled si mois >= courant)
- Tabs **Potes** | **Salle** (même pattern que `FriendsTabToggle` ou tabs simples)
- Sticky `RankingMeHeader` (rang + XP)
- `RankingList` : rows avatar / pseudo / XP / petit badge `globalRank` si présent (réutiliser composant rank existant si dispo, sinon texte)
- `RankingGymGate` : si `meta.hasGym === false` → CTA settings `#gym-settings` ; si `rankingOptIn === false` → bouton opt-in puis refresh SWR
- `RankingRecapSheet` : au mount, si jour >= 2 du mois (ou toujours si mois précédent existe) et `!hasSeenRankingRecap(prevMonth)`, fetch recap + open sheet ; on dismiss → `markRankingRecapSeen`

Ajouter route dans `App.tsx` près des routes friends :

```tsx
<Route path="/ranking" element={<RankingPage />} />
```

Copy minimale dans `translations.ts` : `rankingTitle`, `rankingTabFriends`, `rankingTabGym`, `rankingXpMonth`, `rankingRankLabel`, `rankingGymOptInCta`, `rankingGymNoGymCta`, `rankingEmptyFriends`, `rankingRecapTitle`, `rankingRecapBody`, etc.

- [ ] **Step 4: Smoke manuel**

```bash
# API up + client dev
# Ouvrir /ranking, vérifier potes ; opt-in salle ; changer de mois
```

- [ ] **Step 5: Commit** (si demandé)

```bash
git add client/src/lib/ranking-api.ts client/src/lib/ranking-recap-seen.ts \
  client/src/lib/ranking-recap-seen.test.ts client/src/pages/RankingPage.tsx \
  client/src/components/ranking client/src/App.tsx client/src/lib/translations.ts
git commit -m "feat(client): monthly XP ranking page"
```

---

### Task 5: Entrées Amis, réglages salle, rang sur profil ami

**Files:**
- Modify: `client/src/pages/FriendsPage.tsx`
- Modify: `client/src/components/settings/GymSettingsCard.tsx`
- Modify: `client/src/pages/FriendProfilePage.tsx` (ou composant highlights)
- Modify: `client/src/lib/translations.ts`
- Optional: étendre `GET` friend profile **ou** appeler `fetchFriendsRanking` côté profil pour dériver `#r / n` (éviter nouvel endpoint v1)

- [ ] **Step 1: FriendsPage CTA**

Sous le bouton « Ajouter des amis », bouton secondary `Link to="/ranking"` avec icône Trophy + `UI.rankingTitle`.

- [ ] **Step 2: GymSettingsCard**

Si `gym` :
- Switch / row « Participer au classement de la salle » lié à `gym.rankingOptIn` via `setGymRankingOptIn` + `mutateUserGym`
- Lien texte « Voir le classement » → `/ranking?tab=gym`

- [ ] **Step 3: Friend profile rank**

Sur `FriendProfilePage`, SWR `fetchFriendsRanking(currentMonth)` ; trouver l’entrée `userId === friendId` ; afficher `UI.rankingFriendRank` (`#{rank} / {total}`). Si loading/error : ne rien afficher.

- [ ] **Step 4: Commit** (si demandé)

```bash
git add client/src/pages/FriendsPage.tsx \
  client/src/components/settings/GymSettingsCard.tsx \
  client/src/pages/FriendProfilePage.tsx client/src/lib/translations.ts
git commit -m "feat(client): wire ranking entry points"
```

---

## Spec coverage checklist

| Spec item | Task |
|---|---|
| Score = XP mois toutes sources | 2–3 |
| Classement potes accepted | 3 |
| Classement salle opt-in + profil minimal | 1, 3, 4 |
| Page `/ranking` Potes \| Salle | 4 |
| Entrées Amis + réglages salle | 5 |
| Mois précédent consultable | 4 (`RankingMonthNav`) |
| Récap fin de mois client-only | 4 |
| Badge ligue résumé | 3 (`globalRank`) + 4 list |
| Rang sur profil ami | 5 |
| Soft-delete exclus | 3 |
| Changement salle / opt-out | 1, 3 (placeId actuel) |
| Hors scope respecté | Global Constraints |

## Self-review notes

- Pas de second moteur de score.
- Cap gym 100 documenté dans le service pour limiter coût `buildSummary`.
- Défaut `month` : client envoie toujours le mois ; serveur valide via `parseYearMonth`.
