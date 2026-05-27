import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  server: {
    host: '0.0.0.0'
  },
  resolve: {
    alias: {
      'vue-demi': 'vue3'
    }
  },
  plugins: [
      vue(),
  ],
  base: '/vue-office/examples/dist',
  build: {
    outDir: '../examples/dist'
  }
});
