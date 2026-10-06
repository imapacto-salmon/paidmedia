import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// En GitHub Pages el sitio vive en https://<usuario>.github.io/<repo>/,
// por eso el workflow define BASE_PATH=/<repo>/. En local se usa "/".
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  // @react-pdf se carga bajo demanda (solo al descargar), por eso su chunk es grande.
  build: {
    chunkSizeWarningLimit: 1600,
    // Dos páginas: el Brief de Artes (/) y la Bitácora de Pauta (/bitacora/).
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        bitacora: resolve(import.meta.dirname, 'bitacora/index.html'),
      },
    },
  },
})
