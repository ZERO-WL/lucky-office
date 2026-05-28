const CFB = require('cfb');

const PROGID_TO_TYPE = {
  'Excel.Sheet.12': 'xlsx',
  'Excel.Sheet.8': 'xls',
  'Word.Document.12': 'docx',
  'Word.Document.8': 'doc',
  'PowerPoint.Show.12': 'pptx',
  'PowerPoint.Show.8': 'ppt',
  'AcroExch.Document.7': 'pdf',
  'AcroExch.Document.11': 'pdf',
  'Package': 'package',
};

function findFileSignatureInBuffer(buf, startOffset) {
  // 在 buffer 中搜索常见的文件签名，找到真实文件起始位置
  const sigs = [
    { sig: [0x25, 0x50, 0x44, 0x46], ext: 'pdf' },          // PDF: %PDF
    { sig: [0x50, 0x4B, 0x03, 0x04], ext: 'zip' },          // ZIP/Office
    { sig: [0xFF, 0xD8, 0xFF], ext: 'jpg' },                // JPEG
    { sig: [0x89, 0x50, 0x4E, 0x47], ext: 'png' },          // PNG
    { sig: [0x47, 0x49, 0x46, 0x38], ext: 'gif' },          // GIF
    { sig: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], ext: 'ole' }, // OLE
    { sig: [0x52, 0x61, 0x72, 0x21], ext: 'rar' },          // RAR
  ];
  
  for (let i = startOffset; i < buf.length - 8; i++) {
    for (const { sig, ext } of sigs) {
      let match = true;
      for (let j = 0; j < sig.length; j++) {
        if (buf[i + j] !== sig[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        return { offset: i, ext };
      }
    }
  }
  return null;
}

function parseOle10Native(data) {
  if (!data || data.length < 8) {
    console.log('[OLEParser] parseOle10Native: 数据太短');
    return null;
  }

  const buf = Buffer.from(data);
  console.log('[OLEParser] parseOle10Native: 总长度=', buf.length, '前16字节hex:',
    Array.from(buf.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' '));
  
  // Ole10Native 格式:
  //   4字节: 数据总长度
  //   2字节: header type (0x0002)
  //   变长: 短文件名 (ANSI, null-terminated)
  //   变长: 原始路径 (ANSI, null-terminated)
  //   ... 元数据 ...
  //   真实文件数据
  
  let offset = 4;
  if (offset + 2 > buf.length) return null;
  offset += 2;

  let shortFilename = '';
  let originalPath = '';

  try {
    // 短文件名 (null-terminated ANSI)
    const nameEnd = buf.indexOf(0x00, offset);
    if (nameEnd !== -1 && nameEnd < offset + 260) {
      shortFilename = buf.slice(offset, nameEnd).toString('latin1');
      offset = nameEnd + 1;
      console.log('[OLEParser] parseOle10Native: 短文件名=', shortFilename);
    }

    // 原始路径 (null-terminated ANSI)
    const pathEnd = buf.indexOf(0x00, offset);
    if (pathEnd !== -1 && pathEnd < offset + 1024) {
      originalPath = buf.slice(offset, pathEnd).toString('latin1');
      offset = pathEnd + 1;
      console.log('[OLEParser] parseOle10Native: 原始路径=', originalPath);
    }

    // 直接搜索文件签名找到真实文件数据起点
    const found = findFileSignatureInBuffer(buf, offset);
    let fileData;
    
    if (found) {
      console.log('[OLEParser] parseOle10Native: 找到文件签名', found.ext, 'at offset=', found.offset);
      // 在找到的签名前，向前查找4字节文件大小（紧邻签名前的4字节）
      let dataStart = found.offset;
      // 文件大小在数据起始前 4 字节
      const sizeOffset = dataStart - 4;
      if (sizeOffset >= 0) {
        const fileSize = buf.readUInt32LE(sizeOffset);
        const remaining = buf.length - dataStart;
        if (fileSize > 0 && fileSize <= remaining) {
          fileData = buf.slice(dataStart, dataStart + fileSize);
          console.log('[OLEParser] parseOle10Native: 使用记录的文件大小=', fileSize);
        } else {
          fileData = buf.slice(dataStart);
          console.log('[OLEParser] parseOle10Native: 文件大小记录无效，使用剩余数据=', fileData.length);
        }
      } else {
        fileData = buf.slice(dataStart);
      }
    } else {
      console.log('[OLEParser] parseOle10Native: 未找到已知文件签名，使用偏移后数据');
      // 跳过 8 字节保留 + 4 字节路径长度（尝试常规偏移）
      offset += 8;
      if (offset + 4 <= buf.length) {
        const pathLen = buf.readUInt32LE(offset);
        offset += 4;
        if (pathLen > 0 && pathLen < buf.length - offset - 4) {
          offset += pathLen;
        }
      }
      if (offset + 4 <= buf.length) {
        const fileSize = buf.readUInt32LE(offset);
        offset += 4;
        if (fileSize > 0 && fileSize <= buf.length - offset) {
          fileData = buf.slice(offset, offset + fileSize);
        } else {
          fileData = buf.slice(offset);
        }
      } else {
        fileData = buf.slice(offset);
      }
    }

    console.log('[OLEParser] parseOle10Native: 提取fileData大小=', fileData.length, '前4字节:',
      Array.from(fileData.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' '));

    return {
      shortFilename,
      originalPath,
      fullPath: '',
      fileSize: fileData.length,
      fileData,
    };
  } catch (e) {
    console.warn('[OLEParser] parseOle10Native 异常:', e.message);
    return null;
  }
}

function detectFileTypeFromBuffer(buffer) {
  if (!buffer || buffer.length < 4) return 'unknown';

  const signatures = [
    { sig: [0x25, 0x50, 0x44, 0x46], ext: 'pdf' },
    { sig: [0x50, 0x4B, 0x03, 0x04], ext: 'zip' },
    { sig: [0xFF, 0xD8, 0xFF], ext: 'jpg' },
    { sig: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], ext: 'png' },
    { sig: [0x47, 0x49, 0x46, 0x38], ext: 'gif' },
    { sig: [0x42, 0x4D], ext: 'bmp' },
    { sig: [0x52, 0x61, 0x72, 0x21], ext: 'rar' },
    { sig: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C], ext: '7z' },
  ];

  for (const { sig, ext } of signatures) {
    let match = true;
    for (let i = 0; i < sig.length; i++) {
      if (i >= buffer.length || buffer[i] !== sig[i]) {
        match = false;
        break;
      }
    }
    if (match) {
      if (ext === 'zip') {
        return detectOfficeFromZip(buffer);
      }
      return ext;
    }
  }
  return 'unknown';
}

function detectOfficeFromZip(buffer) {
  const searchLen = Math.min(buffer.length, 5000);
  for (let i = 0; i < searchLen - 4; i++) {
    if (buffer[i] === 0x78 && buffer[i+1] === 0x6C && buffer[i+2] === 0x2F) return 'xlsx';
    if (buffer[i] === 0x77 && buffer[i+1] === 0x6F && buffer[i+2] === 0x72 && buffer[i+3] === 0x64 && buffer[i+4] === 0x2F) return 'docx';
    if (buffer[i] === 0x70 && buffer[i+1] === 0x70 && buffer[i+2] === 0x74 && buffer[i+3] === 0x2F) return 'pptx';
  }
  return 'zip';
}

function streamToBuffer(stream) {
  // CFB stream entry has 'content' property
  if (!stream) return null;
  if (Buffer.isBuffer(stream)) return stream;
  if (stream instanceof Uint8Array) {
    return Buffer.from(stream);
  }
  
  // 优先处理 content 属性
  let c = stream.content !== undefined ? stream.content : stream;
  
  if (Buffer.isBuffer(c)) return c;
  if (c instanceof Uint8Array) {
    return Buffer.from(c.buffer, c.byteOffset, c.byteLength);
  }
  if (typeof c === 'string') {
    return Buffer.from(c, 'binary');
  }
  // 类数组对象（包括Array和CFB可能返回的特殊类型）
  if (typeof c === 'object' && typeof c.length === 'number') {
    console.log('[OLEParser] streamToBuffer: 类数组对象, length=', c.length);
    const buf = Buffer.allocUnsafe(c.length);
    for (let i = 0; i < c.length; i++) {
      buf[i] = c[i] & 0xff;
    }
    return buf;
  }
  return null;
}

function parseOLEObject(buffer, progId) {
  console.log('[OLEParser] 开始解析OLE对象, buffer大小:', buffer.length, 'progId:', progId);

  const progIdType = PROGID_TO_TYPE[progId];
  console.log('[OLEParser] progId映射类型:', progIdType);

  if (!isCFB(buffer)) {
    console.log('[OLEParser] 非CFB格式，直接检测文件签名');
    const fileType = detectFileTypeFromBuffer(buffer);
    return {
      fileType: fileType !== 'unknown' ? fileType : (progIdType || 'unknown'),
      extension: fileType !== 'unknown' ? fileType : (progIdType || 'bin'),
      fileData: buffer,
      shortFilename: null,
      originalPath: null,
    };
  }

  try {
    const cfbData = CFB.read(buffer, { type: 'buffer' });
    console.log('[OLEParser] CFB解析成功, 文件列表:', cfbData.FileIndex.map(f => f.name));

    const ole10Entry = CFB.find(cfbData, '\x01Ole10Native');
    if (ole10Entry) {
      console.log('[OLEParser] 找到Ole10Native流, content type:', typeof ole10Entry.content, 'length:', ole10Entry.content && ole10Entry.content.length);
      const streamBuf = streamToBuffer(ole10Entry);
      if (streamBuf) {
        const nativeResult = parseOle10Native(streamBuf);
        if (nativeResult) {
          console.log('[OLEParser] Ole10Native解析成功:', {
            shortFilename: nativeResult.shortFilename,
            fileSize: nativeResult.fileSize,
          });
          const realFileType = detectFileTypeFromBuffer(nativeResult.fileData);
          return {
            fileType: realFileType !== 'unknown' ? realFileType : (progIdType || 'unknown'),
            extension: realFileType !== 'unknown' ? realFileType : (progIdType || 'bin'),
            fileData: nativeResult.fileData,
            shortFilename: nativeResult.shortFilename,
            originalPath: nativeResult.originalPath,
            fullPath: nativeResult.fullPath,
          };
        }
      }
    }

    const packageEntry = CFB.find(cfbData, 'package') || CFB.find(cfbData, 'Package');
    if (packageEntry) {
      console.log('[OLEParser] 找到package流');
      const packageBuf = streamToBuffer(packageEntry);
      if (packageBuf) {
        const packageFileType = detectFileTypeFromBuffer(packageBuf);
        return {
          fileType: packageFileType !== 'unknown' ? packageFileType : (progIdType || 'unknown'),
          extension: packageFileType !== 'unknown' ? packageFileType : (progIdType || 'bin'),
          fileData: packageBuf,
          shortFilename: null,
          originalPath: null,
        };
      }
    }

    console.log('[OLEParser] CFB中未找到Ole10Native或package流，降级处理');
    return {
      fileType: progIdType || 'unknown',
      extension: progIdType || 'bin',
      fileData: buffer,
      shortFilename: null,
      originalPath: null,
    };
  } catch (e) {
    console.warn('[OLEParser] CFB解析失败:', e.message);
    return {
      fileType: progIdType || 'unknown',
      extension: progIdType || 'bin',
      fileData: buffer,
      shortFilename: null,
      originalPath: null,
    };
  }
}

function isCFB(buffer) {
  if (!buffer || buffer.length < 8) return false;
  const result = buffer[0] === 0xD0 && buffer[1] === 0xCF &&
    buffer[2] === 0x11 && buffer[3] === 0xE0 &&
    buffer[4] === 0xA1 && buffer[5] === 0xB1 &&
    buffer[6] === 0x1A && buffer[7] === 0xE1;
  console.log('[OLEParser] isCFB检查 - 前8字节hex:', 
    Array.from(buffer.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' '),
    '结果:', result);
  return result;
}

module.exports = {
  parseOLEObject,
  detectFileTypeFromBuffer,
  isCFB,
  PROGID_TO_TYPE,
};
