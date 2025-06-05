import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// MANUALLY CHANGE THE APP VERSION HERE
const appVersion = '1.0.4'; // <--- You can manually update this string

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