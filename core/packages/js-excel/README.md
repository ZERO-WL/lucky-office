# @lucky-office/js-excel

> 基于 [vue-office](https://github.com/501351981/vue-office) 二次开发：框架无关（vanilla JS / UMD）的 `.xlsx / .xls` 预览器，通过 `init(container, options)` 挂载到任意 DOM 节点上。底层与 `@lucky-office/excel` 共用解析逻辑（依赖 `@lucky-office/exceljs`）。

## 🌐 在线 Demo

👉 [https://zero-wl.github.io/lucky-office/#/js-excel](https://zero-wl.github.io/lucky-office/#/js-excel)

> 也提供更简单的 CDN `<script>` 引用示例：[demo-cdn/excel.html](https://github.com/ZERO-WL/lucky-office/blob/main/demo-cdn/excel.html)

## 特性

- 不依赖 Vue / React，纯 JS 即可使用
- 通过 `init` 创建实例，提供 `preview / save / setOptions / setRequestOptions / destroy` 方法
- 支持远程 URL、`ArrayBuffer`、`Blob`

## 安装

```bash
pnpm add @lucky-office/js-excel
```

## 基本用法

```js
import jsPreviewExcel from '@lucky-office/js-excel';
import '@lucky-office/js-excel/lib/index.css';

const container = document.getElementById('preview');

const previewer = jsPreviewExcel.init(container, {
    minColLength: 20,
});

previewer.preview('https://example.com/test.xlsx').then(() => {
    console.log('渲染完成');
}).catch(err => {
    console.error('渲染失败', err);
});
```

## API

### `jsPreviewExcel.init(container, options?, requestOptions?)`

| 参数              | 类型                       | 说明 |
|-------------------|---------------------------|------|
| `container`       | `HTMLElement`             | 挂载容器 |
| `options`         | `Options`                 | 渲染选项（见下） |
| `requestOptions`  | `Object`                  | 远程拉取时的请求选项 |

返回 `JsExcelPreview` 实例。

### `Options`

| 名称                | 类型       | 说明 |
|---------------------|-----------|------|
| `minColLength`      | `Number`  | 最小列数 |
| `minRowLength`      | `Number`  | 最小行数 |
| `showContextmenu`   | `Boolean` | 是否显示右键菜单 |

### 实例方法

| 方法                          | 说明 |
|-------------------------------|------|
| `preview(src)`                | 加载并渲染文件，返回 `Promise` |
| `save(fileName?)`             | 保存当前文件到本地 |
| `setOptions(options)`         | 更新渲染选项 |
| `setRequestOptions(options)`  | 更新请求选项 |
| `destroy()`                   | 销毁实例，释放内存 |

## License

MIT
