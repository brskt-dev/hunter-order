import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// Vite + Vitest configuration for the Hunter Order game client.
// `defineConfig` is imported from `vitest/config` so the `test` block is typed.
// `vite-tsconfig-paths` makes the tsconfig `paths` aliases work in dev, build
// and tests from a single source of truth.
export default defineConfig({
  plugins: [tsconfigPaths()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    // Unit tests target Phaser-free logic and run in a plain Node environment.
    // DOM/Phaser scene tests, when introduced, will need a browser-like
    // environment (e.g. jsdom) plus a canvas stub.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
