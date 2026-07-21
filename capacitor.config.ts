import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mixdoreino.app',
  appName: 'Mix do Reino',
  webDir: 'dist',
  android: {
    allowMixedContent: true
  },
  server: {
    iosScheme: 'https',
    androidScheme: 'https'
  },
  plugins: {
    // Modo manual: quem decide quando checar/baixar/aplicar atualização é o nosso código
    // (src/services/otaUpdater.ts), não o serviço cloud do Capgo.
    CapacitorUpdater: {
      autoUpdate: false
    }
  }
};

export default config;
