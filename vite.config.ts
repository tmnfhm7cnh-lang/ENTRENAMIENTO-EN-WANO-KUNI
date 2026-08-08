import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// The site is served from https://<user>.github.io/ENTRENAMIENTO-EN-WANO-KUNI/,
// so every asset URL has to be prefixed with the repository name. Without this
// the built page requests /assets/... at the domain root and shows a blank
// screen. Dev keeps serving from '/'.
const BASE = process.env.NODE_ENV === 'production' ? '/ENTRENAMIENTO-EN-WANO-KUNI/' : '/';

export default defineConfig(() => {
  return {
    base: BASE,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: true,
      port: 3000,
    },
  };
});
