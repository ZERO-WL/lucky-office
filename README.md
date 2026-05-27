# Lucky-Office 🍀

基于 [vue-office](https://github.com/501351981/vue-office) 二次开发的 Office 文件预览解决方案，使用 pnpm monorepo 管理本地化的 exceljs 依赖。

## 项目特点

- ✅ **本地化依赖**：ExcelJS 源码直接托管在项目中，无需依赖外部 npm registry
- ✅ **pnpm Monorepo**：高效的 monorepo 依赖管理，统一使用 pnpm workspace
- ✅ **跨平台支持**：Windows / macOS / Linux 全平台兼容
- ✅ **Vue 2/3 兼容**：支持 Vue 2 和 Vue 3 双版本
- ✅ **TypeScript 支持**：完整的类型定义

## 项目结构

```
lucky-office/
├── core/                           # 核心项目目录
│   ├── packages/                   # pnpm workspace 包目录
│   │   ├── exceljs/               # 本地化的 ExcelJS v4.4.0 (@lucky-office/exceljs)
│   │   ├── vue-excel/             # Vue Excel 预览组件 (@lucky-office/excel)
│   │   ├── js-excel/              # JS Excel 预览库 (@lucky-office/js-excel)
│   │   ├── vue-docx/              # Vue Word 预览组件 (@lucky-office/docx)
│   │   ├── js-docx/               # JS Word 预览库 (@lucky-office/js-docx)
│   │   ├── vue-pdf/               # Vue PDF 预览组件 (@lucky-office/pdf)
│   │   ├── js-pdf/                # JS PDF 预览库 (@lucky-office/js-pdf)
│   │   └── vue-pptx/              # Vue PPT 预览组件 (@lucky-office/pptx)
│   ├── package.json               # pnpm workspace 配置
│   └── .npmrc                     # pnpm 配置
├── demo-vue3/                      # Vue 3 示例项目
└── examples/                       # 更多示例
```

## 快速开始

### 环境要求

- Node.js >= 14
- pnpm >= 7

### 安装依赖

```bash
# 进入项目目录
cd lucky-office/core

# 安装所有依赖
pnpm install
```

### 构建核心包

```bash
# 构建所有包
pnpm run lib

# 或单独构建某个包
pnpm run lib:vue-excel
pnpm run lib:js-excel
```

### 运行开发服务器

```bash
cd lucky-office/core
pnpm run dev
```

## 使用示例

### Vue 3 中使用 Excel 预览

```vue
<template>
  <vue-office-excel :src="excelUrl" />
</template>

<script setup>
import VueOfficeExcel from '@lucky-office/excel'

const excelUrl = 'https://example.com/file.xlsx'
</script>
```

### 纯 JavaScript 中使用

```javascript
import { renderExcel } from '@lucky-office/js-excel'

renderExcel('#container', 'https://example.com/file.xlsx')
```

## 技术实现

### pnpm Workspace 配置

```json
// core/package.json
{
  "workspaces": [
    "packages/*"
  ]
}
```

### ExcelJS 本地化引用

```json
// core/packages/vue-excel/package.json
{
  "dependencies": {
    "@lucky-office/exceljs": "workspace:*"  // 引用本地包
  }
}
```

## 构建脚本跨平台兼容

所有包的构建脚本已使用 `shx` 进行跨平台兼容：

```json
{
  "scripts": {
    "clean": "shx rm -rf lib",
    "copy": "shx cp -r src/file lib/"
  },
  "devDependencies": {
    "shx": "^0.3.4"
  }
}
```

## 已完成的改造

### ✅ 阶段 1：ExcelJS 源码迁移
- [x] 将 ExcelJS 源码从 `packages/core/exceljs` 迁移到 `core/packages/exceljs`
- [x] 修改包名为 `@lucky-office/exceljs`
- [x] 修复依赖版本问题（grunt-exorcise）

### ✅ 阶段 2：pnpm Monorepo 配置
- [x] 配置 pnpm workspace
- [x] 更新 vue-excel 和 js-excel 的依赖引用
- [x] 更新构建脚本使用 pnpm filter
- [x] 配置 `.npmrc` 文件

### ✅ 阶段 3：清理旧目录
- [x] 删除旧的 `packages/core/exceljs` 目录

### ✅ 阶段 4：包名命名空间统一
- [x] 将 `@vue-office/*` 命名空间整体迁移为 `@lucky-office/*`

## 常见问题

### Q: 如何更新 ExcelJS 版本？
A: 直接替换 `core/packages/exceljs/` 目录下的源码，然后重新安装依赖。

### Q: Windows 下构建失败怎么办？
A: 确保已安装 `shx` 依赖，所有构建脚本已配置为跨平台兼容。

### Q: 如何添加新的 workspace 包？
A: 在 `core/packages/` 目录下创建新包，并在 `package.json` 中配置正确的包名。

## 相关链接

- [vue-office 原始项目](https://github.com/501351981/vue-office)
- [ExcelJS 官方文档](https://github.com/exceljs/exceljs)
- [pnpm Workspace 文档](https://pnpm.io/workspaces)

## License

MIT
