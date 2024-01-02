import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mix from 'vite-plugin-mix'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5177,
  },
  plugins: [
    /*
    mix({
      handler: './handler.ts',
    }),

    */
    react(),
  ],
})

