import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Browsers have no `process` object. Without this replacement,
    // services/gemini.ts throws `ReferenceError: process is not defined`
    // at import time and the whole page renders blank.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY ?? ''),
  },
  build: {
    outDir: 'dist',
  },
});