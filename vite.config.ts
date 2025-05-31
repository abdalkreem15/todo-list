import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import * as fs from 'fs';
import * as path from 'path';

// Read package.json version
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));
const appVersion = pkg.version;

export default defineConfig({
  plugins: [sveltekit()],

  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js?v=${appVersion}`,
        chunkFileNames: `assets/[name].[hash].js?v=${appVersion}`,
        assetFileNames: `assets/[name].[hash].[ext]?v=${appVersion}`
      }
    }
  },

  // Pass the version to your app via define
  define: {
    __APP_VERSION__: JSON.stringify(appVersion)
  }
});