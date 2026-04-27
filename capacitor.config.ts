import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bestself.app',
  appName: 'Best self',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
