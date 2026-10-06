import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const API_TARGET = process.env.VITE_API_PROXY || 'http://127.0.0.1:5000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: { '/api': { target: API_TARGET, changeOrigin: true } },
  },
  preview: { host: '0.0.0.0', port: 4173, allowedHosts: true, proxy: { '/api': { target: API_TARGET, changeOrigin: true } } },
  build: { chunkSizeWarningLimit: 1200 },
});
