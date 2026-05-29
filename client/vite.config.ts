import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'vite.svg', 'icons/*.webp'],
      manifest: {
        name: 'One More',
        short_name: 'One More',
        description: 'Application de suivi d\'exercices de musculation',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        icons: [
            { src: '/icons/icon-48.webp', sizes: '48x48', type: 'image/webp', purpose: 'any' },
          { src: '/icons/icon-72.webp', sizes: '72x72', type: 'image/webp', purpose: 'any' },
          { src: '/icons/icon-96.webp', sizes: '96x96', type: 'image/webp', purpose: 'any' },
          { src: '/icons/icon-128.webp', sizes: '128x128', type: 'image/webp', purpose: 'any' },
          { src: '/icons/icon-192.webp', sizes: '192x192', type: 'image/webp', purpose: 'any' },
          { src: '/icons/icon-256.webp', sizes: '256x256', type: 'image/webp', purpose: 'any' },
          { src: '/icons/icon-512.webp', sizes: '512x512', type: 'image/webp', purpose: 'any' },
          { src: '/icons/icon-512.webp', sizes: '512x512', type: 'image/webp', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webp}'],
      },
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@one-more/shared': path.resolve(__dirname, '../shared'),
    },
  },
})
