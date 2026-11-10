import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Fontes permanecem em arquivos da mesma origem, compatíveis com font-src 'self'.
  build: { assetsInlineLimit: 0 },
})
