# @lucky-office/exceljs

> ExcelJS 的独立维护版本，用于 lucky-office（基于 [vue-office](https://github.com/501351981/vue-office) 二次开发）项目的 Excel 文件解析。

## 🌐 在线 Demo

本包作为底层依赖，无独立 demo。可通过其上层消费方查看效果：

- [`@lucky-office/excel`](https://zero-wl.github.io/lucky-office/#/excel)（Vue 3 Excel 预览组件）
- [`@lucky-office/js-excel`](https://zero-wl.github.io/lucky-office/#/js-excel)（框架无关 Excel 预览库）

> 演示站默认加载一个带 OLE 嵌入附件的样例 xlsx，能直观看到本 fork 增强后的 OLE 解析能力。

## 说明

此包是 [ExcelJS](https://github.com/exceljs/exceljs) 的 fork 版本，已整合到 lucky-office 项目的 pnpm monorepo 工作区中进行独立维护。

## 与原版的区别

- **包名**: 从 `exceljs` 改为 `@lucky-office/exceljs`
- **维护方式**: 作为 lucky-office monorepo 的一部分进行独立维护
- **依赖管理**: 使用 pnpm workspace 协议进行内部依赖链接
- **解析鲁棒性增强（针对"超多列 / 整列范围数据验证"场景）**
  - [`lib/xlsx/xform/sheet/data-validations-xform.js`](./lib/xlsx/xform/sheet/data-validations-xform.js)：当单条 `sqref` 展开 cell 数超过阈值（如 `A2:A1048576` 这类整列范围）时，改为按原 sqref 字符串整体保存，不再逐 cell 落入 `model`，避免触发 V8 `RangeError: Too many properties to enumerate` 或长时间卡死
  - [`lib/doc/worksheet.js`](./lib/doc/worksheet.js)（`getColumn`）、[`lib/doc/column.js`](./lib/doc/column.js)（`fromModel`）、[`lib/doc/row.js`](./lib/doc/row.js)（`getCellEx` / `eachCell`）：跨极大列号时按 Excel 实际列上限 16384 防御，避免创建/枚举海量对象
  - 全部为"超阈值才生效"的防御性上限，未改变公共 API，对常规文件零影响

## 安装

```bash
npm install @lucky-office/exceljs
```

或在 monorepo 中使用 workspace 协议：

```json
{
  "dependencies": {
    "@lucky-office/exceljs": "workspace:*"
  }
}
```

## 使用

与原 ExcelJS 完全兼容：

```javascript
const ExcelJS = require('@lucky-office/exceljs');

// 创建工作簿
const workbook = new ExcelJS.Workbook();

// 添加工作表
const worksheet = workbook.addWorksheet('Sheet 1');

// 写入单元格
worksheet.getCell('A1').value = 'Hello, World!';

// 保存文件
workbook.xlsx.writeFile('example.xlsx');
```

## 文档

完整文档请参考原版 ExcelJS 文档：
- [英文文档](https://github.com/exceljs/exceljs/blob/master/README.md)
- [中文文档](https://github.com/exceljs/exceljs/blob/master/README_zh.md)

## 许可证

MIT
