import {getUrl} from '../../../utils/url';
import tinycolor from 'tinycolor2';
import {cloneDeep, get, find} from 'lodash';
import {getDarkColor, getLightColor} from './color';
import dayjs from 'dayjs';
import {read, write} from 'xlsx';
import JSZip from 'jszip';
// 直接 ES Module 引用本地化的 @lucky-office/exceljs（其 lib/ 是 Node.js 源码，
// 含我们的 OLE 解析增强，Vite/Webpack 会自动 bundle 进打包产物，无需运行时 <script> 加载）
import Excel from '@lucky-office/exceljs';

const themeColor = [
    '#FFFFFF',
    '#000000',
    '#BFBFBF',
    '#323232',
    '#4472C4',
    '#ED7D31',
    '#A5A5A5',
    '#FFC000',
    '#5B9BD5',
    '#71AD47'
];

const indexedColor = [
    '#000000',
    '#FFFFFF',
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#000000',
    '#FFFFFF',
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#800000',
    '#008000',
    '#000080',
    '#808000',
    '#800080',
    '#008080',
    '#C0C0C0',
    '#808080',
    '#9999FF',
    '#993366',
    '#FFFFCC',
    '#CCFFFF',
    '#660066',
    '#FF8080',
    '#0066CC',
    '#CCCCFF',
    '#000080',
    '#FF00FF',
    '#FFFF00',
    '#00FFFF',
    '#800080',
    '#800000',
    '#008080',
    '#0000FF',
    '#00CCFF',
    '#CCFFFF',
    '#CCFFCC',
    '#FFFF99',
    '#99CCFF',
    '#FF99CC',
    '#CC99FF',
    '#FFCC99',
    '#3366FF',
    '#33CCCC',
    '#99CC00',
    '#FFCC00',
    '#FF9900',
    '#FF6600',
    '#666699',
    '#969696',
    '#003366',
    '#339966',
    '#003300',
    '#333300',
    '#993300',
    '#993366',
    '#333399',
    '#333333',
    '#000000'
];

let defaultColWidth = 80;
let defaultRowHeight = 24;
export function getData(src, options={}) {
    return requestExcel(getUrl(src), options);
}

function requestExcel(src, options) {
    return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open(options.method || 'GET', src, true);
        xhr.responseType = options.responseType || 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status === 200) {
            resolve(xhr.response);
          } else {
            reject(xhr.status);
          }
        };
        xhr.onerror = function() {
          reject(xhr.status);
        };
        xhr.withCredentials = options.withCredentials || false;
        if(options.headers) {
            Object.keys(options.headers).forEach(function(key) {
                xhr.setRequestHeader(key, options.headers[key]);
            });
        }

        xhr.send(options.body);
    });
}

export async function readExcelData(buffer, xls){
    try {
        if(xls){
            const workbook = read(buffer, {type: 'array'});
            buffer = write(workbook, { bookType: 'xlsx', type: 'array' });
        }
        const wb = new Excel.Workbook();
        const workbook = await wb.xlsx.load(buffer);
        
        // 添加调试日志
        console.log('=== readExcelData 完成 ===');
        console.log('workbook structure:', Object.keys(workbook));
        console.log('workbook properties:', workbook.properties);
        console.log('workbook._embeddedObjects:', workbook._embeddedObjects);
        console.log('workbook._definedNames:', workbook._definedNames);
        
        return workbook;

    }catch (e){
        console.warn(e);
        return Promise.reject(e);
    }
}


function transferColumns(excelSheet, spreadSheet, options){
    for(let i = 0;i < (excelSheet.columns || []).length; i++){
        spreadSheet.cols[i.toString()] = {};
        if(excelSheet.columns[i]._hidden) {
            spreadSheet.cols[i.toString()].width = 0.1;
            spreadSheet.cols[i.toString()].hide = true;
        }else if(excelSheet.columns[i].width) {
            spreadSheet.cols[i.toString()].width = excelSheet.columns[i].width * 6 + (options.widthOffset || 0);
        } else {
            spreadSheet.cols[i.toString()].width = defaultColWidth + (options.widthOffset || 0);
        }
    }

    spreadSheet.cols.len = Math.max(Object.keys(spreadSheet.cols).length, options.minColLength || 0);
}

function getCellText(cell){
    //console.log(cell);
    let {numFmt, value, type} = cell;
    switch (type){
        case 2: //数字
            try {
                //numFmt:
                // "0.00%"
                // "0.00_);(0.00)"
                // "#,##0.000_);(#,##0.000)"   千分位
                // "#,##0.000;[Red]#,##0.000"
                if(cell.style.numFmt){
                    if(cell.style.numFmt.endsWith('%')){
                        let precision = cell.style.numFmt.match(/\.(\d+)%/);
                        if(precision){
                            return (value * 100).toFixed(precision[1].length) + '%';
                        }else {
                            return value * 100 + '%';
                        }
                    }else if(/0(\.0+)?/.test(cell.style.numFmt)){
                        let prefix = '';
                        if(cell.style.numFmt.startsWith('$')){
                            prefix = '$';
                        }else if(cell.style.numFmt.startsWith('"¥')){
                            prefix = '¥';
                        }

                        if(value === 0 && cell.style.numFmt.startsWith('_')){
                            return '-';
                        }
                        let precision = cell.style.numFmt.match(/0\.(0+)(_|;|$)/);
                        if(precision){
                            precision = precision[1].length;
                        }else{
                            precision = 0;
                        }

                        let result = value.toFixed(precision) + '';
                        if(cell.style.numFmt.includes('#,##')){
                            //千分位
                            result = result.split('.');
                            let number = result[0].split('').reverse();
                            let newNumber = [];
                            for(let i = 0; i< number.length; i++){
                                newNumber.push(number[i]);
                                if((i+1) % 3 === 0 && i < number.length - 1 && number[i+1] !== '-'){
                                    newNumber.push(',');
                                }

                            }
                            result[0] = newNumber.reverse().join('');
                            result = result.join('.');
                        }
                        return prefix + result;
                    }

                }
                return value + '';
            }catch (e){
                return value;
            }
            
        case 3: //字符串
            return value;
        case 4: //日期
            switch (numFmt){
                case 'yyyy-mm-dd;@':
                    return dayjs(value).format('YYYY-MM-DD');
                case 'mm-dd-yy':
                    return dayjs(value).format('YYYY/MM/DD');
                case '[$-F800]dddd, mmmm dd, yyyy':
                    return dayjs(value).format('YYYY年M月D日 ddd');
                case 'm"月"d"日";@':
                    return dayjs(value).format('M月D日');
                case 'yyyy/m/d h:mm;@':
                case 'm/d/yy "h":mm':
                    return dayjs(value).subtract(8, 'hour').format('YYYY/M/DD HH:mm');
                case 'h:mm;@':
                    return dayjs(value).format('HH:mm');
                default:
                    return dayjs(value).format('YYYY-MM-DD');
            }

        case 5: //超链接
            return value.text;
        case 6: //公式
            return get(value, 'result.error') || value.result;
        case 8: //富文本
            return cell.text;
        case 9: //Boolean
            return cell.text.toUpperCase();
        default:
            return value;
    }
}
function transferArgbColor(originColor){
    if(typeof originColor === 'object'){
        return '#000000';
    }
    if(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.test(originColor)){
        return originColor.startsWith('#') ? originColor : '#' + originColor;
    }
    originColor = originColor.trim().toLowerCase(); //去掉前后空格
    let color = {};
    try {
        let argb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(originColor);
        color.r = parseInt(argb[2], 16);
        color.g = parseInt(argb[3], 16);
        color.b = parseInt(argb[4], 16);
        color.a = parseInt(argb[1], 16) / 255;
        return tinycolor(`rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`).toHexString();
    } catch (e) {
        console.warn(e);
    }
}
function transferThemeColor(themeIndex, tint){

    if(themeIndex > 9){
        return '#C7C9CC';
    }
    if(typeof tint === 'undefined'){
        return themeColor[themeIndex];
    }else if(tint > 0){
        return getLightColor(themeColor[themeIndex], tint);
    }else{
        return getDarkColor(themeColor[themeIndex],Math.abs(tint));
    }
}
function getStyle(cell){
    cell.style = cloneDeep(cell.style);
    let backGroundColor = null;
    if(cell.style.fill && cell.style.fill.fgColor) {
        // 8位字符颜色先转rgb再转16进制颜色
        if(cell.style.fill.fgColor.argb){
            backGroundColor = transferArgbColor(cell.style.fill.fgColor.argb);
        }else if(cell.style.fill.fgColor.hasOwnProperty('theme')){
            backGroundColor = transferThemeColor(cell.style.fill.fgColor.theme, cell.style.fill.fgColor.tint);
        }else if(cell.style.fill.fgColor.indexed){
            backGroundColor = indexedColor[cell.style.fill.fgColor.indexed] || '#C7C9CC';
        }else{
            backGroundColor = '#C7C9CC';
        }

    }

    if(backGroundColor) {
        cell.style.bgcolor = backGroundColor;
    }
    //*************************************************************************** */

    //*********************字体存在背景色******************************
    // 字体颜色
    let fontColor = null;
    if(cell.style.font && cell.style.font.color ) {
        if(cell.style.font.color.argb){
            fontColor = transferArgbColor(cell.style.font.color.argb);
        }else if(cell.style.font.color.hasOwnProperty('theme')){
            fontColor = transferThemeColor(cell.style.font.color.theme, cell.style.font.color.tint);
        }else if(cell.style.font.color.indexed){
            fontColor = indexedColor[cell.style.font.color.indexed] || '#000000';
        }else {
            fontColor = '#000000';
        }

    }
    if(fontColor) {
        cell.style.color = fontColor;
    }

    // exceljs 对齐的格式转成 x-date-spreedsheet 能识别的对齐格式
    if(cell.style.alignment ) {
        if(cell.style.alignment.horizontal){
            cell.style.align = cell.style.alignment.horizontal;
        }
       if(cell.style.alignment.vertical){
           cell.style.valign = cell.style.alignment.vertical;
       }
    }
    if(cell.style.alignment && cell.style.alignment.wrapText) {
        cell.style.textwrap = true;
    }

    if(cell.style.border){
        let styleBorder = {};
        Object.keys(cell.style.border).forEach(position =>{
            let originBorder = cell.style.border[position];
            let bordColor = '#000000';

            if(typeof originBorder.color === 'string'){
                bordColor = originBorder.color;
            }else if(originBorder.color){
                if(originBorder.color.argb){
                    bordColor = transferArgbColor(originBorder.color.argb);
                }else if(originBorder.color.hasOwnProperty('theme')){
                    bordColor = transferThemeColor(originBorder.color.theme, originBorder.color.tint);
                }else if(originBorder.color.indexed){
                    bordColor = indexedColor[originBorder.color.indexed];
                }
            }
            styleBorder[position] = [originBorder.style || 'thin', bordColor];
        });
        cell.style.border2 = {...cell.style.border};
        cell.style.border = styleBorder;
    }

    if(cell.style.font && cell.style.font.size && typeof cell.style.font.size === 'number'){
        cell.style.font.size = Math.round(cell.style.font.size / 1.333333);
    }
    return cell.style;
}

export async function transferExcelToSpreadSheet(workbook, options){
    let workbookData = [];
    let sheets = [];
    
    // 收集需要异步提取 docProps title 的附件任务
    const docPropsTasks = [];
    
    let sheetIndex = 0;
    workbook.eachSheet((sheet) => {
        sheets.push(sheet);
        
        let sheetData = { name: sheet.name,styles : [], rows: {},cols:{}, merges:[],media:[], attachments: [] };
        
        // 从 sheet.oleObjects 提取附件信息
        const sheetAttachments = [];
        if (sheet.oleObjects && sheet.oleObjects.length > 0) {
            console.log(`[附件] ${sheet.name} 发现 ${sheet.oleObjects.length} 个OLE对象`);
            
            sheet.oleObjects.forEach((oleObj, idx) => {
                console.log(`[附件] OLE对象 ${idx}:`, JSON.stringify(oleObj, (k, v) => 
                    k === 'buffer' || k === 'fileData' ? `[Buffer:${v ? v.length : 0}]` : v));
                
                let attachmentType = 'unknown';
                let iconType = 'unknown';
                let displayName = `附件${idx + 1}`;
                let fileBuffer = null;
                
                // 1. 使用 progId 映射文件类型
                if (oleObj.progId) {
                    const progIdType = mapProgIdToType(oleObj.progId);
                    if (progIdType) {
                        attachmentType = progIdType;
                        iconType = mapExtensionToIconType(progIdType) || 'unknown';
                    }
                }
                
                // 2. 从 EMF 图标中提取真实文件名（最高优先级）
                let emfFilename = null;
                if (oleObj.iconBuffer) {
                    emfFilename = extractFilenameFromEMF(oleObj.iconBuffer);
                    if (emfFilename) {
                        console.log(`[附件] EMF图标提取文件名: ${emfFilename}`);
                        displayName = emfFilename;
                        // 用提取出的扩展名再校正一次类型
                        const dotIdx = emfFilename.lastIndexOf('.');
                        if (dotIdx !== -1) {
                            const realExt = emfFilename.substring(dotIdx + 1).toLowerCase();
                            if (realExt && realExt !== 'unknown') {
                                attachmentType = realExt;
                                iconType = mapExtensionToIconType(realExt) || iconType;
                            }
                        }
                    }
                }
                
                // 3. 从 embedding 中获取解析结果
                let embOriginalFilename = null;
                if (oleObj.embedding) {
                    const emb = oleObj.embedding;
                    embOriginalFilename = emb.originalFilename || null;
                    if (emb.parsed) {
                        const p = emb.parsed;
                        // 使用解析结果覆盖类型
                        if (p.fileType && p.fileType !== 'unknown') {
                            attachmentType = p.fileType;
                            iconType = mapExtensionToIconType(p.fileType) || iconType;
                        }
                        // 仅当 EMF 没提供文件名时，才使用解析结果中的文件名（Ole10Native shortFilename）
                        if (!emfFilename && p.shortFilename) {
                            displayName = p.shortFilename;
                        }
                        // 使用解析结果中的真实文件数据
                        if (p.fileData) {
                            fileBuffer = p.fileData;
                        }
                    }
                    // 如果没有 parsed.fileData，使用原始 buffer
                    if (!fileBuffer && emb.buffer) {
                        fileBuffer = emb.buffer;
                    }
                }
                
                // 3. 从 anchor 获取位置信息
                let range = null;
                if (oleObj.anchor) {
                    const from = oleObj.anchor.from;
                    const to = oleObj.anchor.to;
                    if (from) {
                        range = {
                            type: 'range',
                            startRow: from.row,
                            startCol: from.col,
                            endRow: to ? to.row : from.row,
                            endCol: to ? to.col : from.col,
                        };
                    }
                }
                
                const attachment = {
                    name: displayName,
                    type: attachmentType,
                    iconType: iconType,
                    extension: attachmentType,
                    buffer: fileBuffer,
                    isOLE: true,
                    progId: oleObj.progId,
                    range: range,
                };
                
                sheetAttachments.push(attachment);
                console.log(`[附件] 添加: name=${displayName}, type=${attachmentType}, hasRange=${!!range}`);
                
                // 若 displayName 还是默认占位（"附件N"）且 EMF 也未提供文件名，
                // 才尝试从 fileBuffer 的 docProps 或 embeddings 文件名做回退
                const isDefaultName = /^附件\d+$/.test(displayName);
                console.log(`[附件] docProps 检查: name=${displayName}, isDefaultName=${isDefaultName}, emfFilename=${emfFilename}, fileBuffer类型=${fileBuffer ? Object.prototype.toString.call(fileBuffer) : 'null'}, length=${fileBuffer && fileBuffer.length}`);
                if (isDefaultName && !emfFilename && fileBuffer) {
                    // 检查是否是 ZIP（PK\x03\x04）
                    const b0 = fileBuffer[0], b1 = fileBuffer[1], b2 = fileBuffer[2], b3 = fileBuffer[3];
                    console.log(`[附件] ${displayName} 前4字节: ${b0?.toString(16)} ${b1?.toString(16)} ${b2?.toString(16)} ${b3?.toString(16)}`);
                    const head = fileBuffer.length >= 4 && b0 === 0x50 && b1 === 0x4B && b2 === 0x03 && b3 === 0x04;
                    if (head) {
                        docPropsTasks.push(
                            extractDocPropsTitle(fileBuffer).then(title => {
                                // dc:title 仅在本身包含已知扩展名时才用作文件名（例如"xxx.docx"）
                                // 否则它通常是文档主标题，不是文件名
                                if (title && hasKnownExtension(title)) {
                                    attachment.name = title;
                                    console.log(`[附件] docProps 标题更新（带扩展名）: ${attachment.name}`);
                                } else if (embOriginalFilename) {
                                    attachment.name = embOriginalFilename;
                                    console.log(`[附件] 回退到 embeddings 文件名: ${attachment.name}`);
                                }
                            }).catch(e => console.warn('docProps 任务失败:', e))
                        );
                    } else if (embOriginalFilename) {
                        // 不是 ZIP 头但有 embeddings 文件名，直接使用
                        attachment.name = embOriginalFilename;
                        console.log(`[附件] 非ZIP，使用 embeddings 文件名: ${attachment.name}`);
                    } else {
                        console.log(`[附件] ${displayName} 不是 ZIP 头，跳过 docProps`);
                    }
                }
            });
        }
        
        // 收集合并单元格信息
        let mergeAddressData = [];
        for(let mergeRange in sheet._merges) {
            sheetData.merges.push(sheet._merges[mergeRange].shortRange);
            let mergeAddress = {};
            mergeAddress.startAddress = sheet._merges[mergeRange].tl;
            mergeAddress.endAddress = sheet._merges[mergeRange].br;
            mergeAddress.YRange = sheet._merges[mergeRange].model.bottom - sheet._merges[mergeRange].model.top;
            mergeAddress.XRange = sheet._merges[mergeRange].model.right - sheet._merges[mergeRange].model.left;
            mergeAddressData.push(mergeAddress);
        }

        let effectiveMaxColLen = 0;
        
        // 遍历行
        (sheet._rows || []).forEach((row,spreadSheetRowIndex) =>{
            sheetData.rows[spreadSheetRowIndex] = { cells: {} };
            if(row._hidden){
                sheetData.rows[spreadSheetRowIndex].height = 0.1;
                sheetData.rows[spreadSheetRowIndex].hide = true;
            }else if(row.height){
                sheetData.rows[spreadSheetRowIndex].height = row.height + (options.heightOffset || 0);
            }else{
                sheetData.rows[spreadSheetRowIndex].height = defaultRowHeight + (options.heightOffset || 0);
            }
            
            //includeEmpty = false 不包含空白单元格
            (row._cells || []).forEach((cell, spreadSheetColIndex) =>{
                sheetData.rows[spreadSheetRowIndex].cells[spreadSheetColIndex] = {};
                effectiveMaxColLen = Math.max(effectiveMaxColLen, spreadSheetColIndex);

                let mergeAddress = find(mergeAddressData, function(o) { return o.startAddress == cell._address; });
                if(mergeAddress && cell.master.address != mergeAddress.startAddress) {
                    return;
                }
                if(mergeAddress){
                    sheetData.rows[spreadSheetRowIndex].cells[spreadSheetColIndex].merge = [mergeAddress.YRange, mergeAddress.XRange];
                }
                sheetData.rows[spreadSheetRowIndex].cells[spreadSheetColIndex].text = getCellText(cell);
                sheetData.styles.push(getStyle(cell));
                sheetData.rows[spreadSheetRowIndex].cells[spreadSheetColIndex].style = sheetData.styles.length - 1;
            });
        });
        
        if(sheetData._media){
            sheetData.media = sheetData._media;
        }
        
        // 设置附件数据
        console.log(`[附件] ${sheet.name} 最终附件数量:`, sheetAttachments.length);
        sheetAttachments.forEach((att, idx) => {
            console.log(`  ${idx+1}. ${att.name} (${att.type}) - range: ${att.range ? '有' : '无'}`);
        });
        sheetData.attachments = sheetAttachments;

        sheetIndex++;

        let tempRowsKeys = Object.keys(sheetData.rows);

        sheetData.rows.len = Math.max(+tempRowsKeys[tempRowsKeys.length-1] + 1,
            options.hasOwnProperty('minRowLength') ? options.minRowLength : 100);

        if(sheet._columns && sheet._columns.length > effectiveMaxColLen + 1){
            sheet._columns = sheet._columns.slice(0, effectiveMaxColLen + 1);
        }
        transferColumns(sheet,sheetData, options);
        workbookData.push(sheetData);
    });
    
    workbook._worksheets = sheets;
    
    // 等待所有 docProps title 提取任务完成
    if (docPropsTasks.length > 0) {
        console.log(`[附件] 等待 ${docPropsTasks.length} 个 docProps 标题提取任务...`);
        await Promise.all(docPropsTasks);
        console.log('[附件] docProps 标题提取完成');
    }
    
    return {
        workbookData,
        workbookSource: workbook,
        medias: workbook.media || [],
        attachments: []
    };
}

// 已知文件扩展名集合，按长度倒序排列以便优先匹配长扩展名
const KNOWN_EXTENSIONS = [
    '.xlsx', '.docx', '.pptx', '.xlsm', '.docm', '.pptm',
    '.pdf', '.xls', '.doc', '.ppt', '.zip', '.rar',
    '.csv', '.txt', '.png', '.jpg', '.gif', '.bmp',
    '.7z', '.jpeg', '.tiff', '.tif',
];

// 判断字符串是否包含已知扩展名（且扩展名出现在字符串末尾或末尾附近）
function hasKnownExtension(str) {
    if (!str) return false;
    const lower = str.toLowerCase();
    return KNOWN_EXTENSIONS.some(ext => lower.endsWith(ext) || lower.includes(ext));
}

// 从 EMF 图标 buffer 中提取真实文件名
// EMF 图标里通常以 UTF-16-LE 存储 Excel 显示的文件名文本（例如 "附件.xlsx"、"test.docx"）
function extractFilenameFromEMF(buffer) {
    if (!buffer || buffer.length < 100) return null;
    let bytes;
    if (buffer instanceof Uint8Array) {
        bytes = buffer;
    } else if (buffer instanceof ArrayBuffer) {
        bytes = new Uint8Array(buffer);
    } else if (typeof buffer.length === 'number') {
        bytes = new Uint8Array(buffer.length);
        for (let i = 0; i < buffer.length; i++) {
            bytes[i] = buffer[i];
        }
    } else {
        return null;
    }
    
    // 判断字符是否可作为文件名字符（ASCII 可见字符 / 中日韩 / 全角符号）
    const isPrintable = (code) => {
        return (code >= 0x20 && code < 0x7F)
            || (code >= 0x4E00 && code <= 0x9FFF)
            || (code >= 0x3000 && code <= 0x303F)
            || (code >= 0x3040 && code <= 0x30FF)
            || (code >= 0xAC00 && code <= 0xD7AF)
            || (code >= 0xFF00 && code <= 0xFFEF);
    };
    
    // 扫描所有 UTF-16-LE 可打印字符串（长度 >= 4）
    const candidates = [];
    let i = 0;
    while (i < bytes.length - 1) {
        const start = i;
        let s = '';
        while (i < bytes.length - 1) {
            const code = bytes[i] | (bytes[i + 1] << 8);
            if (isPrintable(code)) {
                s += String.fromCharCode(code);
                i += 2;
            } else {
                break;
            }
        }
        if (s.length >= 4) candidates.push({ offset: start, str: s });
        i = Math.max(i + 1, start + 2);
    }
    
    // 在候选字符串中查找包含已知扩展名的，截取到扩展名末尾
    for (const { str } of candidates) {
        const lower = str.toLowerCase();
        for (const ext of KNOWN_EXTENSIONS) {
            const idx = lower.lastIndexOf(ext);
            if (idx !== -1) {
                const candidate = str.substring(0, idx + ext.length);
                // 过滤掉明显是字体名等非文件名的字符串（比如包含空格且没有"."分隔符）
                if (candidate.length >= 3 && candidate.length <= 200) {
                    return candidate;
                }
            }
        }
    }
    return null;
}

// 从 OOXML（zip）的 docProps/core.xml 中提取标题（dc:title），用于辅助识别附件文件名
async function extractDocPropsTitle(buffer) {
    if (!buffer) return null;
    try {
        let inputBuffer = buffer;
        // JSZip 接受多种类型，但要确保不是 Node Buffer 的 stub
        if (buffer && typeof buffer.byteLength === 'number' && !(buffer instanceof Uint8Array) && !(buffer instanceof ArrayBuffer)) {
            // 转为 Uint8Array
            inputBuffer = new Uint8Array(buffer.length);
            for (let i = 0; i < buffer.length; i++) {
                inputBuffer[i] = buffer[i];
            }
        }
        const zip = await JSZip.loadAsync(inputBuffer);
        const fileNames = Object.keys(zip.files);
        console.log('extractDocPropsTitle: ZIP 文件列表:', fileNames.slice(0, 20).join(', '));
        const coreFile = zip.file('docProps/core.xml');
        if (!coreFile) {
            console.log('extractDocPropsTitle: 没有 docProps/core.xml');
            return null;
        }
        const xmlText = await coreFile.async('string');
        console.log('extractDocPropsTitle: core.xml 前300字符:', xmlText.substring(0, 300));
        const m = xmlText.match(/<dc:title>([\s\S]*?)<\/dc:title>/);
        if (m && m[1]) {
            const title = m[1].trim();
            console.log('extractDocPropsTitle: 提取到标题:', title);
            return title || null;
        }
        // 兼容没有命名空间的 <title>
        const m2 = xmlText.match(/<title>([\s\S]*?)<\/title>/);
        if (m2 && m2[1]) {
            const title = m2[1].trim();
            console.log('extractDocPropsTitle: 提取到标题(无ns):', title);
            return title || null;
        }
        console.log('extractDocPropsTitle: 未找到 dc:title');
        return null;
    } catch (e) {
        console.warn('extractDocPropsTitle 失败:', e.message);
        return null;
    }
}

function mapProgIdToType(progId) {
    const map = {
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
    return map[progId] || null;
}

// 根据扩展名映射到图标类型
function mapExtensionToIconType(ext) {
    const iconMap = {
        'doc': 'word',
        'docx': 'word',
        'xls': 'excel',
        'xlsx': 'excel',
        'pdf': 'pdf',
        'ppt': 'ppt',
        'pptx': 'ppt',
        'zip': 'zip',
        'csv': 'csv',
        'txt': 'text',
        'png': 'image',
        'jpg': 'image',
        'jpeg': 'image',
        'gif': 'image',
        'bmp': 'image'
    };
    return iconMap[ext.toLowerCase()] || 'unknown';
}

// 获取附件在sheet中的位置范围
function getAttachmentRange(sheet, relId) {
    // 查找OLE对象的位置信息
    if (sheet._oleObjects) {
        for (const oleObj of sheet._oleObjects) {
            if (oleObj.relId === relId || oleObj.rId === relId) {
                return oleObj.range;
            }
        }
    }
    
    // 查找嵌入对象的位置信息
    if (sheet._embeddedObjects) {
        for (const obj of sheet._embeddedObjects) {
            if (obj.relId === relId || obj.rId === relId) {
                return obj.range;
            }
        }
    }
    
    return null;
}

// 从OLE10Native中提取文件名和真实数据
// OLE10Native格式结构:
// 8字节签名 (\x01OLE10\x00\x00\x00 或 \x03OLE10\x00\x00\x00)
// 2字节未知
// 2字节原始文件名长度 (Unicode)
// N字节原始文件名 (Unicode)
// 4字节文件大小 (小端序)
// 真实文件数据
function extractOLE10NativeData(buffer) {
    if (!buffer) return null;
    
    let bytes;
    if (buffer instanceof ArrayBuffer) {
        bytes = new Uint8Array(buffer);
    } else {
        bytes = new Uint8Array(buffer.slice(0, 200)); // 需要读取更多数据来获取文件名
    }
    
    // 检查OLE10Native签名
    const signatures = [
        { offset: 0, sig: [0x01, 0x4F, 0x4C, 0x45, 0x31, 0x30, 0x00, 0x00] },
        { offset: 0, sig: [0x03, 0x4F, 0x4C, 0x45, 0x31, 0x30, 0x00, 0x00] },
        { offset: 8, sig: [0x01, 0x4F, 0x4C, 0x45, 0x31, 0x30, 0x00, 0x00] },
        { offset: 8, sig: [0x03, 0x4F, 0x4C, 0x45, 0x31, 0x30, 0x00, 0x00] }
    ];
    
    for (const { offset, sig } of signatures) {
        let match = true;
        for (let i = 0; i < sig.length; i++) {
            if (bytes[offset + i] !== sig[i]) {
                match = false;
                break;
            }
        }
        if (match) {
            console.log('extractOLE10NativeData: 检测到OLE10Native格式');
            
            // 尝试提取文件名
            // 在签名后：2字节未知 + 2字节文件名长度 + 文件名 + 4字节大小 + 数据
            let originalName = null;
            const nameLenOffset = offset + 10; // 8字节签名 + 2字节未知
            
            if (nameLenOffset + 2 <= bytes.length) {
                // 文件名长度是2字节Unicode字符数
                const nameLen = bytes[nameLenOffset] | (bytes[nameLenOffset + 1] << 8);
                console.log('extractOLE10NativeData: 文件名长度(Unicode字符):', nameLen);
                
                if (nameLen > 0 && nameLen < 500) { // 合理性检查
                    const nameStart = nameLenOffset + 2;
                    const nameEnd = nameStart + nameLen * 2;
                    
                    if (nameEnd <= bytes.length) {
                        // 提取Unicode字符串
                        let nameBytes = bytes.slice(nameStart, nameEnd);
                        try {
                            // 尝试用UTF-16解析
                            const decoder = new TextDecoder('utf-16le');
                            originalName = decoder.decode(nameBytes);
                            // 移除末尾的空字符
                            originalName = originalName.replace(/\0+$/, '');
                            console.log('extractOLE10NativeData: 提取到文件名:', originalName);
                        } catch (e) {
                            // 尝试ASCII
                            let asciiName = '';
                            for (let i = 0; i < nameBytes.length; i += 2) {
                                if (nameBytes[i] !== 0) {
                                    asciiName += String.fromCharCode(nameBytes[i]);
                                }
                            }
                            if (asciiName.trim()) {
                                originalName = asciiName.trim();
                                console.log('extractOLE10NativeData: 提取到文件名(ASCII):', originalName);
                            }
                        }
                    }
                }
            }
            
            // 尝试提取文件大小和数据
            // 常见位置：偏移20或22或24
            const possibleOffsets = [20, 22, 24, 26];
            let fileSize = null;
            let dataStart = null;
            
            for (const sizeOffset of possibleOffsets) {
                if (sizeOffset + 4 <= bytes.length) {
                    const size = bytes[sizeOffset] | 
                               (bytes[sizeOffset + 1] << 8) | 
                               (bytes[sizeOffset + 2] << 16) | 
                               (bytes[sizeOffset + 3] << 24);
                    
                    // 合理性检查：大小应该大于0且小于buffer长度
                    if (size > 0 && size < buffer.length) {
                        fileSize = size;
                        dataStart = sizeOffset + 4;
                        console.log('extractOLE10NativeData: 文件大小:', fileSize, '数据起始:', dataStart);
                        break;
                    }
                }
            }
            
            if (dataStart && fileSize) {
                if (dataStart + fileSize <= buffer.length) {
                    const realData = buffer.slice(dataStart, dataStart + fileSize);
                    console.log('extractOLE10NativeData: 成功提取真实数据，长度:', realData.length);
                    return {
                        data: realData,
                        originalName: originalName
                    };
                }
            }
            
            // 如果找不到合理的大小，尝试从常见偏移提取
            if (offset + 20 < buffer.length) {
                const realData = buffer.slice(offset + 20);
                console.log('extractOLE10NativeData: 从偏移', offset + 20, '提取数据');
                return {
                    data: realData,
                    originalName: originalName
                };
            }
        }
    }
    
    return null;
}

// 从buffer检测文件类型
function detectFileTypeFromBuffer(buffer, isOLE = false) {
    if (!buffer) return null;
    
    // 转换为Uint8Array以便检查字节
    let bytes;
    if (buffer instanceof ArrayBuffer) {
        bytes = new Uint8Array(buffer);
    } else if (buffer instanceof Uint8Array) {
        bytes = buffer;
    } else if (typeof buffer === 'string') {
        return null;
    } else {
        bytes = new Uint8Array(buffer.slice(0, 32));
    }
    
    // 如果是OLE对象，先尝试提取内部数据
    let realBuffer = buffer;
    let originalNameFromOLE = null;
    if (isOLE) {
        const extracted = extractOLE10NativeData(buffer);
        if (extracted) {
            console.log('detectFileTypeFromBuffer: 从OLE中提取了真实数据');
            realBuffer = extracted.data || extracted;
            originalNameFromOLE = extracted.originalName;
            if (originalNameFromOLE) {
                console.log('detectFileTypeFromBuffer: 从OLE中提取到文件名:', originalNameFromOLE);
            }
            bytes = new Uint8Array(realBuffer.slice(0, Math.min(32, realBuffer.length)));
        }
    }
    
    // 检查常见文件签名
    const signatures = [
        // PDF - 优先级最高，因为PDF签名较短
        { sig: [0x25, 0x50, 0x44, 0x46], ext: 'pdf', desc: 'PDF文档' },
        // ZIP 格式 (Office 2007+ 文档, ZIP 压缩包)
        { sig: [0x50, 0x4B, 0x03, 0x04], ext: 'zip', desc: 'ZIP/DOCX/XLSX/PPTX' },
        // JPEG
        { sig: [0xFF, 0xD8, 0xFF], ext: 'jpg', desc: 'JPEG图片' },
        // PNG
        { sig: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], ext: 'png', desc: 'PNG图片' },
        // GIF
        { sig: [0x47, 0x49, 0x46, 0x38], ext: 'gif', desc: 'GIF图片' },
        // BMP
        { sig: [0x42, 0x4D], ext: 'bmp', desc: 'BMP图片' },
        // RAR
        { sig: [0x52, 0x61, 0x72, 0x21], ext: 'rar', desc: 'RAR压缩包' },
        // 7z
        { sig: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C], ext: '7z', desc: '7Z压缩包' },
        // OLE Compound File
        { sig: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], ext: 'ole', desc: 'OLE复合文件' }
    ];
    
    for (const { sig, ext, desc } of signatures) {
        let match = true;
        for (let i = 0; i < sig.length; i++) {
            if (i >= bytes.length || bytes[i] !== sig[i]) {
                match = false;
                break;
            }
        }
        if (match) {
            console.log('detectFileTypeFromBuffer: 匹配成功 -', desc);
            if (ext === 'zip') {
                const officeExt = detectOfficeFromZip(realBuffer);
                if (officeExt) {
                    return officeExt;
                }
            }
            return ext;
        }
    }
    
    console.log('detectFileTypeFromBuffer: 未匹配到已知类型');
    return null;
}

// 从ZIP格式中检测是否是Office文档
function detectOfficeFromZip(bytes, fullBuffer) {
    // 检查是否是Office 2007+ 文档
    // 在ZIP中查找 [Content_Types].xml 或特定关系文件
    // 由于不能完整解压ZIP，我们做一个简化的检查
    
    // 检查后面是否有 Office 文档的特征
    // 对于DOCX，查找 word/
    // 对于XLSX，查找 xl/
    // 对于PPTX，查找 ppt/
    
    // 先找PK头，然后找目录名
    let searchBytes = bytes;
    if (fullBuffer && fullBuffer.length > 1000) {
        searchBytes = new Uint8Array(fullBuffer.slice(0, Math.min(fullBuffer.length, 5000)));
    }
    
    const checkPattern = (pattern) => {
        for (let i = 0; i < searchBytes.length - pattern.length; i++) {
            let found = true;
            for (let j = 0; j < pattern.length; j++) {
                if (searchBytes[i + j] !== pattern[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        return false;
    };
    
    // 检查 DOCX 的特征 (word/)
    if (checkPattern([0x77, 0x6F, 0x72, 0x64, 0x2F])) { // word/
        console.log('detectOfficeFromZip: 检测到 DOCX');
        return 'docx';
    }
    // 检查 XLSX 的特征 (xl/)
    if (checkPattern([0x78, 0x6C, 0x2F])) { // xl/
        console.log('detectOfficeFromZip: 检测到 XLSX');
        return 'xlsx';
    }
    // 检查 PPTX 的特征 (ppt/)
    if (checkPattern([0x70, 0x70, 0x74, 0x2F])) { // ppt/
        console.log('detectOfficeFromZip: 检测到 PPTX');
        return 'pptx';
    }
    
    return null; // 普通ZIP
}
