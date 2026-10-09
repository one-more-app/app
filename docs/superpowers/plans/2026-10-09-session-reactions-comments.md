# Session Reactions + Comments Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Déplacer les réactions au niveau séance dans la carte Commentaires (maquette `24`) et aligner le style des messages, sans toucher à l’API `targetType: "exercise"`.

**Architecture:** Étendre `SessionCommentsThread` (carte + `ReactionBubbles` sur `session.reactions`). Retirer le câblage réactions des listes d’exercices. Accueil : bloc si `commentCount > 0`. `SessionPage` : thread toujours monté.

**Tech Stack:** React, Tailwind, SWR (`session-api`), Playwright smoke, `UI` translations.

## Global Constraints

- Spec : `docs/superpowers/specs/2026-10-09-session-reactions-comments-design.md`
- Référence visuelle : `docs/redesign-accueil/screens/24-ma-seance-en-cours.png` + `prototype-source.html` (`seanceBody`)
- Aucun `--` ni `—` dans le copy (`.cursor/rules/copywriting-french.mdc`)
- Réutiliser `ReactionBubbles`, `Card`, `SessionCommentItem`, `SessionCommentComposer`
- Pas de dépréciation API / migration
- Ne pas committer sauf demande explicite de l’utilisateur

## File Structure

| File | Responsibility |
|---|---|
| `client/src/components/session/SessionCommentsThread.tsx` | Titre + carte : réactions séance → messages → composeur |
| `client/src/lib/session-comment-time.ts` | Format temps relatif commentaire |
| `client/src/lib/session-comment-time.test.ts` | Tests du formatage |
| `client/src/components/session/SessionCommentItem.tsx` | Style maquette + temps relatif |
| `client/src/components/session/SessionCommentComposer.tsx` | Input + bouton sombre dans la carte |
| `client/src/components/home/HomeExerciseList.tsx` | Retirer props / UI réactions |
| `client/src/components/home/HomeLiveSession.tsx` | Toggle réaction séance → thread |
| `client/src/components/home/HomePastSession.tsx` | Idem |
| `client/src/pages/SessionPage.tsx` | Idem + retirer réactions exo |
| `client/src/components/history/HistoryDaySection.tsx` | Retirer props réactions |
| `client/src/components/history/HistoryExerciseCollapsible.tsx` | Retirer UI réactions |
| `client/e2e/smoke/session/session-view.spec.ts` | Mock / assert réactions séance |

---

### Task 1: Carte Commentaires + réactions séance

**Files:**
- Modify: `client/src/components/session/SessionCommentsThread.tsx`
- Modify: `client/src/components/home/HomeLiveSession.tsx` (branchement partiel OK en Task 3 ; ici seulement le composant thread)
- Test: typecheck / rendu manuel

**Interfaces:**
- Produces:
```ts
import type { ReactionBubble } from "@/lib/session-api";

type SessionCommentsThreadProps = {
  ownerUserId: string;
  date: string;
  currentUserId: string | null;
  reactions?: ReactionBubble[];
  onToggleReaction?: (emoji: string) => void;
  reactionsDisabled?: boolean;
};
```
- Consumes: `ReactionBubbles`, `Card`, SWR comments existant

- [ ] **Step 1: Étendre les props de `SessionCommentsThread`**

Remplacer le rendu actuel par :

```tsx
import { ReactionBubbles } from "@/components/session/ReactionBubbles";
import { Card } from "@/components/ui/card";
import type { ReactionBubble } from "@/lib/session-api";

type SessionCommentsThreadProps = {
  ownerUserId: string;
  date: string;
  currentUserId: string | null;
  reactions?: ReactionBubble[];
  onToggleReaction?: (emoji: string) => void;
  reactionsDisabled?: boolean;
};

export function SessionCommentsThread({
  ownerUserId,
  date,
  currentUserId,
  reactions = [],
  onToggleReaction,
  reactionsDisabled = false,
}: SessionCommentsThreadProps) {
  // ... handlers create/edit inchangés ...

  return (
    <section className="space-y-2">
      <h2 className="font-one-more text-sm font-semibold uppercase italic tracking-tight">
        {UI.sessionCommentsTitle}
      </h2>

      <Card className="gap-0 space-y-3.5 p-4">
        {onToggleReaction ? (
          <ReactionBubbles
            reactions={reactions}
            currentUserId={currentUserId}
            disabled={reactionsDisabled}
            onToggle={onToggleReaction}
          />
        ) : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{UI.loading}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {UI.sessionCommentsEmptyHint}
          </p>
        ) : (
          <ul className="space-y-3.5">
            {items.map((comment) => (
              <li key={comment.id}>
                <SessionCommentItem
                  comment={comment}
                  currentUserId={currentUserId}
                  sessionOwnerUserId={ownerUserId}
                  onReply={(parentId, body) => handleCreate(body, parentId)}
                  onEdit={handleEdit}
                />
              </li>
            ))}
          </ul>
        )}

        <SessionCommentComposer onSubmit={(body) => handleCreate(body)} />
      </Card>
    </section>
  );
}
```

Retirer le wrapper `sticky-bottom-safe -mx-4 border-t …` autour du composeur.

- [ ] **Step 2: Vérifier le typage**

Run: `npx tsc --noEmit -p client` (ou la commande typecheck du repo si différente)  
Expected: erreurs éventuelles aux call-sites (props encore incomplètes) OK jusqu’à Task 3–4 ; pas d’erreur **dans** `SessionCommentsThread.tsx`.

---

### Task 2: Style messages + temps relatif + composeur

**Files:**
- Create: `client/src/lib/session-comment-time.ts`
- Create: `client/src/lib/session-comment-time.test.ts`
- Modify: `client/src/components/session/SessionCommentItem.tsx`
- Modify: `client/src/components/session/SessionCommentComposer.tsx`

**Interfaces:**
- Produces:
```ts
/** @param nowMs injecté pour les tests */
export function formatSessionCommentTime(
  createdAt: string,
  nowMs?: number,
): string;
```
- Consumes: `UI` si besoin de templates ; sinon chaînes FR locales sans tiret cadratin

- [ ] **Step 1: Écrire le test du formatage**

```ts
// client/src/lib/session-comment-time.test.ts
import { describe, expect, it } from "vitest";
import { formatSessionCommentTime } from "./session-comment-time";

describe("formatSessionCommentTime", () => {
  const now = Date.parse("2026-10-08T12:00:00.000Z");

  it("affiche les minutes récentes", () => {
    expect(
      formatSessionCommentTime("2026-10-08T11:48:00.000Z", now),
    ).toBe("il y a 12 min");
  });

  it("affiche les heures sous 24 h", () => {
    expect(
      formatSessionCommentTime("2026-10-08T09:00:00.000Z", now),
    ).toBe("il y a 3 h");
  });

  it("affiche le jour de la semaine au-delà", () => {
    const label = formatSessionCommentTime("2026-10-06T10:00:00.000Z", now);
    expect(label.length).toBeGreaterThan(0);
    expect(label.includes("--")).toBe(false);
    expect(label.includes("—")).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer le test (doit échouer)**

Run: `npm test --prefix client -- src/lib/session-comment-time.test.ts`  
Expected: FAIL (module absent)

- [ ] **Step 3: Implémenter `formatSessionCommentTime`**

```ts
// client/src/lib/session-comment-time.ts
export function formatSessionCommentTime(
  createdAt: string,
  nowMs: number = Date.now(),
): string {
  const created = Date.parse(createdAt);
  if (Number.isNaN(created)) return "";
  const diffMs = Math.max(0, nowMs - created);
  const min = Math.floor(diffMs / 60_000);
  if (min < 60) {
    const n = Math.max(1, min);
    return `il y a ${n} min`;
  }
  const hours = Math.floor(min / 60);
  if (hours < 24) {
    return `il y a ${hours} h`;
  }
  return new Date(created).toLocaleDateString("fr-FR", { weekday: "long" });
}
```

- [ ] **Step 4: Relancer le test**

Run: `npm test --prefix client -- src/lib/session-comment-time.test.ts`  
Expected: PASS

- [ ] **Step 5: Aligner `SessionCommentItem`**

- Avatar `sizeClassName="size-8"` → `"size-8"` OK (32px) ; gap parent `gap-2.5` (≈10px).
- Remplacer `formatCommentTime` local par `formatSessionCommentTime`.
- Corps : `mt-0.5 text-sm` (pas `mt-1` obligatoire).
- Garder Répondre / Modifier / replies.

Exemple méta :

```tsx
<p className="text-[13px] leading-snug">
  <span className="font-semibold">{name}</span>
  <time
    dateTime={comment.createdAt}
    className="text-[11px] text-muted-foreground"
  >
    {" · "}
    {formatSessionCommentTime(comment.createdAt)}
  </time>
</p>
<p className="mt-0.5 whitespace-pre-wrap text-sm">{comment.body}</p>
```

- [ ] **Step 6: Aligner `SessionCommentComposer`**

```tsx
return (
  <div className="space-y-2">
    <div className="flex gap-2">
      <Input
        value={draft}
        className="h-9 border-border bg-background"
        /* ...handlers inchangés... */
      />
      <Button
        type="button"
        variant="default"
        className="h-9 shrink-0 bg-black px-3.5 text-white hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/85"
        onClick={handleSubmit}
        disabled={sending || !draft.trim()}
      >
        {submitLabel}
      </Button>
    </div>
    {/* onCancel inchangé */}
  </div>
);
```

---

### Task 3: Retirer réactions exo (home) + brancher séance

**Files:**
- Modify: `client/src/components/home/HomeExerciseList.tsx`
- Modify: `client/src/components/home/HomeLiveSession.tsx`
- Modify: `client/src/components/home/HomePastSession.tsx`

**Interfaces:**
- Consumes: `SessionCommentsThread` props Task 1 ; `toggleSessionReaction` / `applySessionReactionTarget` / `sessionSwrKey`
- Produces: listes d’exos **sans** `reactions` / `onToggleReaction`

- [ ] **Step 1: Nettoyer `HomeExerciseList`**

Retirer de `HomeExerciseListGroup` / `HomeExerciseListProps` : `reactions`, `currentUserId`, `onToggleReaction`.  
Retirer import + rendu `ReactionBubbles`.  
Ne plus destructurer `reactions` dans le `map`.

- [ ] **Step 2: `HomeLiveSession` — toggle séance**

Remplacer `handleToggleReaction` :

```ts
const handleToggleReaction = useCallback(
  async (emoji: string) => {
    try {
      const { target } = await toggleSessionReaction(ownerUserId, dayKey, {
        emoji,
        targetType: "session",
      });
      void mutate(
        sessionSwrKey(ownerUserId, dayKey),
        (current) =>
          current ? applySessionReactionTarget(current, target) : current,
        { revalidate: false },
      );
    } catch {
      toast.error(UI.sessionReactionError);
    }
  },
  [ownerUserId, dayKey, mutate],
);
```

Dans `groups.map` : retirer `reactions: session?.reactionsByExerciseId?.[…]`.  
Sur `HomeExerciseList` : retirer `currentUserId` / `onToggleReaction`.

Brancher le thread :

```tsx
{hasComments ? (
  <SessionCommentsThread
    ownerUserId={ownerUserId}
    date={dayKey}
    currentUserId={currentUserId}
    reactions={session?.reactions ?? []}
    onToggleReaction={(emoji) => {
      void hapticImpact();
      void handleToggleReaction(emoji);
    }}
  />
) : null}
```

- [ ] **Step 3: `HomePastSession` — même branchement**

- Retirer `reactions` du `pastGroups`.
- Passer `reactions={session?.reactions ?? []}` + `onToggleReaction` séance au `SessionCommentsThread` (déjà gate `commentCount > 0`).
- Ajouter `handleToggleReaction` séance (copie du live) + imports `toggleSessionReaction` / `applySessionReactionTarget` / `toast` / `hapticImpact` si absents.

---

### Task 4: `SessionPage` + historique collapsible

**Files:**
- Modify: `client/src/pages/SessionPage.tsx`
- Modify: `client/src/components/history/HistoryDaySection.tsx`
- Modify: `client/src/components/history/HistoryExerciseCollapsible.tsx`

**Interfaces:**
- Consumes: mêmes helpers réaction séance
- Produces: historique sans UI réaction exo

- [ ] **Step 1: Nettoyer `HistoryExerciseCollapsible`**

Retirer props `reactions`, `onToggleReaction`, `reactionsEnabled`, `currentUserId` (si utilisés seulement pour réagir).  
Retirer import / bloc `ReactionBubbles` en bas de l’item.  
Retirer `canReact`.

- [ ] **Step 2: Nettoyer `HistoryDaySection`**

Retirer props `reactionsByExerciseId`, `onToggleExerciseReaction`, `reactionsEnabled`, `currentUserId` et leur passage aux collapsibles.  
Retirer import `ReactionBubble` si inutilisé.

- [ ] **Step 3: `SessionPage`**

Simplifier `handleToggleReaction` :

```ts
const handleToggleReaction = useCallback(
  async (emoji: string) => {
    if (!ownerUserId || !date) return;
    try {
      const { target } = await toggleSessionReaction(ownerUserId, date, {
        emoji,
        targetType: "session",
      });
      void mutate(
        sessionSwrKey(ownerUserId, date),
        (current) =>
          current ? applySessionReactionTarget(current, target) : current,
        { revalidate: false },
      );
    } catch {
      toast.error(UI.sessionReactionError);
    }
  },
  [ownerUserId, date, mutate],
);
```

Sur `HistoryDaySection` : retirer `reactionsEnabled`, `currentUserId`, `reactionsByExerciseId`, `onToggleExerciseReaction`.  
Retirer import `SessionReactionTargetType` si plus utilisé.

Thread **toujours** monté :

```tsx
<SessionCommentsThread
  ownerUserId={ownerUserId}
  date={date}
  currentUserId={currentUserId}
  reactions={session?.reactions ?? []}
  onToggleReaction={(emoji) => {
    void handleToggleReaction(emoji);
  }}
/>
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p client`  
Expected: PASS (plus de props orphelines)

---

### Task 5: Smoke e2e + vérif

**Files:**
- Modify: `client/e2e/smoke/session/session-view.spec.ts`

**Interfaces:**
- Consumes: UI `sessionReactionToggleAdd`, `sessionCommentsTitle`

- [ ] **Step 1: Adapter le mock GET session**

Mettre les réactions au niveau séance (plus dans `reactionsByExerciseId`) :

```ts
commentCount: 0, // SessionPage montre quand même le thread
reactions: [
  {
    emoji: "💪",
    count: 1,
    reactedByMe: false,
    users: [
      {
        userId: "friend-1",
        firstName: "Alex",
        lastName: null,
        username: "alex",
        avatarUrl: null,
      },
    ],
  },
],
reactionsByExerciseId: {},
```

POST `/reactions` → `targetType: "session"`, `trackedExerciseId: null` :

```ts
target: {
  targetType: "session",
  trackedExerciseId: null,
  reactions: [
    {
      emoji: "💪",
      count: 2,
      reactedByMe: true,
      users: [/* friend-1 + mockSession.user */],
    },
  ],
},
```

Garder l’assert bouton :

```ts
await expect(
  page.getByRole("button", {
    name: UI.sessionReactionToggleAdd.replace("{emoji}", "💪"),
  }),
).toBeVisible();
```

- [ ] **Step 2: Lancer le smoke session**

Run: `npx playwright test e2e/smoke/session/session-view.spec.ts --prefix client`  
(ou `npm run test:smoke --prefix client -- e2e/smoke/session/session-view.spec.ts`)  
Expected: PASS ; `pageErrors` vide

- [ ] **Step 3: Checklist manuelle courte**

1. Accueil live / passé sans commentaires → pas de bloc Commentaires.
2. Avec commentaires → carte + pills séance, pas de pills sous les exos.
3. `SessionPage` sans commentaires → carte + composeur + pills (counts 0 OK).
4. Toggle 🔥 : compteur + `reactedByMe` ; long-press drawer personnes.
5. Aucun `--` / `—` dans les timestamps affichés.

- [ ] **Step 4: Commit seulement si l’utilisateur le demande**

Ne pas `git commit` automatiquement.

---

## Spec coverage (self-review)

| Exigence spec | Task |
|---|---|
| Réactions séance dans carte Commentaires | 1, 3, 4 |
| Plus de réactions sous exercice | 3, 4 |
| Accueil gate `commentCount > 0` | 3 (déjà + wire) |
| `SessionPage` toujours monté | 4 |
| Style messages / composeur | 2 |
| Threading / reply / edit conservés | 2 (pas de retrait) |
| API exercise non dépréciée | aucune task API |
| Smoke adapté | 5 |

## Placeholder / consistency check

- Signatures `SessionCommentsThread` / `formatSessionCommentTime` / `handleToggleReaction(emoji)` alignées Tasks 1→5.
- Pas de TBD.
- Emojis = `SESSION_REACTION_EMOJIS` existants.
