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
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'vue',
            'vue-router'
          ],
          'editor': [
            '@tiptap/vue-3',
            '@tiptap/starter-kit',
            '@tiptap/extension-link',
            'codemirror'
          ],
          'ui': [
            'lucide-vue-next',
            'vue-toast-notification',
            'vuedraggable'
          ]
        }
      }
    }
  }
})
