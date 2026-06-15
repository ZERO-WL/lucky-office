/**
 * OLE对象下载工具
 */

/**
 * 下载OLE对象
 * @param {Object} attachment - 附件对象
 */
export function downloadOLEObject(attachment) {
  console.log('[OLE-Downloader] 开始下载OLE对象:', attachment);
  
  const parsed = attachment.parsed || {};
  const buffer = parsed.fileData || parsed.buffer || attachment.fileData || attachment.buffer;
  
  if (!buffer) {
    console.error('[OLE-Downloader] 没有可用的buffer');
    alert('无法下载：没有可用的数据');
    return;
  }
  
  let fileName = parsed.shortFilename || parsed.originalName || attachment.name || 'attachment';
  const fileNameExtension = getExtensionFromFileName(fileName);
  let extension = normalizeExtension(parsed.extension || parsed.fileType || attachment.extension || fileNameExtension || 'bin');
  if (isGenericExtension(extension) && fileNameExtension) {
    extension = fileNameExtension;
  }
  const bufferExtension = detectExtensionFromBuffer(buffer);
  
  if (shouldUseBufferExtension(extension, bufferExtension, fileName)) {
    extension = bufferExtension;
  }
  
  fileName = normalizeFileName(fileName, extension);
  
  console.log('[OLE-Downloader] 文件名:', fileName, 'MIME:', getMimeType(extension));
  
  downloadBufferAsFile(buffer, fileName, getMimeType(extension));
}

/**
 * 将Buffer下载为文件
 * @param {Buffer|ArrayBuffer} buffer - 文件数据
 * @param {string} fileName - 文件名
 * @param {string} mimeType - MIME类型
 */
export function downloadBufferAsFile(buffer, fileName, mimeType = 'application/octet-stream') {
  const bytes = toUint8Array(buffer);
  
  if (!bytes || !bytes.length) {
    console.error('[OLE-Downloader] buffer为空');
    alert('无法下载：文件数据为空');
    return;
  }
  
  const blob = new Blob([bytes], { type: mimeType });
  
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

function toUint8Array(buffer) {
  if (!buffer) return null;
  if (buffer instanceof Uint8Array) return buffer;
  if (buffer instanceof ArrayBuffer) return new Uint8Array(buffer);
  if (Array.isArray(buffer)) return new Uint8Array(buffer);
  if (buffer.buffer instanceof ArrayBuffer && typeof buffer.byteOffset === 'number' && typeof buffer.byteLength === 'number') {
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  }
  if (typeof buffer.length === 'number') {
    const bytes = new Uint8Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      bytes[i] = buffer[i] & 0xff;
    }
    return bytes;
  }
  return null;
}

function normalizeExtension(extension) {
  return String(extension || 'bin').split('?')[0].split('#')[0].replace(/^\.+/, '').toLowerCase() || 'bin';
}

function getExtensionFromFileName(fileName) {
  const name = String(fileName || '').split(/[\\/]/).pop();
  const dotIndex = name.lastIndexOf('.');
  if (dotIndex <= 0 || dotIndex === name.length - 1) return '';
  return normalizeExtension(name.slice(dotIndex + 1));
}

function isGenericExtension(extension) {
  return !extension || extension === 'bin' || extension === 'ole' || extension === 'package' || extension === 'unknown' || extension === 'zip';
}

function normalizeFileName(fileName, extension) {
  const ext = normalizeExtension(extension);
  const currentExt = getExtensionFromFileName(fileName);
  if (!currentExt) return fileName + '.' + ext;
  if (currentExt === ext) return fileName;
  if (isGenericExtension(currentExt)) return fileName.slice(0, -(currentExt.length + 1)) + '.' + ext;
  return fileName;
}

function shouldUseBufferExtension(extension, bufferExtension, fileName) {
  if (!bufferExtension) return false;
  const ext = normalizeExtension(extension);
  const bufferExt = normalizeExtension(bufferExtension);
  const nameExt = getExtensionFromFileName(fileName);
  if (ext === bufferExt) return false;
  if ((ext === 'docx' || ext === 'pdf') && (bufferExt === 'zip' || isGenericExtension(bufferExt))) return false;
  if (isGenericExtension(ext)) return true;
  if (nameExt && normalizeExtension(nameExt) === ext) return false;
  return bufferExt === 'xlsx' || bufferExt === 'docx' || bufferExt === 'pdf' || bufferExt === 'pptx';
}

function detectExtensionFromBuffer(buffer) {
  const bytes = toUint8Array(buffer);
  if (!bytes || bytes.length < 4) return '';
  if (matchesSignature(bytes, [0x25, 0x50, 0x44, 0x46])) return 'pdf';
  if (matchesSignature(bytes, [0x50, 0x4B, 0x03, 0x04])) return detectOfficeExtensionFromZip(bytes) || 'zip';
  if (matchesSignature(bytes, [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])) return 'ole';
  return '';
}

function matchesSignature(bytes, signature) {
  if (bytes.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) return false;
  }
  return true;
}

function detectOfficeExtensionFromZip(bytes) {
  const searchLength = Math.min(bytes.length, 20000);
  if (containsPattern(bytes, [0x78, 0x6C, 0x2F], searchLength)) return 'xlsx';
  if (containsPattern(bytes, [0x77, 0x6F, 0x72, 0x64, 0x2F], searchLength)) return 'docx';
  if (containsPattern(bytes, [0x70, 0x70, 0x74, 0x2F], searchLength)) return 'pptx';
  return '';
}

function containsPattern(bytes, pattern, searchLength) {
  for (let i = 0; i <= searchLength - pattern.length; i++) {
    let matched = true;
    for (let j = 0; j < pattern.length; j++) {
      if (bytes[i + j] !== pattern[j]) {
        matched = false;
        break;
      }
    }
    if (matched) return true;
  }
  return false;
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
  
  const ext = normalizeExtension(extension);
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
