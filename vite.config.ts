/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    legacy()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // ✅ مهم: اعتبر mp3 assets عشان تتضمن في build
  assetsInclude: ['**/*.mp3'],

  test: {
    globals: true,
    environment: 'jsdom'
  }
})
