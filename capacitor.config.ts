import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.quietspace.app',
  appName: 'Quiet Space',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
