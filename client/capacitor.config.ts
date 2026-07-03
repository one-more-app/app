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
    // Le clavier iOS gère lui-même le décalage via --keyboard-inset (voir client/src/hooks/use-keyboard-inset.ts).
    // Resize=None => WebView pleine hauteur, aucun scroll auto ; on aligne le drawer / la page en CSS.
    Keyboard: {
      resize: KeyboardResize.None,
      resizeOnFullScreen: true,
      style: KeyboardStyle.Default,
    },
  },
};

export default config;
