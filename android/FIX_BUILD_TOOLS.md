# Corriger Build Tools 35.0.0 corrompu

Si le build échoue avec « Build Tools 35.0.0 is corrupted », exécute :

## Option 1 : Via SDK Manager (Android Studio)

1. Ouvre **Android Studio**
2. **Settings** → **Languages & Frameworks** → **Android SDK**
3. Onglet **SDK Tools**, coche **Show Package Details**
4. Sous **Android SDK Build-Tools** : désinstalle **35.0.0**, puis réinstalle-le

## Option 2 : Via ligne de commande

```bash
# Chemin de ton SDK (Windows/WSL)
export ANDROID_HOME="/mnt/c/Users/vince/AppData/Local/Android/Sdk"

# Supprimer la version corrompue
rm -rf "$ANDROID_HOME/build-tools/35.0.0"

# Réinstaller
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "build-tools;35.0.0"
```

Ou depuis **PowerShell** (Windows) :

```powershell
$env:ANDROID_HOME = "C:\Users\vince\AppData\Local\Android\Sdk"
& "$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat" "build-tools;35.0.0"
```
