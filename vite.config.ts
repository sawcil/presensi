// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: { enabled: true },
        manifest: {
          name: 'Presensi & Kinerja Guru',
          short_name: 'Presensi Guru',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#0f766e',
          icons: [
            { src: '', sizes: '192x192', type: 'image/png' },
            { src: '', sizes: '512x512', type: 'image/png' },
            { src: '', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
      }),
    ],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
