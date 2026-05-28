import { defineConfig } from 'vite';
import vue3 from '@vitejs/plugin-vue';
import * as compiler from '@vue/compiler-sfc';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
const { resolve } = require('path');
import babel from '@rollup/plugin-babel';

export default defineConfig({
  plugins: [
    vue3({
      compiler: compiler
    }),
    // ExcelJS 严重依赖 Node 内置模块（buffer/stream/util/events 等），
    // 浏览器环境必须 polyfill 才能正常运行
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true
      },
      exclude: ['fs']
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
    commonjsOptions: {
      // @lucky-office/exceljs 是 CommonJS 模块（workspace:* 引用），
      // 必须让 @rollup/plugin-commonjs 处理它，否则 default 导出会丢失
      include: [/node_modules/, /packages\/exceljs/]
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
