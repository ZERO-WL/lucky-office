# @lucky-office/js-pdf

> 基于 [vue-office](https://github.com/501351981/vue-office) 二次开发：框架无关（vanilla JS / UMD）的 `.pdf` 预览器，通过 `init(container, options)` 挂载到任意 DOM 节点上，底层基于 [pdf.js]。

## 🌐 在线 Demo

👉 [https://zero-wl.github.io/lucky-office/#/js-pdf](https://zero-wl.github.io/lucky-office/#/js-pdf)

> 也提供更简单的 CDN `<script>` 引用示例：[demo-cdn/pdf.html](https://github.com/ZERO-WL/lucky-office/blob/main/demo-cdn/pdf.html)

## 特性

- 不依赖 Vue / React，纯 JS 即可使用
- 提供 `preview / rerender / save / setOptions / setRequestOptions / destroy` 方法
- 支持远程 URL、`ArrayBuffer`、`Blob`
- 内置 worker，支持自定义 `staticFileUrl` 部署路径

## 安装

```bash
pnpm add @lucky-office/js-pdf
```

## 基本用法

```js
import jsPreviewPdf from '@lucky-office/js-pdf';

const container = document.getElementById('preview');

const previewer = jsPreviewPdf.init(container, {
    staticFileUrl: '/static/pdfjs/',
    onRendered() {
        console.log('渲染完成');
    },
    onError(err) {
        console.error('渲染失败', err);
    }
});

previewer.preview('https://example.com/test.pdf');
```

## API

### `jsPreviewPdf.init(container, options?, requestOptions?)`

| 参数              | 类型                       | 说明 |
|-------------------|---------------------------|------|
| `container`       | `HTMLElement`             | 挂载容器 |
| `options`         | `Options`                 | pdf.js 选项（见下） |
| `requestOptions`  | `Object`                  | 远程拉取时的请求选项 |

返回 `JsPdfPreview` 实例。

### `Options`（常用项）

| 名称                | 类型       | 说明 |
|---------------------|-----------|------|
| `staticFileUrl`     | `String`  | pdf.js 静态资源部署路径 |
| `width`             | `Number`  | 渲染宽度 |
| `data`              | `BinaryData` | 直接传入二进制数据 |
| `httpHeaders`       | `Object`  | 自定义请求头 |
| `withCredentials`   | `Boolean` | 是否携带 cookie |
| `password`          | `String`  | 加密文档密码 |
| `length`            | `Number`  | 文件总长度 |
| `docBaseUrl`        | `String`  | 文档 baseUrl |
| `cMapUrl`           | `String`  | CMap 资源路径 |
| `cMapPacked`        | `Boolean` | CMap 是否打包 |
| `CMapReaderFactory` | `Object`  | 自定义 CMap reader |
| `useSystemFonts`    | `Boolean` | 是否使用系统字体 |
| `onError(err)`      | `Function`| 错误回调 |
| `onRendered()`      | `Function`| 渲染完成回调 |

### 实例方法

| 方法                          | 说明 |
|-------------------------------|------|
| `preview(src)`                | 加载并渲染文件，返回 `Promise` |
| `rerender()`                  | 重新渲染 |
| `save(fileName?)`             | 保存当前文件到本地 |
| `setOptions(options)`         | 更新渲染选项 |
| `setRequestOptions(options)`  | 更新请求选项 |
| `destroy()`                   | 销毁实例 |

## License

MIT
