import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';
import * as dotenv from 'dotenv';

dotenv.config();

const config: CapacitorConfig = {
  appId: 'com.one_more.app',
  appName: 'One More',
  webDir: 'dist',
  backgroundColor: '#00000000',
  server: {
    iosScheme: 'one-more',
    androidScheme: 'https',
  },
  plugins: {
    SocialLogin: {
      providers: {
        google: true,
        apple: true,
      },
    },
    SystemBars: {
      insetsHandling: 'css',
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DEFAULT',
      backgroundColor: '#00000000',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_notification',
      iconColor: '#DFFF5E',
    },
    // ⚠️ Cette section n'affecte QUE iOS (le champ `resize` est iOS-only per plugin docs).
    // - iOS : `KeyboardResize.None` = WebView pleine hauteur, aucun resize auto.
    //   Le décalage est alors piloté en CSS via `--keyboard-inset`
    //   (voir `client/src/hooks/use-keyboard-inset.ts` + `client/src/components/ui/drawer.tsx`).
    // - Android : rien à configurer ici ; le keyboard est géré côté natif dans
    //   `client/android/app/src/main/java/com/one_more/app/MainActivity.java`
    //   (padding IME sur le parent de la WebView).
    Keyboard: {
      resize: KeyboardResize.None,
      resizeOnFullScreen: true,
      style: KeyboardStyle.Default,
    },
  },
};

export default config;
