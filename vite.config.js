import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react/jsx-runtime'],
          // MUI (largest dependency)
          'vendor-mui': [
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled',
          ],
          // Firebase (auth + firestore)
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // PDF export (lazy loaded but separate chunk)
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          // OCR (lazy loaded but separate chunk)
          'vendor-ocr': ['tesseract.js'],
        },
      },
    },
    // Increase chunk size warning limit (we're intentionally splitting)
    chunkSizeWarningLimit: 1000,
  },
})
