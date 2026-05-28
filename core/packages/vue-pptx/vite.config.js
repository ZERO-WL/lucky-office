import { defineConfig } from 'vite';
import vue3 from '@vitejs/plugin-vue';
import * as compiler from '@vue/compiler-sfc';
const { resolve } = require('path');

export default defineConfig({
  plugins: [
    vue3({
      compiler: compiler
    }),
  ],
  build: {
    target: 'es2015',
    outDir: 'lib/v3',
    lib: {
      entry: resolve(__dirname, 'index.js'),
      name: 'lucky-office-pptx',
      fileName: 'lucky-office-pptx',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        },
      },
    },
  },
});
