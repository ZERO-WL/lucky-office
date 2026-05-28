import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  // 通过环境变量控制 base，GitHub Actions 部署时设置 VITE_BASE=/lucky-office/
  // 本地开发不设置 → 默认 '/'，避免 dev server 路径错乱
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const base = env.VITE_BASE || '/';

  return {
    server: {
      host: '0.0.0.0'
    },
    resolve: {
      alias: {}
    },
    plugins: [
      vue(),
    ],
    base,
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    }
  };
});
