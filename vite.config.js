import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('svelte-jsoneditor')) {
            return 'vendor-jsoneditor';
          }
          if (id.includes('node_modules/svelte')) {
            return 'vendor-svelte';
          }
          if (id.includes('node_modules/zod') || id.includes('node_modules/clsx')) {
            return 'vendor-utils';
          }
        }
      }
    }
  },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'iMJSON 에디터',
        short_name: 'JSON 에디터',
        description: 'iMJSON 사내 내부망 전용 JSON 에디터',
        theme_color: '#2563eb',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ]
});
