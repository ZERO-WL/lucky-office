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
| `progressive`       | `Object \| false` | 可选的渐进式转换路径，开启后先把首屏前 N 行交给 `x-spreadsheet` 渲染，剩余行按批次继续转换并在批次间让出主线程。默认关闭，不传时行为完全不变 |

#### `options.progressive` 字段

> 仅在大文件预览时显式开启；常规文件无需关心。

| 名称                  | 类型       | 默认  | 说明 |
|-----------------------|-----------|------|------|
| `initialRows`         | `Number`  | `30` | 首屏立即转换并加载的行数 |
| `batchRows`           | `Number`  | `100`| 后续每批继续转换的行数 |
| `onInitialDataReady`  | `Function`| -    | 首批数据 ready 时回调，参数 `{ workbookData, medias, workbookSource }` |
| `onProgress`          | `Function`| -    | 每个批次完成后的进度回调 |

```js
const previewer = jsPreviewExcel.init(container, {
    progressive: {
        initialRows: 30,
        batchRows: 100,
        onInitialDataReady(result){ console.log('首屏 ready', result.workbookData); },
        onProgress(progress){ console.log('批次进度', progress); }
    }
});
```

> 解析阶段（`wb.xlsx.load(buffer)`）失败时控制台会输出 `[excel parse]` 结构化日志（`phase / name / message / elapsedMs / bufferLength / stack`），便于把解析阶段错误与后续转换/渲染阶段错误区分开；`preview()` 返回的 Promise reject 行为不变。

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
