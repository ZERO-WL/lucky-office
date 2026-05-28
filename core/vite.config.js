import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
  // 通过环境变量控制 base，GitHub Actions 部署时设置 VITE_BASE=/lucky-office/
  // 本地开发不设置 → 默认 '/'，避免 dev server 路径错乱
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const base = env.VITE_BASE || '/';

  return {
    server: {
      host: '0.0.0.0',
      fs: {
        strict: false
      }
    },
    resolve: {
      alias: {}
    },
    plugins: [
      vue(),
      // ExcelJS 严重依赖 Node 内置模块（buffer/stream/util/events 等），
      // 浏览器环境必须 polyfill 才能正常运行
      nodePolyfills({
        // 暴露常用 Node 全局变量
        globals: {
          Buffer: true,
          global: true,
          process: true
        },
        // 不需要 polyfill fs（浏览器没有文件系统，ExcelJS 浏览器路径不走 fs）
        exclude: ['fs']
      })
    ],
    base,
    optimizeDeps: {
      // @lucky-office/exceljs 是 CommonJS 包（workspace:* 引用），需要强制 Vite 预 bundle 成 ESM
      // 否则 dev server 加载时会报 "does not provide an export named 'default'"
      include: ['@lucky-office/exceljs']
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      commonjsOptions: {
        // 让 Rollup 构建时也把 @lucky-office/exceljs 当 CommonJS 处理，正确生成 default 导出
        include: [/node_modules/, /packages\/exceljs/]
      }
    }
  };
});
