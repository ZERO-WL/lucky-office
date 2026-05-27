/**
 * OLE对象下载工具
 */

/**
 * 下载OLE对象
 * @param {Object} attachment - 附件对象
 */
export function downloadOLEObject(attachment) {
  console.log('[OLE-Downloader] 开始下载OLE对象:', attachment);
  
  // 确定要下载的buffer
  let buffer = null;
  let extension = attachment.extension || 'bin';
  
  // 优先使用OLE解析后的数据
  if (attachment.isOLE && attachment.parsed) {
    buffer = attachment.parsed.buffer;
    if (attachment.parsed.extension) {
      extension = attachment.parsed.extension;
    }
  } else {
    buffer = attachment.buffer;
  }
  
  if (!buffer) {
    console.error('[OLE-Downloader] 没有可用的buffer');
    alert('无法下载：没有可用的数据');
    return;
  }
  
  // 构造文件名
  let fileName = attachment.name || 'attachment';
  // 确保文件名有正确的扩展名
  if (!fileName.includes('.')) {
    fileName = fileName + '.' + extension;
  }
  
  console.log('[OLE-Downloader] 文件名:', fileName);
  
  // 下载文件
  downloadBufferAsFile(buffer, fileName, getMimeType(extension));
}

/**
 * 将Buffer下载为文件
 * @param {Buffer|ArrayBuffer} buffer - 文件数据
 * @param {string} fileName - 文件名
 * @param {string} mimeType - MIME类型
 */
export function downloadBufferAsFile(buffer, fileName, mimeType = 'application/octet-stream') {
  // 创建Blob对象
  let blob;
  
  if (buffer instanceof ArrayBuffer) {
    blob = new Blob([buffer], { type: mimeType });
  } else if (buffer instanceof Uint8Array) {
    blob = new Blob([buffer], { type: mimeType });
  } else {
    // 假设是Node.js Buffer
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    blob = new Blob([arrayBuffer], { type: mimeType });
  }
  
  // 创建下载链接
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  
  // 触发下载
  a.click();
  
  // 清理
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
  
  console.log('[OLE-Downloader] 文件已触发下载');
}

/**
 * 根据扩展名获取MIME类型
 * @param {string} extension - 文件扩展名
 */
export function getMimeType(extension) {
  const mimeTypeMap = {
    // Office文档
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'ppt': 'application/vnd.ms-powerpoint',
    'pdf': 'application/pdf',
    
    // 压缩文件
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    'gz': 'application/gzip',
    
    // 图片
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    
    // 文本
    'txt': 'text/plain',
    'csv': 'text/csv',
    'json': 'application/json',
    'xml': 'application/xml',
    
    // 其他
    'bin': 'application/octet-stream',
    'ole': 'application/x-oleobject'
  };
  
  const ext = extension.toLowerCase();
  return mimeTypeMap[ext] || 'application/octet-stream';
}

/**
 * 获取文件大小的可读格式
 * @param {number} bytes - 字节数
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
