import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  outDir: 'dist',
  dts: true,
  sourcemap: true,
  clean: true,
  shims: true,
  cjsInterop: true,
  keepNames: true,
  skipNodeModulesBundle: true,
  minify: false,
  target: 'node16',
});
