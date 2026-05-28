# @lucky-office/js-docx

> 基于 [vue-office](https://github.com/501351981/vue-office) 二次开发：框架无关（vanilla JS / UMD）的 `.docx` 预览器，通过 `init(container, options)` 挂载到任意 DOM 节点上，底层基于 [docx-preview]。

## 特性

- 不依赖 Vue / React，纯 JS 即可使用
- 提供 `preview / save / setOptions / setRequestOptions / destroy` 方法
- 支持远程 URL、`ArrayBuffer`、`Blob`

## 安装

```bash
pnpm add @lucky-office/js-docx
```

## 基本用法

```js
import jsPreviewDocx from '@lucky-office/js-docx';
import '@lucky-office/js-docx/lib/index.css';

const container = document.getElementById('preview');

const previewer = jsPreviewDocx.init(container, {
    breakPages: true,
    debug: false,
});

previewer.preview('https://example.com/test.docx').then(() => {
    console.log('渲染完成');
}).catch(err => {
    console.error('渲染失败', err);
});
```

## API

### `jsPreviewDocx.init(container, options?, requestOptions?)`

| 参数              | 类型                       | 说明 |
|-------------------|---------------------------|------|
| `container`       | `HTMLElement`             | 挂载容器 |
| `options`         | `Options`                 | docx-preview 选项（见下） |
| `requestOptions`  | `Object`                  | 远程拉取时的请求选项 |

返回 `JsDocxPreview` 实例。

### `Options`（与 docx-preview 一致，常用项）

| 名称                          | 类型       | 说明 |
|------------------------------|-----------|------|
| `inWrapper`                   | `Boolean` | 是否包裹外层容器 |
| `ignoreWidth` / `ignoreHeight`| `Boolean` | 忽略宽 / 高 |
| `ignoreFonts`                 | `Boolean` | 忽略字体 |
| `breakPages`                  | `Boolean` | 是否分页 |
| `debug`                       | `Boolean` | 调试模式 |
| `experimental`                | `Boolean` | 启用实验特性 |
| `className`                   | `String`  | 容器 className |
| `trimXmlDeclaration`          | `Boolean` | 去掉 XML 声明 |
| `renderHeaders / Footers / Footnotes / Endnotes` | `Boolean` | 是否渲染对应区块 |
| `ignoreLastRenderedPageBreak` | `Boolean` | 忽略最后渲染分页 |
| `useBase64URL`                | `Boolean` | 使用 base64 URL |
| `useMathMLPolyfill`           | `Boolean` | 启用 MathML polyfill |
| `renderChanges`               | `Boolean` | 渲染修订 |

### 实例方法

| 方法                          | 说明 |
|-------------------------------|------|
| `preview(src)`                | 加载并渲染文件，返回 `Promise` |
| `save(fileName?)`             | 保存原始文件到本地 |
| `setOptions(options)`         | 更新渲染选项 |
| `setRequestOptions(options)`  | 更新请求选项 |
| `destroy()`                   | 销毁实例 |

## License

MIT
