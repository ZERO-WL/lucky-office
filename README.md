# Lucky-Office 🍀

> 基于 [vue-office](https://github.com/501351981/vue-office) 二次开发的 Office 文件预览解决方案。
> 使用 pnpm monorepo 管理，将 ExcelJS 本地化为工作区子包，并在 vue-excel 上扩展了 OLE 附件的卡片化交互（选中、拖拽、预览、下载）。

[![CI](https://github.com/ZERO-WL/lucky-office/actions/workflows/ci.yml/badge.svg)](https://github.com/ZERO-WL/lucky-office/actions/workflows/ci.yml)
[![Release](https://github.com/ZERO-WL/lucky-office/actions/workflows/release.yml/badge.svg)](https://github.com/ZERO-WL/lucky-office/actions/workflows/release.yml)
[![Deploy Pages](https://github.com/ZERO-WL/lucky-office/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ZERO-WL/lucky-office/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D14-blue.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D7-orange.svg)](https://pnpm.io/)

---

## 🌐 在线 Demo

> 演示站基于本仓库 `core/src/` 演示项目，由 GitHub Actions 自动部署到 GitHub Pages，永远跟 `main` 分支最新代码同步。

**入口**：[https://zero-wl.github.io/lucky-office/](https://zero-wl.github.io/lucky-office/)

| 包 | 路由 | 直链 |
|---|---|---|
| `@lucky-office/excel`（含 OLE 附件交互） | `#/excel` | [👉 打开](https://zero-wl.github.io/lucky-office/#/excel) |
| `@lucky-office/docx` | `#/docx` | [👉 打开](https://zero-wl.github.io/lucky-office/#/docx) |
| `@lucky-office/pdf` | `#/pdf` | [👉 打开](https://zero-wl.github.io/lucky-office/#/pdf) |
| `@lucky-office/pptx` | `#/pptx` | [👉 打开](https://zero-wl.github.io/lucky-office/#/pptx) |
| `@lucky-office/js-excel` | `#/js-excel` | [👉 打开](https://zero-wl.github.io/lucky-office/#/js-excel) |
| `@lucky-office/js-docx` | `#/js-docx` | [👉 打开](https://zero-wl.github.io/lucky-office/#/js-docx) |
| `@lucky-office/js-pdf` | `#/js-pdf` | [👉 打开](https://zero-wl.github.io/lucky-office/#/js-pdf) |

---

## ✨ 项目特点

- ✅ **本地化 ExcelJS**：源码内置在工作区，便于定制（已扩展 OLE 附件解析）
- ✅ **OLE 附件交互**：在 Excel 单元格内的嵌入文件以卡片渲染，支持选中 / 拖拽 / 预览 / 下载
- ✅ **跨预览路由**：附件点击「预览」会触发 `attachment-preview` 事件，可由示例项目跳到对应的 docx / pdf / pptx 路由
- ✅ **Vue 3 全量支持**：4 个 Vue 组件 + 3 个框架无关库，按需引用
- ✅ **TypeScript 支持**：每个包都自带 `index.d.ts`
- ✅ **跨平台构建**：所有构建脚本基于 `shx`，Windows / macOS / Linux 通用

---

## 📦 包列表

| npm 包 | 类型 | 说明 |
|---|---|---|
| [`@lucky-office/excel`](./core/packages/vue-excel) | Vue 3 组件 | Excel 预览，含 OLE 附件交互 |
| [`@lucky-office/docx`](./core/packages/vue-docx) | Vue 3 组件 | Word 预览（基于 docx-preview） |
| [`@lucky-office/pdf`](./core/packages/vue-pdf) | Vue 3 组件 | PDF 预览（基于 pdf.js） |
| [`@lucky-office/pptx`](./core/packages/vue-pptx) | Vue 3 组件 | PPT 预览 |
| [`@lucky-office/js-excel`](./core/packages/js-excel) | 框架无关 | Excel 预览，纯 JS / UMD |
| [`@lucky-office/js-docx`](./core/packages/js-docx) | 框架无关 | Word 预览，纯 JS / UMD |
| [`@lucky-office/js-pdf`](./core/packages/js-pdf) | 框架无关 | PDF 预览，纯 JS / UMD |
| [`@lucky-office/exceljs`](./core/packages/exceljs) | 内部依赖 | ExcelJS fork，被上面 excel 包传递依赖 |

---

## 🚀 快速使用

### 在你的项目中安装

```bash
# Vue 3 项目（以 Excel 预览为例）
pnpm add @lucky-office/excel

# 纯 JS 项目
pnpm add @lucky-office/js-excel
```

### Vue 3 示例

```vue
<script setup>
import VueOfficeExcel from '@lucky-office/excel';
import '@lucky-office/excel/lib/index.css';

const src = 'https://example.com/test.xlsx';

function onAttachmentPreview({ url, name, previewType }) {
  // 由宿主项目决定如何打开新标签页
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
    style="height: 100vh"
    @rendered="() => console.log('渲染完成')"
    @error="(e) => console.error('渲染失败', e)"
    @attachment-preview="onAttachmentPreview"
  />
</template>
```

### 纯 JS 示例

```js
import jsPreviewExcel from '@lucky-office/js-excel';
import '@lucky-office/js-excel/lib/index.css';

const previewer = jsPreviewExcel.init(document.getElementById('preview'));
previewer.preview('https://example.com/test.xlsx').then(() => {
  console.log('渲染完成');
});
```

> 各包详细 API 文档见对应包的 README。

---

## 🛠 本地开发

### 环境要求

- Node.js >= 14
- pnpm >= 7

### 克隆与安装

```bash
git clone git@github.com:ZERO-WL/lucky-office.git
cd lucky-office
pnpm install
```

### 项目结构

```
lucky-office/
├── core/                          # 工作区根（包源码与示例项目都在这里）
│   ├── packages/                  # pnpm workspace 子包
│   │   ├── exceljs/               # @lucky-office/exceljs（ExcelJS fork）
│   │   ├── vue-excel/             # @lucky-office/excel
│   │   ├── vue-docx/              # @lucky-office/docx
│   │   ├── vue-pdf/               # @lucky-office/pdf
│   │   ├── vue-pptx/              # @lucky-office/pptx
│   │   ├── js-excel/              # @lucky-office/js-excel
│   │   ├── js-docx/               # @lucky-office/js-docx
│   │   └── js-pdf/                # @lucky-office/js-pdf
│   ├── src/                       # 示例项目源码（演示各包用法）
│   ├── script/                    # 构建 / 发布脚本
│   ├── PUBLISHING.md              # ⭐ 发布到 npm 的完整说明（仅维护者关心）
│   └── package.json
├── demo-cdn/                      # 通过 unpkg CDN 引用 @lucky-office/js-* 的最简 HTML 示例
├── pnpm-workspace.yaml
├── LICENSE
└── README.md                      # 本文档
```

### 启动示例项目（演示所有预览功能）

```bash
cd lucky-office/core
pnpm run dev
```

浏览器打开 `http://localhost:5173/vue-office/examples/dist/`。

### 构建所有包

```bash
cd lucky-office/core
pnpm run lib                  # 构建所有 @lucky-office/* 包
pnpm run lib:vue-excel        # 单独构建某个包
```

构建产物输出到各包的 `lib/` 目录。

---

## 📤 发布到 npm

> **维护者向**：完整的发布操作指南、Token 配置说明、版本管理建议见 [`core/PUBLISHING.md`](./core/PUBLISHING.md)。

本仓库使用 [Changesets](https://github.com/changesets/changesets) 管理版本与 changelog，**版本号自动化由 CI 维护，发布动作由维护者手动执行**（更可控）。

### 流程

```bash
# 1. 写代码、写 changeset 描述本次变更
pnpm changeset

# 2. 把 .changeset/*.md 和代码改动一起提交
git add .
git commit -m "feat: ..."
git push
```

Push 后 [Release workflow](./.github/workflows/release.yml) 自动开「**Version Packages**」PR，里面包含 bump 后的 `version` 和生成的 `CHANGELOG.md`。

### 手动发布步骤（仅维护者）

合并 Version PR 后，由维护者本地执行：

```bash
# 1. 拉到最新的 main
git pull

# 2. 登录 npm（一次即可，session 保存在 ~/.npmrc）
npm login

# 3. 一键发布所有未发布的版本（含构建）
pnpm run publish:npm
```

> ✅ 这条命令会跑 `pnpm -C core run lib` 构建 8 个包，然后用 `changeset publish` 按依赖顺序逐个发到 npm，并自动打 git tag。

### 为什么不走 CI 自动发包？

简短答：踩坑成本太高，本地手动发反而更稳定。

详细见 [`core/PUBLISHING.md`](./core/PUBLISHING.md)。简要原因：
- npm Granular Token 在 monorepo + 首次发布场景有"伪装成 404"的 ACL bug
- Classic Automation Token 已被 npm 逐步下线
- OIDC Trusted Publisher 需要对**每个**包单独配置 + Workflow / repo 完全对齐，配置一处错全失败
- 本地 `npm login` 走的是用户级 session，最稳定、零配置

## 📜 更新日志

每次发版的详细变更记录在 [CHANGELOG.md](./CHANGELOG.md)。

---

## ❓ 常见问题

### 这和 vue-office 有什么区别？

- **包名**：`@vue-office/*` → `@lucky-office/*`
- **包数量**：新增 `@lucky-office/exceljs`（本地化 ExcelJS）
- **OLE 附件**：vue-excel 扩展了 OLE 对象的卡片化交互（拖拽 / 选中 / 预览 / 下载）
- **附件预览路由**：新增 `attachment-preview` 事件，宿主可跳转到本仓库自身的 docx / pdf / pptx 预览页
- **Vue 版本**：仅支持 Vue 3（vue-office 同时支持 Vue 2/3）

### 是否兼容 Vue 2？

不兼容。如需 Vue 2 请使用上游 [vue-office](https://github.com/501351981/vue-office)。

### 为什么要 fork ExcelJS？

为了在 OLE 解析层面增加自定义逻辑（提取附件 buffer、文件名等），上游 ExcelJS 的封闭性使得我们必须直接维护源码。

---

## 🤝 致谢

- 上游项目 [vue-office](https://github.com/501351981/vue-office) by [501351981](https://github.com/501351981)
- [ExcelJS](https://github.com/exceljs/exceljs) by Guyon Roche
- [docx-preview](https://github.com/VolodymyrBaydalka/docxjs)、[pdf.js](https://mozilla.github.io/pdf.js/) 等优秀社区项目

---

## 📄 License

[MIT](./LICENSE) © 2026 zhangwenli

本项目派生自 vue-office (MIT License)，保留并感谢原作者署名。
