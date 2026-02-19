
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'process';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Prioritize MY_API_KEY from the user's secret, fallback to standard API_KEY
  const apiKey = env.MY_API_KEY || env.API_KEY || "";

  return {
    plugins: [react()],
    base: '', 
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    server: {
      port: 3000,
      host: true
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
