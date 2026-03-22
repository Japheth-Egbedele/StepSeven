import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Server configuration for development
  server: {
    port: 3000,
    open: true, // Auto-open browser
    proxy: {
      // Proxy /api requests to backend
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // Optional: rewrite path if needed
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },

  // Build configuration for production
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts'],
          'http': ['axios']
        }
      }
    }
  },

  // Environment variables prefix
  envPrefix: 'VITE_',

  // Preview server (for production build testing)
  preview: {
    port: 4173,
    open: true
  }
})