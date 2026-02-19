
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'process';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Support both standard naming and the user's custom secret name
  const apiKey = env.MY_API_KEY || env.API_KEY || "";

  return {
    plugins: [react()],
    base: '', // Empty string ensures relative paths for all deployments
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
