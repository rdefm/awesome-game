import { defineConfig } from 'vite';

// GitHub Pages serves this from a subpath (/<repo>/), not the domain root.
// A relative base keeps the built asset URLs working there without hardcoding
// the repo name.
export default defineConfig({
  base: './',
});
