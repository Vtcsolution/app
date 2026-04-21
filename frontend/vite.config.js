import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Add these to fix process is not defined error
    'process.env': {},
    'global': 'window'
  },
  optimizeDeps: {
    // Exclude twilio-client since we're using CDN
    exclude: ['twilio-client']
  }
})