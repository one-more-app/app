# Notifications push (One More)

## Vue d'ensemble

- **Client** : `@capacitor/push-notifications` (iOS + Android)
- **API** : `firebase-admin` + FCM
- **Types v1** : série en danger, demandes/acceptations amis, messages, séances amis (cloche profil), records amis, récap hebdo

## Firebase

1. Créer un projet [Firebase Console](https://console.firebase.google.com/)
2. Ajouter l'app **Android** (`com.one_more.app`) → télécharger `google-services.json` → `client/android/app/google-services.json`
3. Ajouter l'app **iOS** (`com.one-more.app`) → télécharger `GoogleService-Info.plist` → `client/ios/App/GoogleService-Info.plist`
4. iOS : uploader la clé APNs (.p8) dans Firebase → Cloud Messaging
5. Générer un **compte de service** → JSON → variable `FIREBASE_SERVICE_ACCOUNT_JSON` sur l'API (staging + prod)

## API

```bash
# api/.env
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

Migration :

```bash
cd api && npm run typeorm:migrate
```

## iOS (Xcode)

- Capability **Push Notifications**
- Rebuild : `cd client && npm run ios:build:prod`
- L'icône affichée dans les notifications est l'**icône de l'app** (assets Xcode / `@capacitor/assets`). Pas de fichier dédié côté push.

## Android

- `google-services.json` présent → le plugin Gradle s'applique automatiquement
- Rebuild : `cd client && npm run android:build:prod`
- **Icône notification** : silhouette blanche du logo (`res/drawable-*/ic_stat_notification.png`), configurée dans `AndroidManifest.xml` + payload FCM (`ic_stat_notification`, accent `#DFFF00`). Régénérer après changement de logo :
  ```bash
  cd client && bash scripts/generate-notification-icon.sh
  ```

## Préférences utilisateur

Paramètres → section **Notifications** : 7 toggles indépendants.

## Cloche séance ami

Sur le profil d'un ami → icône cloche → abonnement `friend_training_alerts` en base.
