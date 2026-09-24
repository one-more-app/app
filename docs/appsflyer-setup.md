# AppsFlyer — invitations amis (OneLink + UDL)

Ce guide complète l’intégration SDK dans le client Capacitor et la génération de liens côté API.

## 1. Compte AppsFlyer

1. Créer l’app **iOS** (`com.one-more.app`) et **Android** (`com.one_more.app`) dans le dashboard.
2. Noter la **Dev Key** (Paramètres de l’app).
3. Noter l’**App ID iOS** numérique (App Store Connect → identifiant Apple de l’app).

## 2. Template OneLink

1. **Engagement → OneLink → Templates** → créer un template (ex. `friend_invite`).
2. Noter :
   - **OneLink ID** (segment d’URL, ex. `H5hv`)
   - **Domaine** (ex. `one-more.onelink.me`)
3. Dans le template, configurer le deep link :
   - Paramètre **`deep_link_value`** = code d’invite (`{{invite_code}}` ou valeur passée dans l’URL)
4. Activer **Deferred deep linking** / **Unified Deep Linking (UDL)** pour le template.

Paramètres utilisés par One More :

| Paramètre | Rôle |
|-----------|------|
| `deep_link_value` | Code d’invite 8 caractères |
| `invite_code` | Doublon (User Invite API) |
| `pid` | `friend_invite` (attribution) |

## 3. Variables d’environnement

### Client (`client/.env.*.capacitor`)

```bash
VITE_APPSFLYER_DEV_KEY="xxxxxxxx"
VITE_APPSFLYER_APP_ID="1234567890"          # ID App Store iOS (numérique)
VITE_APPSFLYER_ONELINK_ID="H5hv"            # segment template OneLink
VITE_APPSFLYER_ONELINK_DOMAIN="one-more.onelink.me"
# Optionnel : domaines branded
# VITE_APPSFLYER_BRANDED_DOMAINS="invite.one-more.app"
```

Rebuild obligatoire après changement : `npm run ios:build:prod` / `android:build:prod`.

### API (`api/.env`)

```bash
PUBLIC_APP_URL="https://one-more.app"
APPSFLYER_ONELINK_DOMAIN="one-more.onelink.me"
APPSFLYER_ONELINK_ID="H5hv"
```

`GET /social/invite-link` renvoie uniquement une URL OneLink. Sans `APPSFLYER_ONELINK_*` → 503 (pas de fallback web `#/invite/...`).

## 4. Android — App Links

Dans `client/android/app/src/main/AndroidManifest.xml`, ajouter un intent-filter **après** configuration du template (remplacer host et pathPrefix) :

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
        android:scheme="https"
        android:host="one-more.onelink.me"
        android:pathPrefix="/H5hv" />
</intent-filter>
```

Puis **SHA-256** du keystore dans AppsFlyer (Paramètres Android → App Links).

## 5. iOS — Universal Links

1. Xcode → target **App** → **Signing & Capabilities** → **Associated Domains** :
   - `applinks:one-more.onelink.me`
   - (+ domaines branded si utilisés)
2. AppsFlyer configure le fichier `apple-app-site-association` sur le domaine OneLink.
3. Ne pas supprimer le code `application(_:continue:)` dans `AppDelegate.swift` (déjà en place pour Capacitor).

## 6. Parcours utilisateur

| Scénario | Comportement |
|----------|----------------|
| App installée, clic OneLink | UDL → `setPendingInviteCode` → `#/invite/{code}` |
| Install depuis le store (deferred) | `conversion_callback` + `deep_link_value` au 1er lancement |
| Web sans app | URL OneLink → store ou landing ; code dans `deep_link_value` |
| Inscription | `inviteCode` envoyé à l’API → `applyReferralCodeOnSignup` |

## 7. Tests

1. Dashboard AppsFlyer → **Test devices** : ajouter l’IDFA/GAID de l’appareil de test.
2. Activer `isDebug` (déjà lié à `import.meta.env.DEV` dans le code).
3. Tester un lien généré depuis **Paramètres → Parrainage → Partager mon invitation**.
4. Vérifier dans les logs : `UDL_CALLBACK` avec `status: FOUND` et `deep_link_value`.

## 8. Store (Play / App Store)

Sur la landing web (ou page AppsFlyer), les boutons store doivent pointer vers les fiches officielles. Le **deferred deep link** est géré par AppsFlyer au premier open après install — pas besoin de coller le code manuellement si UDL est bien configuré.

Pour Android, tu peux en plus ajouter un `referrer` Play Store ; AppsFlyer UDL reste la source principale recommandée.

## 9. iOS — ATT, SKAdNetwork, Meta Ads

Le wizard Meta Events Manager propose encore `FBSDKCoreKit ~> 8.0` et `AdvertisingTrackingEnabled = true` en dur. **Ne pas suivre ça** : SDK 8 est obsolète, et forcer ATE à true si l’utilisateur refuse ATT est un motif de rejet App Store.

Ce qui est en place :

| Élément | Détail |
|---------|--------|
| Facebook SDK | CocoaPods `FBSDKCoreKit ~> 18.0` (pas Login/Share/Gaming). Query schemes Meta (`fbapi`, `fbauth2`, messenger, share). |
| ATT | Prompt une seule fois, après `AppsFlyer.initSDK` (`waitForATTUserAuthorization: 60`) |
| ATE Meta | `Settings.isAdvertiserTrackingEnabled` = résultat ATT (jamais hardcodé à true) |
| SKAN | `SKAdNetworkItems` (Meta `v9qkcwr9w5` + `v9wttpbfk9` + `n38lu8286q`) |
| Copies SKAN | `NSAdvertisingAttributionReportEndpoint` + AdAttributionKit → `https://appsflyer-skadnetwork.com/` |

### Facebook App ID + Client Token (obligatoire pour Meta)

Sans ces deux valeurs, le SDK Facebook **ne s’initialise pas** (ATT + AppsFlyer SKAN restent actifs).

1. [Meta for Developers](https://developers.facebook.com/apps/) → ton app → **Paramètres → Général** : **Identifiant de l’app**.
2. **Paramètres → Avancé** : **Client token**.
3. Xcode → target **App** → **Build Settings** → User-Defined :
   - `FACEBOOK_APP_ID` = identifiant numérique
   - `FACEBOOK_CLIENT_TOKEN` = token
4. Rebuild iOS (`npm run ios:build:prod` puis archive).

Le schéma d’URL `fb$(FACEBOOK_APP_ID)` se complète tout seul.

### Events Manager — tâche « Mettre à jour le SDK »

Après un build TestFlight / prod avec App ID + token :

1. Ouvre l’app **une fois** sur un iPhone (pas le simulateur pour l’IDFA).
2. Accepte ATT si tu testes le matching IDFA.
3. Dans Events Manager, la tâche SDK peut rester « quelques jours » même si le SDK 18 tourne déjà — c’est normal.
4. Ne mets pas `AdvertisingTrackingEnabled` à true dans le dashboard si ATT est refusé.

## 10. Android — Meta App Events

Même règle que iOS : le wizard « Démarrage rapide » est **obsolète** (`facebook-android-sdk:[8,9)`, bouton Login, `com.example.myapp.MainActivity`). En place : `facebook-core:18.0.3`, App ID + Client Token, `AdvertiserIDCollectionEnabled`, pas de Facebook Login.

Dans le formulaire Meta, coller :

| Champ | Valeur |
|--------|--------|
| Nom du package | `com.one_more.app` |
| Activité par défaut | `com.one_more.app.MainActivity` |
| Identifiant d’offre iOS | `com.one-more.app` |

Ne pas glisser Bolts / LoginKit / ShareKit dans Xcode. Ne pas ajouter le bouton « Se connecter avec Facebook ». Cocher les achats auto-loggés (SDK 18 le fait). Rebuild Android (`npm run android:build:prod`) puis ouvrir l’app une fois sur un téléphone.
