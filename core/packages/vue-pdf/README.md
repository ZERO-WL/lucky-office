# @lucky-office/pdf

> 基于 [vue-office](https://github.com/501351981/vue-office) 二次开发：基于 [pdf.js] 封装的 Vue 组件，用于在浏览器中预览 `.pdf` 文件。

## 特性

- 支持 Vue 2 / Vue 3（通过 `vue-demi` 适配）
- 内置 worker，支持自定义 `staticFileUrl`（用于本地化部署 worker）
- 提供 `setScale / getScale` 缩放控制
- 支持远程 URL、`ArrayBuffer`、`Blob`，可附带自定义请求头

## 安装

```bash
pnpm add @lucky-office/pdf
```

## 基本用法

```vue
<script setup>
import {ref} from 'vue';
import VueOfficePdf from '@lucky-office/pdf';

const src = 'https://example.com/test.pdf';
const pdfRef = ref(null);

function onRendered() {
    console.log('渲染完成');
}
function onError(e) {
    console.error('渲染失败', e);
}

function zoomIn() {
    const cur = pdfRef.value?.getScale?.() ?? 1;
    pdfRef.value?.setScale?.(cur + 0.1);
}
</script>

<template>
  <VueOfficePdf
      ref="pdfRef"
      :src="src"
      style="height: 100vh"
      @rendered="onRendered"
      @error="onError"
  />
</template>
```

## Props

| 名称              | 类型                              | 说明 |
|-------------------|----------------------------------|------|
| `src`             | `String \| ArrayBuffer \| Blob`  | 文件源 |
| `staticFileUrl`   | `String`                         | pdf.js worker 等静态资源的部署路径 |
| `requestOptions`  | `Object`                         | 远程拉取时的请求选项 |
| `options`         | `Object`                         | pdf.js 选项，原样透传 |

## 实例方法

| 方法           | 说明 |
|----------------|------|
| `rerender()`   | 触发重新渲染 |
| `getScale()`   | 获取当前缩放 |
| `setScale(v)`  | 设置缩放（数值，1 表示 100%） |

## Events

| 事件名      | 触发时机          | Payload |
|------------|-----------------|---------|
| `rendered` | 文件渲染完成     | -       |
| `error`    | 加载或渲染失败   | `Error` |

## 目录结构

```
src/
├── main.vue           # 组件主体
├── pdf.js             # pdf.js 主入口包装
├── pdf-source.js      # pdf 资源加载工具
├── worker.js          # pdf.js worker
└── worker-source.js   # worker 资源解析
```

## License

MIT
