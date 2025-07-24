import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import { algorithmsRedirectPlugin } from './vite-plugin-algorithms-redirect.js';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  const config = {
    plugins: [algorithmsRedirectPlugin()],
    server: {
      port: 3000,
      open: '/examples/html/',
      host: true,
      fs: {
        // Allow serving files from the dist directory
        allow: ['..']
      }
    },
    build: {
      // Ensure the examples can find the built files
      outDir: 'dist'
    },
    publicDir: false // Disable default public directory behavior
  };

  // Allow HOST configuration from .env
  if (env.HOST) {
    config.server.host = env.HOST;
  }

  // Allow PORT configuration from .env
  if (env.PORT) {
    config.server.port = parseInt(env.PORT);
  }

  return config;
});
