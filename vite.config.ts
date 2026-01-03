import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const isGitHub = mode === 'github' // هنستخدمه في سكريبت build مخصوص

  return {
    base: isGitHub ? '/ma3ankolyoum/' : '/',   // ✅ GitHub Pages لازم كده
    plugins: [vue(), legacy()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    assetsInclude: ['**/*.mp3'],

    build: {
      outDir: 'dist',          // ✅ Capacitor expects dist
      emptyOutDir: true
    }
  }
})
