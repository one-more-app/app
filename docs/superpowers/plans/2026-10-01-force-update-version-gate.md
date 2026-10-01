# Force Update Version Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bloquer les apps natives trop anciennes via `GET /health` + ConnectivityGate, avec écran plein écran et CTA store.

**Architecture:** L’API enrichit `/health` avec `minVersion.ios|android` depuis des env. Le probe connectivity compare la version marketing native (`App.getInfo().version`) et expose `update_required`. Le gate affiche `ForceUpdatePage` (hard block, pas de dismiss).

**Tech Stack:** NestJS (`ConfigService`), React + Capacitor (`@capacitor/app`, `@capacitor/browser`), Vitest (client), Jest (API).

## Global Constraints

- Hard only — pas de soft update / dismiss.
- Web jamais bloqué ; iOS/Android min versions séparées.
- Comparaison marketing semver (`major.minor.patch`) ; préfixe `v` autorisé.
- Fail-open : env absente, parse invalide, version client inconnue → pas de blocage.
- Priorité statuts : `offline` > `maintenance` > `update_required` > `ok`.
- Ne pas committer sauf demande explicite de l’utilisateur (ignorer les steps Commit tant que non demandé).
- Ne pas toucher aux fichiers referral WIP non liés.

## File Structure

| File | Responsibility |
|---|---|
| `api/src/app.service.ts` | Lire env min versions + assembler payload health |
| `api/src/app.controller.ts` | Exposer `getHealth()` enrichi |
| `api/src/app.controller.spec.ts` | Tests health + env |
| `api/.env.example` | Documenter `MIN_APP_VERSION_IOS` / `ANDROID` |
| `client/src/lib/app-version.ts` | Parse / compare semver + `isBelowMinVersion` |
| `client/src/lib/app-version.test.ts` | Tests unitaires semver |
| `client/src/lib/app-store.ts` | URL listing store + `openAppStoreForUpdate` |
| `client/src/hooks/use-connectivity.tsx` | Probe : statut `update_required` |
| `client/src/components/ConnectivityGate.tsx` | Branche `update_required` |
| `client/src/components/ConnectivityStatusLayout.tsx` | CTA primaire optionnel (store) |
| `client/src/pages/ForceUpdatePage.tsx` | Écran force update |
| `client/src/lib/translations.ts` | Copy FR titre / hint / CTA |

---

### Task 1: Utilitaire semver client

**Files:**
- Create: `client/src/lib/app-version.ts`
- Create: `client/src/lib/app-version.test.ts`

**Interfaces:**
- Produces:
  - `parseMarketingVersion(raw: string): [number, number, number] | null`
  - `isBelowMinVersion(current: string, min: string): boolean`
  - `normalizeVersionString(raw: string): string` (trim + strip leading `v`/`V`)

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { isBelowMinVersion, parseMarketingVersion } from "./app-version";

describe("parseMarketingVersion", () => {
  it("parse 1.2.3 et v1.2.3", () => {
    expect(parseMarketingVersion("1.2.3")).toEqual([1, 2, 3]);
    expect(parseMarketingVersion("v1.2.3")).toEqual([1, 2, 3]);
  });

  it("rejette invalide", () => {
    expect(parseMarketingVersion("")).toBeNull();
    expect(parseMarketingVersion("–")).toBeNull();
    expect(parseMarketingVersion("1.2")).toBeNull();
    expect(parseMarketingVersion("abc")).toBeNull();
  });
});

describe("isBelowMinVersion", () => {
  it("détecte outdated / égalité / plus récent", () => {
    expect(isBelowMinVersion("1.3.9", "1.4.0")).toBe(true);
    expect(isBelowMinVersion("1.4.0", "1.4.0")).toBe(false);
    expect(isBelowMinVersion("1.4.1", "1.4.0")).toBe(false);
    expect(isBelowMinVersion("v1.3.9", "1.4.0")).toBe(true);
  });

  it("fail-open si parse impossible", () => {
    expect(isBelowMinVersion("", "1.4.0")).toBe(false);
    expect(isBelowMinVersion("1.4.0", "")).toBe(false);
    expect(isBelowMinVersion("–", "1.4.0")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/lib/app-version.test.ts`  
Expected: FAIL (module not found)

- [ ] **Step 3: Write minimal implementation**

```ts
// client/src/lib/app-version.ts
export function normalizeVersionString(raw: string): string {
  return String(raw ?? "").trim().replace(/^[vV]/, "");
}

export function parseMarketingVersion(
  raw: string,
): [number, number, number] | null {
  const normalized = normalizeVersionString(raw);
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(normalized);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function isBelowMinVersion(current: string, min: string): boolean {
  const a = parseMarketingVersion(current);
  const b = parseMarketingVersion(min);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) {
    if (a[i] < b[i]) return true;
    if (a[i] > b[i]) return false;
  }
  return false;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run src/lib/app-version.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit** (skip unless user asked)

```bash
git add client/src/lib/app-version.ts client/src/lib/app-version.test.ts
git commit -m "feat(client): add marketing semver compare for force update"
```

---

### Task 2: API `/health` + minVersion env

**Files:**
- Modify: `api/src/app.service.ts`
- Modify: `api/src/app.controller.ts`
- Modify: `api/src/app.controller.spec.ts`
- Modify: `api/.env.example`

**Interfaces:**
- Consumes: `ConfigService` global (`MIN_APP_VERSION_IOS`, `MIN_APP_VERSION_ANDROID`)
- Produces: `getHealth(): { status: 'ok'; minVersion?: { ios?: string; android?: string } }`

- [ ] **Step 1: Write the failing tests**

Remplacer / étendre `api/src/app.controller.spec.ts` :

```ts
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

function makeConfig(values: Record<string, string | undefined>): ConfigService {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

describe('AppController', () => {
  describe('root', () => {
    it('should return "Hello World!"', () => {
      const appController = new AppController(
        new AppService(makeConfig({})),
      );
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return status ok without minVersion when env empty', () => {
      const appController = new AppController(
        new AppService(makeConfig({})),
      );
      expect(appController.getHealth()).toEqual({ status: 'ok' });
    });

    it('should include ios/android minVersion when set', () => {
      const appController = new AppController(
        new AppService(
          makeConfig({
            MIN_APP_VERSION_IOS: '1.4.0',
            MIN_APP_VERSION_ANDROID: '1.3.0',
          }),
        ),
      );
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        minVersion: { ios: '1.4.0', android: '1.3.0' },
      });
    });

    it('should omit blank platform entries', () => {
      const appController = new AppController(
        new AppService(
          makeConfig({
            MIN_APP_VERSION_IOS: '  ',
            MIN_APP_VERSION_ANDROID: '1.2.0',
          }),
        ),
      );
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        minVersion: { android: '1.2.0' },
      });
    });

    it('should ignore invalid semver env values', () => {
      const appController = new AppController(
        new AppService(
          makeConfig({
            MIN_APP_VERSION_IOS: 'latest',
            MIN_APP_VERSION_ANDROID: 'v1.4.0',
          }),
        ),
      );
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        minVersion: { android: '1.4.0' },
      });
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && npm test -- --testPathPatterns=app.controller.spec`  
Expected: FAIL (signature / shape)

- [ ] **Step 3: Implement AppService + controller**

```ts
// api/src/app.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type HealthMinVersion = {
  ios?: string;
  android?: string;
};

export type HealthResponse = {
  status: 'ok';
  minVersion?: HealthMinVersion;
};

function normalizeMinVersion(raw: string | undefined): string | undefined {
  const trimmed = (raw ?? '').trim().replace(/^[vV]/, '');
  if (!/^\d+\.\d+\.\d+$/.test(trimmed)) return undefined;
  return trimmed;
}

@Injectable()
export class AppService {
  constructor(private readonly config: ConfigService) {}

  getHello(): string {
    return 'Hello World!';
  }

  getHealth(): HealthResponse {
    const ios = normalizeMinVersion(
      this.config.get<string>('MIN_APP_VERSION_IOS'),
    );
    const android = normalizeMinVersion(
      this.config.get<string>('MIN_APP_VERSION_ANDROID'),
    );
    const minVersion: HealthMinVersion = {};
    if (ios) minVersion.ios = ios;
    if (android) minVersion.android = android;
    if (!minVersion.ios && !minVersion.android) {
      return { status: 'ok' };
    }
    return { status: 'ok', minVersion };
  }
}
```

```ts
// api/src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService, type HealthResponse } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): HealthResponse {
    return this.appService.getHealth();
  }
}
```

Ajouter dans `api/.env.example` (près des autres configs app) :

```bash
# Force update (versions marketing min pour apps natives). Vide = pas de blocage.
# MIN_APP_VERSION_IOS="1.4.0"
# MIN_APP_VERSION_ANDROID="1.4.0"
```

- [ ] **Step 4: Run tests**

Run: `cd api && npm test -- --testPathPatterns=app.controller.spec`  
Expected: PASS

- [ ] **Step 5: Commit** (skip unless user asked)

```bash
git add api/src/app.service.ts api/src/app.controller.ts api/src/app.controller.spec.ts api/.env.example
git commit -m "feat(api): expose minVersion on /health for force update"
```

---

### Task 3: Ouvrir la fiche store (update)

**Files:**
- Create: `client/src/lib/app-store.ts`

**Interfaces:**
- Produces:
  - `getAppStoreListingUrl(): string`
  - `openAppStoreForUpdate(): Promise<void>`
- Note: `openStoreListing` dans `app-review.ts` appelle la review native — **ne pas** le réutiliser pour le force update.

- [ ] **Step 1: Implement store listing helper**

```ts
// client/src/lib/app-store.ts
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

const ANDROID_PACKAGE = "com.one_more.app";

function getAppleAppId(): string | undefined {
  const id = import.meta.env.VITE_APPLE_APP_ID;
  return typeof id === "string" && id.trim() ? id.trim() : undefined;
}

/** Fiche store (sans write-review) pour forcer la mise à jour. */
export function getAppStoreListingUrl(): string {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") {
    const appId = getAppleAppId();
    if (appId) return `https://apps.apple.com/app/id${appId}`;
    return "https://apps.apple.com/app/id000000000";
  }
  if (platform === "android") {
    return `market://details?id=${ANDROID_PACKAGE}`;
  }
  return `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
}

export async function openAppStoreForUpdate(): Promise<void> {
  const url = getAppStoreListingUrl();
  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
      return;
    }
  } catch {
    // fallback below
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
```

- [ ] **Step 2: Typecheck smoke**

Run: `cd client && npx tsc -p tsconfig.gate.json --noEmit --pretty false`  
Expected: no errors related to `app-store.ts`

- [ ] **Step 3: Commit** (skip unless user asked)

```bash
git add client/src/lib/app-store.ts
git commit -m "feat(client): add store listing opener for force update"
```

---

### Task 4: Probe connectivity → `update_required`

**Files:**
- Modify: `client/src/hooks/use-connectivity.tsx`
- Create: `client/src/lib/force-update-from-health.ts`
- Create: `client/src/lib/force-update-from-health.test.ts`

**Interfaces:**
- Consumes: `isBelowMinVersion` (Task 1), `App.getInfo`, Capacitor platform
- Produces:
  - `ConnectivityStatus` inclut `"update_required"`
  - `shouldForceUpdateFromHealth(args): boolean`
  - Health body type avec `minVersion?: { ios?: string; android?: string }`

- [ ] **Step 1: Write pure helper + failing tests**

```ts
// client/src/lib/force-update-from-health.ts
import { isBelowMinVersion } from "@/lib/app-version";

export type HealthMinVersion = {
  ios?: string;
  android?: string;
};

export type HealthProbeBody = {
  status?: unknown;
  minVersion?: HealthMinVersion | null;
};

export function shouldForceUpdateFromHealth(input: {
  isNativePlatform: boolean;
  platform: string; // "ios" | "android" | ...
  currentVersion: string;
  body: HealthProbeBody | null;
}): boolean {
  if (!input.isNativePlatform) return false;
  const min =
    input.platform === "ios"
      ? input.body?.minVersion?.ios
      : input.platform === "android"
        ? input.body?.minVersion?.android
        : undefined;
  if (!min) return false;
  return isBelowMinVersion(input.currentVersion, min);
}
```

```ts
// client/src/lib/force-update-from-health.test.ts
import { describe, expect, it } from "vitest";
import { shouldForceUpdateFromHealth } from "./force-update-from-health";

describe("shouldForceUpdateFromHealth", () => {
  it("ignore web", () => {
    expect(
      shouldForceUpdateFromHealth({
        isNativePlatform: false,
        platform: "web",
        currentVersion: "1.0.0",
        body: { status: "ok", minVersion: { ios: "9.0.0" } },
      }),
    ).toBe(false);
  });

  it("bloque ios outdated", () => {
    expect(
      shouldForceUpdateFromHealth({
        isNativePlatform: true,
        platform: "ios",
        currentVersion: "1.3.9",
        body: { status: "ok", minVersion: { ios: "1.4.0", android: "9.0.0" } },
      }),
    ).toBe(true);
  });

  it("n'utilise pas la min de l'autre plateforme", () => {
    expect(
      shouldForceUpdateFromHealth({
        isNativePlatform: true,
        platform: "android",
        currentVersion: "1.0.0",
        body: { status: "ok", minVersion: { ios: "9.0.0" } },
      }),
    ).toBe(false);
  });

  it("fail-open sans minVersion", () => {
    expect(
      shouldForceUpdateFromHealth({
        isNativePlatform: true,
        platform: "ios",
        currentVersion: "1.0.0",
        body: { status: "ok" },
      }),
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `cd client && npx vitest run src/lib/force-update-from-health.test.ts`  
Expected: PASS

- [ ] **Step 3: Wire into `probeHealth` / connectivity**

Dans `use-connectivity.tsx` :

1. Étendre `ConnectivityStatus` et `ProbeResult` avec `"update_required"`.
2. Après un `/health` OK (JSON), si native :
   - `const info = await App.getInfo()` (try/catch → version `""`)
   - `shouldForceUpdateFromHealth({ isNativePlatform: Capacitor.isNativePlatform(), platform: Capacitor.getPlatform(), currentVersion: info.version ?? "", body })`
   - si true → return `"update_required"`
3. Inclure `update_required` dans l’interval de re-probe (comme offline/maintenance) :

```ts
if (status !== "maintenance" && status !== "offline" && status !== "update_required") return;
```

4. Ne pas écraser `update_required` dans `reportApiUnreachable` (même logique que maintenance : seulement `ok|checking` → offline).

Imports à ajouter :

```ts
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { shouldForceUpdateFromHealth } from "@/lib/force-update-from-health";
```

Dans `probeHealth`, parser le JSON même si content-type JSON (déjà le cas pour maintenance). Réutiliser le body pour minVersion :

```ts
let body: { status?: unknown; minVersion?: { ios?: string; android?: string } } | null = null;
if (contentType.includes("application/json")) {
  body = (await res.json().catch(() => null)) as typeof body;
  if (body && typeof body === "object" && body.status != null && body.status !== "ok") {
    return "maintenance";
  }
}
if (
  shouldForceUpdateFromHealth({
    isNativePlatform: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(),
    currentVersion: await readNativeMarketingVersion(),
    body,
  })
) {
  return "update_required";
}
return "ok";
```

Helper local dans le même fichier (ou inline) :

```ts
async function readNativeMarketingVersion(): Promise<string> {
  if (!Capacitor.isNativePlatform()) return "";
  try {
    const info = await App.getInfo();
    return String(info.version ?? "").trim();
  } catch {
    return "";
  }
}
```

- [ ] **Step 4: Typecheck**

Run: `cd client && npm run typecheck:gate`  
Expected: PASS

- [ ] **Step 5: Commit** (skip unless user asked)

```bash
git add client/src/lib/force-update-from-health.ts client/src/lib/force-update-from-health.test.ts client/src/hooks/use-connectivity.tsx
git commit -m "feat(client): detect force update from /health minVersion"
```

---

### Task 5: UI ForceUpdatePage + gate + i18n

**Files:**
- Modify: `client/src/components/ConnectivityStatusLayout.tsx`
- Modify: `client/src/components/ConnectivityGate.tsx`
- Create: `client/src/pages/ForceUpdatePage.tsx`
- Modify: `client/src/lib/translations.ts`

**Interfaces:**
- Consumes: `useConnectivity().status === "update_required"`, `openAppStoreForUpdate`, UI strings
- Produces: hard-block page with store CTA + retry

- [ ] **Step 1: Extend ConnectivityStatusLayout with optional primary CTA**

Ajouter props optionnelles :

```ts
type ConnectivityStatusLayoutProps = {
  icon: LucideIcon;
  title: string;
  hint: string;
  iconTone?: "muted" | "accent";
  primaryAction?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void | Promise<void>;
  };
};
```

Rendu : si `primaryAction`, bouton primaire **au-dessus** du bouton Réessayer (même `min-w-40`). Le retry reste inchangé.

- [ ] **Step 2: Add FR copy in `translations.ts`**

Près de `maintenanceHint` :

```ts
forceUpdateTitle: "Mise à jour requise",
forceUpdateHint: "Cette version n'est plus supportée. Mets à jour One More pour continuer.",
forceUpdateCta: "Mettre à jour",
```

- [ ] **Step 3: Create ForceUpdatePage**

```tsx
// client/src/pages/ForceUpdatePage.tsx
import { ConnectivityStatusLayout } from "@/components/ConnectivityStatusLayout";
import { openAppStoreForUpdate } from "@/lib/app-store";
import { UI } from "@/lib/translations";
import { Download } from "lucide-react";

export function ForceUpdatePage() {
  return (
    <ConnectivityStatusLayout
      icon={Download}
      title={UI.forceUpdateTitle}
      hint={UI.forceUpdateHint}
      iconTone="accent"
      primaryAction={{
        label: UI.forceUpdateCta,
        icon: Download,
        onClick: () => openAppStoreForUpdate(),
      }}
    />
  );
}
```

- [ ] **Step 4: Branch in ConnectivityGate**

Après `maintenance`, avant `children` :

```tsx
if (status === "update_required") {
  return <ForceUpdatePage />;
}
```

- [ ] **Step 5: Typecheck + unit tests**

Run:
```bash
cd client && npm run typecheck:gate
cd client && npx vitest run src/lib/app-version.test.ts src/lib/force-update-from-health.test.ts
cd api && npm test -- --testPathPatterns=app.controller.spec
```
Expected: all PASS

- [ ] **Step 6: Commit** (skip unless user asked)

```bash
git add client/src/components/ConnectivityStatusLayout.tsx client/src/components/ConnectivityGate.tsx client/src/pages/ForceUpdatePage.tsx client/src/lib/translations.ts
git commit -m "feat(client): force update gate UI and store CTA"
```

---

### Task 6: Vérification manuelle / smoke

**Files:** none (manual)

- [ ] **Step 1: API smoke**

Avec env :
```bash
MIN_APP_VERSION_IOS=9.0.0
MIN_APP_VERSION_ANDROID=9.0.0
```
`curl -s localhost:3000/health` → JSON avec `minVersion`.

Sans env → `{ "status": "ok" }` uniquement.

- [ ] **Step 2: Client web**

Ouvrir l’app web avec min versions élevées → **pas** de blocage.

- [ ] **Step 3: Native (si dispo)**

Build Capacitor avec version marketing < min → `ForceUpdatePage` ; CTA ouvre le store ; Réessayer après bump min env → retour app.

---

## Spec coverage (self-review)

| Spec requirement | Task |
|---|---|
| Hard only fullscreen | Task 5 |
| `/health` + env iOS/Android | Task 2 |
| Web non bloqué | Task 4 helper |
| Semver marketing + `v` prefix | Task 1 + Task 2 normalize |
| Fail-open | Task 1 + 2 + 4 |
| ConnectivityGate integration | Task 4 + 5 |
| CTA store | Task 3 + 5 |
| Retry after update | Task 5 (layout retry) |
| Tests API + semver + gate logic | Task 1, 2, 4 |
| Hors scope soft/admin/426 | non implémenté |

No placeholders. Types aligned: `HealthMinVersion` / `minVersion.ios|android` / `update_required`.
