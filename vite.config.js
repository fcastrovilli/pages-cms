import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    chunkSizeWarningLimit: 800,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core vendor chunk (Vue + Vue Router)
          if (id.includes('node_modules/vue') || 
              id.includes('node_modules/vue-router')) {
            return 'core'
          }
          
          // Editor core (TipTap core)
          if (id.includes('@tiptap/vue-3') || 
              id.includes('@tiptap/pm') ||
              id.includes('@tiptap/starter-kit')) {
            return 'editor-core'
          }

          // Editor extensions
          if (id.includes('@tiptap/extension')) {
            return 'editor-extensions'
          }
          
          // CodeMirror
          if (id.includes('@codemirror') ||
              id.includes('codemirror')) {
            return 'editor-codemirror'
          }
          
          // Data processing libraries
          if (id.includes('lodash') ||
              id.includes('moment') ||
              id.includes('yaml') ||
              id.includes('marked') ||
              id.includes('lunr')) {
            return 'data-libs'
          }

          // UI components and utilities
          if (id.includes('lucide-vue-next') ||
              id.includes('vue-toast-notification') ||
              id.includes('vuedraggable')) {
            return 'ui'
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})
