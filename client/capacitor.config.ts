import type { CapacitorConfig } from '@capacitor/cli';

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
    SystemBars: {
      insetsHandling: 'css',
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DEFAULT',
      backgroundColor: '#00000000',
    },
  },
};

export default config;
