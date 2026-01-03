import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/ma3ankolyoum/',

  plugins: [vue(), legacy()],

  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },

  assetsInclude: ['**/*.mp3'],

  build: {
    outDir: 'docs',
    emptyOutDir: true
  }
})
