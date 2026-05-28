const fs = require('fs');
const path = require('path');

console.log('[ExcelJS Auto Copy] 开始自动复制 ExcelJS 文件...');

// 获取项目根目录
const projectRoot = path.resolve(__dirname, '../');
const exceljsDistDir = path.resolve(projectRoot, 'packages/exceljs/dist');

// 目标位置列表（仅当目录存在或是 demo 项目本地预览需要的路径才复制）
const targetDirs = [
  path.resolve(projectRoot, 'public/static/exceljs')
];

// 需要复制的文件列表
const filesToCopy = [
  'exceljs.min.js',
  'exceljs.min.js.map',
  'exceljs.js',
  'exceljs.bare.min.js',
  'exceljs.bare.js'
];

// 确保目标目录存在
function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[ExcelJS Auto Copy] 创建目录: ${dir}`);
  }
}

// 复制单个文件
function copyFile(sourcePath, destPath) {
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`[ExcelJS Auto Copy] 复制成功: ${path.basename(sourcePath)} -> ${path.relative(projectRoot, destPath)}`);
    return true;
  } else {
    console.warn(`[ExcelJS Auto Copy] 文件不存在，跳过: ${path.basename(sourcePath)}`);
    return false;
  }
}

// 主复制函数
function copyExcelJSToTargets() {
  let successCount = 0;
  let totalFiles = 0;

  // 处理每个目标目录
  targetDirs.forEach((targetDir) => {
    ensureDirExists(targetDir);
    
    // 复制每个文件
    filesToCopy.forEach((fileName) => {
      totalFiles++;
      const sourcePath = path.join(exceljsDistDir, fileName);
      const destPath = path.join(targetDir, fileName);
      if (copyFile(sourcePath, destPath)) {
        successCount++;
      }
    });
  });

  console.log(`\n[ExcelJS Auto Copy] 完成！成功复制 ${successCount}/${totalFiles} 个文件`);
}

// 检查源目录是否存在
if (fs.existsSync(exceljsDistDir)) {
  copyExcelJSToTargets();
} else {
  console.warn(`[ExcelJS Auto Copy] 源目录不存在，跳过复制: ${exceljsDistDir}`);
  console.warn('[ExcelJS Auto Copy] （这通常发生在 CI 环境或 demo 项目本地预览未启用 ExcelJS 浏览器版时，可以忽略）');
  process.exit(0);
}
