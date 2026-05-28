# @lucky-office/excel

> 基于 [vue-office](https://github.com/501351981/vue-office) 二次开发：使用 Canvas（x-spreadsheet）的 Vue 组件，用于在浏览器中预览 `.xlsx / .xls` 文件，支持单元格样式、合并单元格、图片、附件（OLE 对象）、附件卡片选中 / 拖拽 / 预览 / 下载等能力。

## 🌐 在线 Demo

👉 [https://zero-wl.github.io/lucky-office/#/excel](https://zero-wl.github.io/lucky-office/#/excel)

> 默认加载一个带 OLE 嵌入附件（Word / Excel / PDF）的样例 xlsx，可点击附件卡片体验选中 / 拖拽 / 预览 / 下载交互。

## 特性

- 支持 Vue 2 / Vue 3（通过 `vue-demi` 适配）
- 解析依赖工作区内置的 [@lucky-office/exceljs](../exceljs/README.md)
- Canvas 渲染单元格、图片
- OLE 附件以独立卡片渲染，可选中、拖拽、预览、下载
- 支持上传本地文件或传入远程 URL / `ArrayBuffer` / `Blob`

## 安装

```bash
# 在 monorepo 内通过 pnpm workspace 引用
pnpm add @lucky-office/excel
```

## 基本用法

```vue
<script setup>
import VueOfficeExcel from '@lucky-office/excel';
import '@lucky-office/excel/lib/index.css';

const src = 'https://example.com/test.xlsx';

function onRendered() {
    console.log('渲染完成');
}
function onError(e) {
    console.error('渲染失败', e);
}
function onAttachmentPreview({ url, name, previewType }) {
    // 由示例项目自行决定如何打开新标签页
    if (previewType) {
        window.open(`${location.origin}${location.pathname}#/${previewType}?url=${encodeURIComponent(url)}`, '_blank');
    } else {
        window.open(url, '_blank');
    }
}
</script>

<template>
  <VueOfficeExcel
      :src="src"
      :options="{ minColLength: 20 }"
      style="height: 100vh"
      @rendered="onRendered"
      @error="onError"
      @attachment-preview="onAttachmentPreview"
  />
</template>
```

## Props

| 名称              | 类型                              | 说明 |
|-------------------|----------------------------------|------|
| `src`             | `String \| ArrayBuffer \| Blob`  | 文件源，可以是远程 URL、`blob:` URL 或二进制数据 |
| `requestOptions`  | `Object`                         | 远程拉取时透传给底层 fetch 的请求选项（如自定义 headers） |
| `options`         | `Object`                         | 渲染选项（见下） |

### `options` 字段

| 名称                  | 类型       | 默认  | 说明 |
|-----------------------|-----------|------|------|
| `xls`                 | `Boolean` | `false` | 是否按 `.xls` 解析 |
| `minColLength`        | `Number`  | `20`  | 最小列数 |
| `minRowLength`        | `Number`  | -    | 最小行数 |
| `widthOffset`         | `Number`  | -    | 列宽偏移 |
| `heightOffset`        | `Number`  | -    | 行高偏移 |
| `showContextmenu`     | `Boolean` | -    | 是否显示右键菜单 |
| `beforeTransformData` | `Function`| -    | 解析完成后、转换为 spreadsheet 数据前的钩子 |
| `transformData`       | `Function`| -    | 转换为 spreadsheet 数据后的钩子 |

## Events

| 事件名               | 触发时机                           | Payload |
|---------------------|----------------------------------|---------|
| `rendered`          | 文件渲染完成                      | -       |
| `error`             | 加载或渲染失败                     | `Error` |
| `switchSheet`       | 切换工作表                         | `sheetIndex: number` |
| `cellSelected`      | 点击选中单个单元格                 | `cellEvent` |
| `cellsSelected`     | 框选多个单元格                     | `cellsEvent` |
| `attachment-preview`| 点击附件卡片上的「预览」按钮         | `{ url, name, extension, mimeType, previewType, attachment }` |

### `attachment-preview` Payload 详解

| 字段          | 类型      | 说明 |
|---------------|----------|------|
| `url`         | `string` | 组件创建的 Blob URL（不会主动 `revokeObjectURL`，由浏览器 GC 处理） |
| `name`        | `string` | 推断出的附件文件名（含扩展名） |
| `extension`   | `string` | 小写扩展名 |
| `mimeType`    | `string` | 推断出的 MIME 类型 |
| `previewType` | `'excel' \| 'docx' \| 'pdf' \| 'pptx' \| null` | 适合走本仓库哪个预览路由；为 `null` 时建议宿主页直接 `window.open` |
| `attachment`  | `object` | 原始附件对象引用，便于二次处理 |

> 说明：组件内部「下载」按钮仍由组件直接调用 `downloadOLEObject` 完成下载，不通过事件外抛。

## 附件交互

- 单击卡片：选中 / 取消选中（选中态会显示「预览」「下载」并排按钮）
- 拖拽卡片：在画布内移动卡片到新单元格位置（支持滚动后正确定位）
- 「预览」按钮：触发 `attachment-preview` 事件，由父组件决定如何打开
- 「下载」按钮：组件内部直接触发本地下载

## 目录结构

```
src/
├── x-spreadsheet/      # 内嵌的 x-spreadsheet 渲染内核
├── color.js            # 颜色处理工具
├── excel.js            # 解析 xlsx -> spreadsheet data
├── hack.js             # 兼容 hack
├── index.css           # 样式
├── main.vue            # 组件主体
├── media.js            # 图片 / 附件卡片绘制
└── ole-downloader.js   # OLE 附件下载工具
```

## License

MIT
