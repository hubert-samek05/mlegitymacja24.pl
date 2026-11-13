import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'pl.mlegitymacja24.app',
  appName: 'mLegitymacja24',
  webDir: 'www',
  server: {
    url: 'https://mlegitymacja24.pl/logowanie',
    cleartext: false,
  },
  ios: {
    contentInset: 'never',
  },
};

export default config;
