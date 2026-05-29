# @lucky-office/js-excel

## 0.3.0

### Minor Changes

- [`9183a47`](https://github.com/ZERO-WL/lucky-office/commit/9183a47ae1aa7f5659603d15fed99edd871cdd8a) Thanks [@ZERO-WL](https://github.com/ZERO-WL)! - **ExcelJS 解析阶段鲁棒性 + Excel 渐进式转换可行性验证**

  - `@lucky-office/exceljs`

    - 修复在含"整列范围"数据验证（如 `sqref="A2:A1048576"`）的工作簿上，`xlsx.load()` 长时间卡死或抛出 `RangeError: Too many properties to enumerate` 的问题。
      [`data-validations-xform.js`](core/packages/exceljs/lib/xlsx/xform/sheet/data-validations-xform.js) 在单条 `sqref` 展开 cell 数超过阈值时改为按原 sqref 字符串整体保存，不再逐 cell 落入 `model`。
    - 在 `lib/doc/worksheet.js`、`lib/doc/column.js`、`lib/doc/row.js` 中对 `getColumn` / `Column.fromModel` / `Row.getCellEx` / `Row.eachCell` 增加 Excel 实际列上限（16384）防御，避免跨极大列号时创建/枚举海量对象。
    - 修复点都是"超阈值才生效"的防御性上限，未改变公共 API，对常规文件零影响。

  - `@lucky-office/excel`（vue-excel）

    - 新增可选的 `options.progressive` 渐进式转换路径：先把首屏前 N 行交给 `x-spreadsheet` 渲染，剩余行按批次继续转换并在批次间让出主线程，避免大文件转换阶段阻塞主线程。
    - 默认关闭，未传 `options.progressive` 时行为完全不变。
    - 解析阶段失败时输出包含 `[excel parse]` 前缀的结构化错误日志（`phase / name / message / elapsedMs / bufferLength / stack`），便于区分解析阶段错误与后续转换/渲染阶段错误；保留原 `@error` / Promise reject 行为。

  - `@lucky-office/js-excel`
    - 同步新增 `options.progressive` 渐进式转换路径，参数与回调命名与 vue-excel 对齐。
    - 默认关闭，未传 `options.progressive` 时行为完全不变。

### Patch Changes

- Updated dependencies [[`9183a47`](https://github.com/ZERO-WL/lucky-office/commit/9183a47ae1aa7f5659603d15fed99edd871cdd8a)]:
  - @lucky-office/exceljs@0.3.0

## 0.2.0

### Minor Changes

- [`b4af79c`](https://github.com/ZERO-WL/lucky-office/commit/b4af79cc9ebddffd233c8cc363e21846319c9d89) Thanks [@ZERO-WL](https://github.com/ZERO-WL)! - 首次公开发布：基于 vue-office 二次开发的 Office 文件预览解决方案。

  - 包名命名空间从 `@vue-office/*` 迁移为 `@lucky-office/*`
  - vue-excel 扩展 OLE 附件交互（卡片渲染、选中、拖拽、预览、下载）
  - 新增 `attachment-preview` 事件，便于宿主跳转到本仓库的 docx/pdf/pptx 预览路由
  - 仅支持 Vue 3，构建流水线精简

### Patch Changes

- Updated dependencies [[`b4af79c`](https://github.com/ZERO-WL/lucky-office/commit/b4af79cc9ebddffd233c8cc363e21846319c9d89)]:
  - @lucky-office/exceljs@0.2.0
