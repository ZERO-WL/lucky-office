# @lucky-office/docx

> 基于 [vue-office](https://github.com/501351981/vue-office) 二次开发：以 [docx-preview] 内核封装的 Vue 组件，用于在浏览器中预览 `.docx` 文件。

## 🌐 在线 Demo

👉 [https://zero-wl.github.io/lucky-office/#/docx](https://zero-wl.github.io/lucky-office/#/docx)

## 特性

- 支持 Vue 2 / Vue 3（通过 `vue-demi` 适配）
- 直接复用 docx-preview 的渲染能力，支持表格、图片、样式、页眉页脚等
- 支持远程 URL、`ArrayBuffer`、`Blob` 多种文件源
- 加载完成 / 失败提供事件钩子

## 安装

```bash
pnpm add @lucky-office/docx
```

## 基本用法

```vue
<script setup>
import VueOfficeDocx from '@lucky-office/docx';
import '@lucky-office/docx/lib/index.css';

const src = 'https://example.com/test.docx';

function onRendered() {
    console.log('渲染完成');
}
function onError(e) {
    console.error('渲染失败', e);
}
</script>

<template>
  <VueOfficeDocx
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
| `requestOptions`  | `Object`                         | 远程拉取时透传给 fetch 的请求选项（如自定义 headers） |
| `options`         | `Object`                         | docx-preview 渲染选项，原样透传 |

## Events

| 事件名      | 触发时机          | Payload |
|------------|-----------------|---------|
| `rendered` | 文件渲染完成     | -       |
| `error`    | 加载或渲染失败   | `Error` |

## 目录结构

```
src/
├── docx.js     # docx-preview 内核包装
├── hack.js     # 兼容 hack
└── main.vue    # 组件主体
```

## License

MIT
