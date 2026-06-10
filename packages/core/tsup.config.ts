import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  globalName: 'attrichart',
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2020',
});
