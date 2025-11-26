import { defineConfig } from 'vite';

// Vite configuration
// See https://vitejs.dev/config/ for details on each option.
// Since the @vitejs/plugin-react package may be unavailable in this environment,
// this configuration relies on the default Vite JSX handling via esbuild.
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  // esbuild can transform JSX automatically. This option ensures JSX syntax
  // is compiled using the automatic runtime introduced in React 17+.
  esbuild: {
    jsx: 'automatic'
  }
});
