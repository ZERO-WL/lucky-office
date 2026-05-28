import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss';
import terser from '@rollup/plugin-terser';

// 浏览器环境用不到的 Node 内置模块和 Node-only 工具库，标记为 external
// 避免 rollup 把它们 bundle 进浏览器产物时遇到 ES5 八进制字面量等老语法报错
// （典型案例：fstream → rimraf@2.0.0 里 `var mode = s.mode && 0777` 触发
//   "(plugin commonjs--resolver) SyntaxError: Invalid number"）
const browserUnsupportedNodeOnly = [
    'fs',
    'path',
    'stream',
    'crypto',
    'os',
    'tty',
    'zlib',
    'http',
    'https',
    'url',
    'fstream',
    'rimraf',
    'archiver',
    'unzipper'
];

export default {
    input: 'index.js',
    output: [
        {
            file: 'lib/index.js',
            name: 'jsPreviewExcel',
            format: 'es',
            plugins: [getBabelOutputPlugin({ presets: ['@babel/preset-env'] })]
        },
        {
            file: 'lib/index.umd.js',
            name: 'jsPreviewExcel',
            format: 'umd',
            globals: browserUnsupportedNodeOnly.reduce((acc, name) => {
                acc[name] = `__nodeOnly_${name}`;
                return acc;
            }, {})
        }
    ],
    external: browserUnsupportedNodeOnly,
    plugins: [
        // browser: true → 优先解析 package.json 的 browser 字段
        // preferBuiltins: false → 不优先用 Node 内置模块（让浏览器 polyfill 生效）
        nodeResolve({
            browser: true,
            preferBuiltins: false
        }),
        commonjs({
            // 跳过 Node-only 包，避免解析其 ES5 老语法
            ignore: browserUnsupportedNodeOnly
        }),
        postcss(),
        terser()
    ]
};
