import {getBabelOutputPlugin} from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default {
    input: 'index.js',
    output:[
        {
            file: 'lib/index.js',
            name: 'jsPreviewDocx',
            format: 'es',
            plugins: [getBabelOutputPlugin({
                presets: [
                    [
                        '@babel/preset-env',
                        {
                            targets: {
                                browsers: ['ie >= 11'] // 指定转换目标为IE11及以上版本
                            },
                            useBuiltIns: 'usage', // 根据实际使用情况添加polyfills
                            corejs: 3 // 使用core-js 3作为polyfills
                        }
                    ]
                ]
            })]
        },
        {
            file: 'lib/index.umd.js',
            name: 'jsPreviewDocx',
            format: 'umd'
        }
    ],
    plugins: [
        nodeResolve(),
        commonjs(),
        terser()
    ]
};