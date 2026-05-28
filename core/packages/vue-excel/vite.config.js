import { defineConfig } from 'vite';
import vue3 from '@vitejs/plugin-vue';
import * as compiler from '@vue/compiler-sfc';
const { resolve } = require('path');
import babel from '@rollup/plugin-babel';

export default defineConfig({
  plugins: [
    vue3({
      compiler: compiler
    })
  ],
  build: {
    minify: 'terser',
    target: 'es2015',
    outDir: 'lib/v3',
    lib: {
      entry: resolve(__dirname, 'index.js'),
      name: 'lucky-office-excel',
      fileName: 'lucky-office-excel',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        },
      },
      plugins: [
        babel({
          extensions: ['.js', '.ts', '.vue'],
          babelHelpers: 'runtime',
          plugins: [
            '@babel/plugin-transform-runtime',
            '@babel/plugin-transform-template-literals'
          ],
          presets: [
            [
              '@babel/preset-env',
              {
                useBuiltIns: false,
                targets: {
                  chrome: '40'
                },
              },
            ],
          ],
        }),
      ],
    },
  },
});
