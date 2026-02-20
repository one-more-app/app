# One More — Landing page

Landing Next.js avec formulaire de pré-inscription (emails enregistrés dans un Google Sheet).

## Démarrage

```bash
cd landing-next
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Google Sheet (pré-inscriptions)

1. **Google Cloud** : crée un projet, active l’API Google Sheets.
2. **Compte de service** : crée une clé JSON et télécharge le fichier.
3. **Google Sheet** : crée une feuille, ajoute une feuille nommée `Pré-inscriptions` (ou le nom que tu mets dans `GOOGLE_SHEET_NAME`). Colonnes A = email, B = date.
4. **Partage** : donne le rôle **Éditeur** sur le sheet à l’email du compte de service (ex. `xxx@yyy.iam.gserviceaccount.com`).
5. **Variables d’environnement** : crée un fichier `.env.local` à la racine de `landing-next` :

```env
GOOGLE_SHEETS_CREDENTIALS_JSON={"type":"service_account", ...}
GOOGLE_SPREADSHEET_ID=1abc...xyz
GOOGLE_SHEET_NAME=Pré-inscriptions
```

`GOOGLE_SHEETS_CREDENTIALS_JSON` doit être le contenu JSON du fichier de clé du compte de service (sur une seule ligne).

## Build

```bash
npm run build
npm run start
```

Le logo est dans `public/logo.png` (copie de l’app principale).
