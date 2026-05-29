# 更新日志（Changelog）

本项目所有重要变更都会记录在此文件中。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

> **从 v0.1.0 起，本仓库使用 [Changesets](https://github.com/changesets/changesets) 自动维护 changelog**：
> - 新版本由 `pnpm changeset` 命令记录改动 → push → 合并「Version Packages」PR 自动生成
> - **各 npm 包**的 changelog 由 changesets 自动写入对应包目录下的 `CHANGELOG.md`（如 [`core/packages/vue-excel/CHANGELOG.md`](./core/packages/vue-excel/CHANGELOG.md)）
> - 本文件为**仓库级**汇总 changelog，记录跨包影响、迁移指南等宏观信息（手工维护）

## [Unreleased]

> 还未发布的改动放在这里，发布时挪到下方对应版本号下。

### Added
- **Excel 渐进式转换可行性验证**（vue-excel / js-excel）
  - 新增可选的 `options.progressive`，开启后先转换首屏前 N 行供 `x-spreadsheet` 即时加载，剩余行按批次继续转换并在批次之间让出主线程
  - 提供 `initialRows / batchRows / onInitialDataReady / onProgress` 回调，便于观察首批 ready 与后续批次进度
  - 默认关闭，未传 `options.progressive` 时行为完全不变
- **解析阶段结构化错误日志**（vue-excel / js-excel）
  - `readExcelData` 在 `wb.xlsx.load(buffer)` 失败时输出 `[excel parse]` 前缀的结构化日志（`phase / name / message / elapsedMs / bufferLength / stack`），便于把解析阶段错误与后续转换/渲染阶段错误区分开

### Changed
- `core/package.json` 显式声明 workspace 依赖 `"@lucky-office/exceljs": "workspace:*"`，修复 Vite dev 因无法 resolve 而把 CJS 文件按原生 ESM 加载导致的
  `SyntaxError: The requested module '/packages/exceljs/lib/exceljs.browser.js' does not provide an export named 'default'` 问题

### Fixed
- **ExcelJS 解析阶段在"超多列 / 整列范围数据验证"输入下卡死或抛 `RangeError: Too many properties to enumerate`**
  - `lib/xlsx/xform/sheet/data-validations-xform.js`：单条 `sqref` 展开 cell 数超过阈值时，改为按原 sqref 字符串整体保存，不再逐 cell 落入 `model`
  - `lib/doc/worksheet.js`（`getColumn`）、`lib/doc/column.js`（`fromModel`）、`lib/doc/row.js`（`getCellEx` / `eachCell`）：跨极大列号时按 Excel 实际列上限 16384 防御，避免创建/枚举海量对象
  - 全部为"超阈值才生效"的防御性上限，未改变 ExcelJS 公共 API，对常规文件零影响

### Removed
-

---

## [0.1.0] - 2026-05-27

> 首次公开发布，基于 [vue-office](https://github.com/501351981/vue-office) 二次开发。

### Added
- 8 个 `@lucky-office/*` 包首次发布到 npm
  - `@lucky-office/exceljs`：ExcelJS fork（本地化）
  - `@lucky-office/excel`、`@lucky-office/docx`、`@lucky-office/pdf`、`@lucky-office/pptx`：Vue 3 预览组件
  - `@lucky-office/js-excel`、`@lucky-office/js-docx`、`@lucky-office/js-pdf`：框架无关预览库
- **OLE 附件交互**：vue-excel 扩展了 Excel 单元格内嵌入文件的卡片化渲染
  - 单击卡片：选中 / 取消选中
  - 选中态：并排显示「预览」「下载」按钮
  - 拖拽：在画布内移动卡片到新单元格
  - 「下载」：直接触发本地下载
  - 「预览」：触发 `attachment-preview` 事件，由宿主决定打开方式
- **`attachment-preview` 事件**：payload 包含 `{ url, name, extension, mimeType, previewType, attachment }`
  - `previewType` 自动识别为 `'excel' | 'docx' | 'pdf' | 'pptx' | null`
  - 宿主可基于 `previewType` 跳转到本仓库自身的预览路由
- **PreviewWrapper 路由参数支持**：演示项目读取 `route.query.url` 自动加载远端文件
- **一键发布脚本** [`core/script/publish-all.js`](./core/script/publish-all.js)：按依赖顺序串行 publish，支持 `--dry-run` / `--otp` / `--otp-prompt` / `--only` / `--skip-build`
- **GitHub Actions 自动发布**：tag `v*` 触发自动构建 + 发布到 npm
- 完整的中文文档：每个包的 `README.md`、顶层 [README.md](./README.md)、维护者向的 [`core/PUBLISHING.md`](./core/PUBLISHING.md)
- 各包补全 `LICENSE` 文件（保留上游 vue-office 署名）

### Changed
- **包名命名空间整体迁移**：`@vue-office/*` → `@lucky-office/*`，`@js-preview/*` → `@lucky-office/js-*`
- **仅支持 Vue 3**：移除 vue2 构建路径与 `@vue/composition-api` peer dependency，构建流水线精简
- **构建产物文件名**：UMD bundle 名从 `vue-office-*` 改为 `lucky-office-*`
- **包元信息**：`description` / `author` / `repository` / `homepage` / `bugs` / `keywords` 全部改为 lucky-office 与 zhangwenli
- **`copyReadme` 脚本**：改为 `cp README.md lib/README.md`（避免覆盖手写 README）

### Removed
- `@vue-office/*` 旧命名空间下的所有引用
- vue2 兼容代码（vite-plugin-vue2、isVue2 分支、build:2 / copyFile2 步骤）
- `vue-template-compiler`、`@vue/composition-api` 开发依赖
- 上游遗留的微信二维码、群二维码、赞赏码等图片资源
- 上游遗留的 Vue 2 示例项目 `demo-vue2/`
- 一次性测试脚本 `create-test-excel.js`
- 历史改造说明文档 `LUCKY-OFFICE-README.md`（已合并入 README.md）
- `pnpm-workspace.yaml` 中已废弃的 `packages/core/*` glob

### Fixed
- 修复 vue-excel 构建时 `vue-template-compiler@2.6.14` 与 `vue@3.2.45` 版本不匹配错误（移除 vue2 插件静态导入）
- 修复 `copyReadme` 脚本会用上游 `help.md` 覆盖本地 README 的隐患

---

## 链接

- [0.1.0]: https://github.com/ZERO-WL/lucky-office/releases/tag/v0.1.0
- [Unreleased]: https://github.com/ZERO-WL/lucky-office/compare/v0.1.0...HEAD
