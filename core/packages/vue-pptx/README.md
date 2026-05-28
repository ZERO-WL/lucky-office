# @lucky-office/pptx

> 基于 [vue-office](https://github.com/501351981/vue-office) 二次开发：用于在浏览器中预览 `.pptx` 文件的 Vue 组件。

## 🌐 在线 Demo

👉 [https://zero-wl.github.io/lucky-office/#/pptx](https://zero-wl.github.io/lucky-office/#/pptx)

## 特性

- 支持 Vue 2 / Vue 3（通过 `vue-demi` 适配）
- 解析 OOXML pptx 并渲染为 HTML
- 支持远程 URL、`ArrayBuffer`、`Blob`
- 支持自定义请求头（鉴权、跨域）

## 安装

```bash
pnpm add @lucky-office/pptx
```

## 基本用法

```vue
<script setup>
import VueOfficePptx from '@lucky-office/pptx';

const src = 'https://example.com/test.pptx';

function onRendered() {
    console.log('渲染完成');
}
function onError(e) {
    console.error('渲染失败', e);
}
</script>

<template>
  <VueOfficePptx
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
| `requestOptions`  | `Object`                         | 远程拉取请求选项 |
| `options`         | `Object`                         | 内核渲染选项，原样透传 |

## 实例方法

| 方法           | 说明 |
|----------------|------|
| `rerender()`   | 触发重新渲染 |

## Events

| 事件名      | 触发时机          | Payload |
|------------|-----------------|---------|
| `rendered` | 文件渲染完成     | -       |
| `error`    | 加载或渲染失败   | `Error` |

## License

MIT
