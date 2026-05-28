# demo-cdn

通过 CDN（unpkg）直接 `<script>` 引用 `@lucky-office/js-*` 系列包的最简示例。

> 这是给「不想引入打包工具，只想在原生 HTML 里用一下预览能力」的用户看的入门示例。

## 🌐 想直接看在线效果？

如果只是想看预览效果，无需 clone 本仓库，可直接访问基于 Vue 3 演示项目的在线 Demo：

- [Excel 预览](https://zero-wl.github.io/lucky-office/#/excel) / [Word 预览](https://zero-wl.github.io/lucky-office/#/docx) / [PDF 预览](https://zero-wl.github.io/lucky-office/#/pdf) / [PPT 预览](https://zero-wl.github.io/lucky-office/#/pptx)

本目录下的 HTML 示例则演示了"不用任何打包工具，纯 `<script>` 引入 UMD"的极简集成方式，适合在传统页面里快速嵌入预览能力。

## 内容

- [`docx.html`](./docx.html) — Word 预览
- [`excel.html`](./excel.html) — Excel 预览
- [`pdf.html`](./pdf.html) — PDF 预览

## 用法

任意 HTTP 服务器打开对应 HTML 即可：

```bash
# 用 npx 起一个临时服务器
npx serve d:\my-code\my-lucky-office\lucky-office\demo-cdn
# 浏览器打开 http://localhost:3000/excel.html
```

或直接双击 `excel.html`（部分浏览器对 file:// 跨域限制较严，推荐前者）。

## 替换为本地文件预览

示例里的 URL 走的是 `https://static.shanhuxueyuan.com/`，仅做演示。
你的项目里替换成真实可访问的 URL 即可：

```html
<script>
  const previewer = jsPreviewExcel.init(document.getElementById('excel'));
  previewer.preview('https://your-cdn.com/path/to/file.xlsx');
</script>
```

## 锁版本

unpkg 默认会拉最新版，如果想锁定版本：

```html
<script src="https://unpkg.com/@lucky-office/js-excel@0.1.0/lib/index.umd.js"></script>
```
