import type { CapacitorConfig } from '@capacitor/cli';
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
  },
};

export default config;
