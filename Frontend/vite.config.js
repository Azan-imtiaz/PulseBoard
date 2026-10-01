import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  // Proxying the API keeps the app same-origin in development, so the refresh
  // cookie works without any CORS or SameSite special-casing.
  const target = loadEnv(mode, process.cwd(), '').API_URL || 'http://localhost:4000';

  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      proxy: {
        '/api': target,
        '/socket.io': { target, ws: true },
        '/docs': target,
        '/openapi.json': target,
      },
    },
  };
});
