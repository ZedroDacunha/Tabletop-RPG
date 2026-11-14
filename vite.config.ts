import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// No GitHub Actions (publicação automática), o site fica em /<nome-do-repositorio>/.
// Localmente e nas prévias o site fica na raiz.
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base =
  process.env.VITE_BASE ??
  (process.env.GITHUB_ACTIONS && repository ? `/${repository}/` : '/');

export default defineConfig({
  base,
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1100, rollupOptions: {input: {app: 'index.html', campfire: 'examples/campfire/index.html'}} },
  server: {
    // Aceita a prévia remota (não apenas localhost) e recarrega a página
    // sempre que um arquivo em src/ muda.
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: true,
    watch: { usePolling: true, interval: 300 },
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
});

