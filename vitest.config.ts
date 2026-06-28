import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Note: this file is intentionally excluded from tsconfig project references
// to avoid the dual-Vite type conflict between `vite` and `vitest`'s bundled
// Vite. It is consumed directly by the Vitest runtime.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
});
