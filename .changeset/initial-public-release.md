---
"@lucky-office/exceljs": minor
"@lucky-office/excel": minor
"@lucky-office/docx": minor
"@lucky-office/pdf": minor
"@lucky-office/pptx": minor
"@lucky-office/js-excel": minor
"@lucky-office/js-docx": minor
"@lucky-office/js-pdf": minor
---

首次公开发布：基于 vue-office 二次开发的 Office 文件预览解决方案。

- 包名命名空间从 `@vue-office/*` 迁移为 `@lucky-office/*`
- vue-excel 扩展 OLE 附件交互（卡片渲染、选中、拖拽、预览、下载）
- 新增 `attachment-preview` 事件，便于宿主跳转到本仓库的 docx/pdf/pptx 预览路由
- 仅支持 Vue 3，构建流水线精简
