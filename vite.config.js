// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Rutas existentes
      '@router': path.resolve(__dirname, 'src/router.js'),
      '@wan':    path.resolve(__dirname, 'src/net/index.js'),

      // 🔽 Motor único expuesto solo aquí
      '@engine': path.resolve(__dirname, 'src/shared/engineBridge.js'),

      // 🔽 Barril “puro” de reglas (SIN pasar por engineBridge)
      '@rules':  path.resolve(__dirname, 'src/rules/index.js'),
      // (eliminado) '@rulesParallel': path.resolve(__dirname, 'src/rules_parallel/index.js'),
    },
  },

  // ============================================================
  // 🔧 Servidor local — permite Cloudflare y accesos externos
  // ============================================================
  server: {
    host: true,
    port: 5173,
    strictPort: true,

    // 🔓 Permitir dominios externos como trycloudflare.com
    allowedHosts: true,

    // Si quieres restringirlo solo al actual túnel, usa esta línea:
    // allowedHosts: ['pools-overnight-conditions-division.trycloudflare.com'],
  },
});
