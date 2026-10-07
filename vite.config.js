import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// GitHub Pages serves this from a subpath (/<repo>/), not the domain root.
// A relative base keeps the built asset URLs working there without hardcoding
// the repo name.
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      // The main game is the spaceship (custom engine); the old Phaser village
      // prototype is kept reachable at village.html.
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        village: resolve(import.meta.dirname, 'village.html'),
      },
    },
  },
});
