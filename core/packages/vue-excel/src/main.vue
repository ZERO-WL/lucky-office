<script>
import {defineComponent, ref, onMounted, onBeforeUnmount, watch, nextTick} from 'vue';
import Spreadsheet from './x-spreadsheet/index';
import {getData, readExcelData, transferExcelToSpreadSheet} from './excel';
import {renderImage, renderAttachments, clearCache} from './media';
import {readOnlyInput} from './hack';
import {debounce} from 'lodash';
import {download as downloadFile} from '../../../utils/url';
// 导入OLE下载工具
import {downloadOLEObject, formatFileSize, getMimeType} from './ole-downloader';

const defaultOptions = {
    xls: false,
    minColLength: 20
};
export default defineComponent({
    name: 'VueOfficeExcel',
    props: {
        src: [String, ArrayBuffer, Blob],
        requestOptions: {
            type: Object,
            default: () => ({})
        },
        options: {
            type: Object,
            default: () => ({
               ...defaultOptions
            })
        }
    },
    emits: ['rendered', 'error', 'switchSheet', 'cellSelected', 'cellsSelected', 'attachment-preview'],
    setup(props, {emit}) {
        const wrapperRef = ref(null);
        const rootRef = ref(null);
        let workbookDataSource = {
            _worksheets:[]
        };
        let workbookData = []; // 将 workbookData 提升到组件级别
        let mediasSource = [];
        let sheetIndex = 0;
        let ctx = null;
        let xs = null;
        let offset = null;
        let fileData = null;
        // document 级别拖拽事件处理器引用（用于卸载时清理）
        let docMousemoveHandler = null;
        let docMouseupHandler = null;
        const attachmentInfo = ref([]); // 附件信息用于显示

        function renderExcel(buffer) {
            fileData = buffer;
            readExcelData(buffer, props.options.xls).then(async workbook => {
                if (!workbook._worksheets || workbook._worksheets.length === 0) {
                    throw new Error('未获取到数据，可能文件格式不正确或文件已损坏');
                }
                if(props.options.beforeTransformData && typeof props.options.beforeTransformData === 'function' ){
                    workbook = props.options.beforeTransformData(workbook);
                }
                const result = await transferExcelToSpreadSheet(workbook, {...defaultOptions, ...props.options});
                workbookData = result.workbookData;
                console.log('=== workbookData ===');
                console.log('workbookData.length:', workbookData.length);
                workbookData.forEach((sheet, index) => {
                    console.log(`Sheet ${index}: ${sheet.name}`);
                    console.log('attachments:', sheet.attachments);
                    console.log('attachments.length:', sheet.attachments?.length || 0);
                });
                
                if(props.options.transformData && typeof props.options.transformData === 'function' ){
                    workbookData = props.options.transformData(workbookData);
                }
                mediasSource = result.medias;
                workbookDataSource = result.workbookSource;
                // 从所有 sheet 收集附件
                const attachments = [];
                workbookData.forEach(sheet => {
                    if (sheet.attachments && sheet.attachments.length) {
                        attachments.push(...sheet.attachments);
                    }
                });
                console.log('=== 总附件数 ===', attachments.length);
                
                // 更新附件信息用于显示
                attachmentInfo.value = attachments;
                
                offset = null;
                sheetIndex = 0;
                clearCache();
                xs.loadData(workbookData);
                renderImage(ctx, mediasSource, workbookDataSource._worksheets[sheetIndex], offset, props.options);
                console.log('=== 准备渲染附件 ===');
                console.log('ctx:', ctx);
                console.log('workbookData[0]:', workbookData[0]);
                console.log('workbookData[0].attachments:', workbookData[0]?.attachments);
                renderAttachments(ctx, workbookData[sheetIndex], offset, props.options);
                emit('rendered');
                emit('switchSheet', 0);
                //涉及clear和offset

            }).catch(e => {
                console.warn(e);
                mediasSource = [];
                workbookDataSource = {
                    _worksheets:[]
                };
                clearCache();
                xs && xs.loadData({});
                emit('error', e);
                emit('switchSheet', 0);
            });
        }
        
        onMounted(() => {
            nextTick(()=>{
                xs = new Spreadsheet(rootRef.value, {
                    mode: 'read',
                    showToolbar: false,
                    showContextmenu: props.options.showContextmenu || false,
                    view: {
                        height: () => wrapperRef.value && wrapperRef.value.clientHeight || 300,
                        width: () => wrapperRef.value && wrapperRef.value.clientWidth || 1200,
                    },
                    row: {
                        height: 24,
                        len: 100
                    },
                    col: {
                        len: 26,
                        width: 80,
                        indexWidth: 60,
                        minWidth: 60,
                    },
                    autoFocus: false
                }).loadData({});

                xs.on('cell-selected', (cell, ri, ci) => {
                    emit('cellSelected', {
                        cell,
                        rowIndex: ri,
                        columnIndex: ci
                    });
                });
                xs.on('cells-selected', (cell, { sri, sci, eri, eci }) => {
                    emit('cellsSelected', {
                        cell,
                        startRowIndex: sri,
                        startColumnIndex: sci,
                        endRowIndex: eri,
                        endColumnIndex: eci
                    });
                });

                let swapFunc = xs.bottombar.swapFunc;
                xs.bottombar.swapFunc = function (index) {
                    swapFunc.call(xs.bottombar, index);
                    sheetIndex = index;
                    offset = xs.sheet.data.getSelectedRect();
                    setTimeout(()=>{
                        xs.reRender();
                        const currentSheet = workbookData[sheetIndex];
                        if (currentSheet) {
                            renderImage(ctx, mediasSource, currentSheet, offset, props.options);
                            if (currentSheet.attachments) {
                                renderAttachments(ctx, currentSheet, offset, props.options);
                            }
                        }
                        emit('switchSheet', index);
                    });

                };

                let renderImageDebounce = debounce(renderImage, 200, {
                    leading: true
                });
                // 附件渲染必须同步执行：
                // 1. 选中切换时若被 debounce 吞掉中间帧，画布会先被 spreadsheet 清空，附件来不及画 → 闪烁消失
                // 2. 拖拽 mousemove 高频触发 render，debounce 会丢掉绝大多数帧，导致拖拽视觉不更新
                // 附件数量很少，同步渲染开销可忽略
                let tableRender = xs.sheet.table.render;
                xs.sheet.table.render = function (...args){
                    xs && xs.sheet && tableRender.apply(xs.sheet.table, args);
                    const currentSheet = workbookData[sheetIndex];
                    if (currentSheet) {
                        renderImageDebounce(ctx, mediasSource, currentSheet, offset, props.options);
                        if (currentSheet.attachments && currentSheet.attachments.length) {
                            renderAttachments(ctx, currentSheet, offset, props.options);
                        }
                    }
                };

                // let clear = xs.sheet.editor.clear;
                // xs.sheet.editor.clear = function (...args){
                //     clear.apply(xs.sheet.editor, args);
                //     setTimeout(()=>{
                //         renderImage(ctx, mediasSource, workbookDataSource._worksheets[sheetIndex], offset, props.options);
                //     });
                // };
                let setOffset = xs.sheet.editor.setOffset;
                xs.sheet.editor.setOffset = function (...args){
                    setOffset.apply(xs.sheet.editor, args);
                    offset = args[0];
                };
                const canvas = rootRef.value.querySelector('canvas');
                console.log('=== Canvas 元素 ===');
                console.log('canvas:', canvas);
                ctx = canvas.getContext('2d');
                console.log('ctx:', ctx);
                
                // 注入 onIconLoaded 回调到 options，附件图标首次加载完成后触发重绘
                if (!props.options.onIconLoaded) {
                    props.options.onIconLoaded = (() => {
                        let pending = false;
                        return () => {
                            if (pending) return;
                            pending = true;
                            requestAnimationFrame(() => {
                                pending = false;
                                if (xs && xs.sheet && xs.sheet.table) {
                                    xs.sheet.table.render();
                                }
                            });
                        };
                    })();
                }
                
                // 监听画布点击事件（捕获阶段，确保先于 spreadsheet 内部处理）
                // 命中附件区域时阻止冒泡，避免 spreadsheet 选中单元格
                
                // 拖拽状态
                let dragState = null;
                // 标记刚刚完成的拖拽，用于在紧随其后的 click 中跳过选中切换
                let justDragged = false;
                
                // 检测点击位置是否命中某个附件卡片或其下载按钮（不修改状态）
                const hitTestAttachment = (e) => {
                    const rect = canvas.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const clickY = e.clientY - rect.top;
                    
                    const currentSheet = workbookData[sheetIndex];
                    if (!currentSheet || !currentSheet.attachments || currentSheet.attachments.length === 0) {
                        return null;
                    }
                    
                    // 优先检测预览按钮
                    for (const att of currentSheet.attachments) {
                        if (att._selected && att._previewBtnInfo) {
                            const b = att._previewBtnInfo;
                            if (clickX >= b.x && clickX <= b.x + b.width &&
                                clickY >= b.y && clickY <= b.y + b.height) {
                                return { type: 'preview', attachment: att };
                            }
                        }
                    }
                    
                    // 优先检测下载按钮
                    for (const att of currentSheet.attachments) {
                        if (att._selected && att._downloadBtnInfo) {
                            const b = att._downloadBtnInfo;
                            if (clickX >= b.x && clickX <= b.x + b.width &&
                                clickY >= b.y && clickY <= b.y + b.height) {
                                return { type: 'download', attachment: att };
                            }
                        }
                    }
                    
                    // 检测附件卡片
                    for (const att of currentSheet.attachments) {
                        if (att._renderInfo) {
                            const r = att._renderInfo;
                            if (clickX >= r.x && clickX <= r.x + r.width &&
                                clickY >= r.y && clickY <= r.y + r.height) {
                                return { type: 'card', attachment: att };
                            }
                        }
                    }
                    
                    return null;
                };
                
                // 预览类型映射：根据扩展名决定使用本项目哪个预览路由
                const previewTypeMap = {
                    xlsx: 'excel', xls: 'excel', xlsm: 'excel',
                    docx: 'docx', doc: 'docx', docm: 'docx',
                    pdf: 'pdf',
                    pptx: 'pptx', ppt: 'pptx', pptm: 'pptx',
                };
                
                // 触发附件预览：创建 Blob URL 并 emit 给父组件
                const triggerAttachmentPreview = (attachment) => {
                    const buffer = (attachment.parsed && attachment.parsed.buffer) || attachment.buffer;
                    if (!buffer) {
                        console.warn('[attachment-preview] 附件 buffer 缺失', attachment);
                        return;
                    }
                    const name = attachment.name || `附件.${attachment.extension || 'bin'}`;
                    const ext = (attachment.extension || (name.split('.').pop() || '')).toLowerCase();
                    const mimeType = getMimeType(ext);
                    const previewType = previewTypeMap[ext] || null;
                    
                    let blob;
                    if (buffer instanceof ArrayBuffer || buffer instanceof Uint8Array) {
                        blob = new Blob([buffer], { type: mimeType });
                    } else {
                        // 兼容 Node.js Buffer
                        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
                        blob = new Blob([arrayBuffer], { type: mimeType });
                    }
                    const url = URL.createObjectURL(blob);
                    // 不主动 revoke，由浏览器 GC
                    
                    emit('attachment-preview', {
                        url, name, extension: ext, mimeType, previewType, attachment
                    });
                };
                
                // 实际处理 click 中的选中切换/下载
                const handleAttachmentClick = (e) => {
                    const hit = hitTestAttachment(e);
                    if (!hit) return false;
                    
                    const currentSheet = workbookData[sheetIndex];
                    
                    if (hit.type === 'preview') {
                        console.log('点击预览按钮:', hit.attachment.name);
                        triggerAttachmentPreview(hit.attachment);
                        return true;
                    }
                    
                    if (hit.type === 'download') {
                        console.log('点击下载按钮:', hit.attachment.name);
                        downloadOLEObject(hit.attachment);
                        return true;
                    }
                    
                    // 点击卡片：切换选中态
                    let needRerender = false;
                    currentSheet.attachments.forEach(att => {
                        if (att._selected && att !== hit.attachment) {
                            att._selected = false;
                            needRerender = true;
                        }
                    });
                    hit.attachment._selected = !hit.attachment._selected;
                    needRerender = true;
                    console.log('附件选中切换:', hit.attachment.name, hit.attachment._selected);
                    
                    if (needRerender) {
                        if (xs && xs.sheet && xs.sheet.table) {
                            xs.sheet.table.render();
                        }
                    }
                    return true;
                };
                
                // 将 CSS 像素坐标转换为单元格行列号
                // 直接使用 x-spreadsheet 自带的 getCellRectByXY，能正确处理滚动、冻结区、合并格
                const getCellFromPosition = (mouseX, mouseY) => {
                    if (!xs || !xs.sheet || !xs.sheet.data) return null;
                    const rect = xs.sheet.data.getCellRectByXY(mouseX, mouseY);
                    if (!rect) return null;
                    // ri/ci 为 -1 表示落在表头区域（非数据区）
                    if (rect.ri < 0 || rect.ci < 0) return null;
                    return { row: rect.ri, col: rect.ci };
                };
                
                // mousedown：命中卡片时启动拖拽准备，命中下载按钮时仅阻止冒泡
                const captureMousedown = (e) => {
                    const hit = hitTestAttachment(e);
                    if (!hit) return;
                    
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    
                    if (hit.type === 'card') {
                        const r = hit.attachment._renderInfo;
                        const rect = canvas.getBoundingClientRect();
                        dragState = {
                            attachment: hit.attachment,
                            offsetX: (e.clientX - rect.left) - r.x,
                            offsetY: (e.clientY - rect.top) - r.y,
                            startX: e.clientX,
                            startY: e.clientY,
                            moved: false,
                        };
                    }
                };
                
                // mousemove：拖拽中实时更新卡片位置
                const captureMousemove = (e) => {
                    if (!dragState) return;
                    
                    const dx = e.clientX - dragState.startX;
                    const dy = e.clientY - dragState.startY;
                    
                    if (!dragState.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
                    dragState.moved = true;
                    
                    const rect = canvas.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    
                    dragState.attachment._dragX = mouseX - dragState.offsetX;
                    dragState.attachment._dragY = mouseY - dragState.offsetY;
                    dragState.attachment._dragging = true;
                    
                    if (xs && xs.sheet && xs.sheet.table) {
                        xs.sheet.table.render();
                    }
                };
                
                // mouseup：拖拽结束时计算目标单元格并更新 range
                const captureMouseup = (e) => {
                    if (!dragState) return;
                    
                    const att = dragState.attachment;
                    const wasMoved = dragState.moved;
                    
                    if (wasMoved) {
                        // 用卡片中心点定位目标单元格
                        const rInfo = att._renderInfo || {};
                        const cardCenterX = (att._dragX || 0) + (rInfo.width || 60) / 2;
                        const cardCenterY = (att._dragY || 0) + (rInfo.height || 50) / 2;
                        
                        const targetCell = getCellFromPosition(cardCenterX, cardCenterY);
                        if (targetCell) {
                            const rowSpan = att.range.endRow - att.range.startRow;
                            const colSpan = att.range.endCol - att.range.startCol;
                            att.range.startRow = targetCell.row;
                            att.range.startCol = targetCell.col;
                            att.range.endRow = targetCell.row + rowSpan;
                            att.range.endCol = targetCell.col + colSpan;
                            
                            // 记录拖拽落点的绝对像素坐标（加上当前滚动偏移），
                            // 渲染时再减去当前滚动，这样滚动后位置仍然正确
                            const scrollX = offset?.scroll?.x || 0;
                            const scrollY = offset?.scroll?.y || 0;
                            att._fixedX = (att._dragX || 0) + scrollX;
                            att._fixedY = (att._dragY || 0) + scrollY;
                            console.log('附件拖拽到:', targetCell, '新range:', att.range);
                        }
                    }
                    
                    delete att._dragging;
                    delete att._dragX;
                    delete att._dragY;
                    dragState = null;
                    
                    // 设置 justDragged 标志，在紧随其后的 click 中跳过选中切换
                    if (wasMoved) {
                        justDragged = true;
                        // 异步清除标志（click 事件触发完成后）
                        setTimeout(() => { justDragged = false; }, 0);
                    }
                    
                    if (xs && xs.sheet && xs.sheet.table) {
                        xs.sheet.table.render();
                    }
                };
                
                // click：如果刚完成拖拽则跳过，否则处理选中/下载
                const captureClick = (e) => {
                    if (justDragged) {
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        e.preventDefault();
                        return;
                    }
                    if (handleAttachmentClick(e)) {
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        e.preventDefault();
                    }
                };
                
                canvas.addEventListener('mousedown', captureMousedown, true);
                canvas.addEventListener('mousemove', captureMousemove, true);
                canvas.addEventListener('mouseup', captureMouseup, true);
                canvas.addEventListener('click', captureClick, true);
                if (canvas.parentElement) {
                    canvas.parentElement.addEventListener('mousedown', captureMousedown, true);
                    canvas.parentElement.addEventListener('mousemove', captureMousemove, true);
                    canvas.parentElement.addEventListener('mouseup', captureMouseup, true);
                    canvas.parentElement.addEventListener('click', captureClick, true);
                }
                if (rootRef.value) {
                    rootRef.value.addEventListener('mousedown', captureMousedown, true);
                    rootRef.value.addEventListener('mousemove', captureMousemove, true);
                    rootRef.value.addEventListener('mouseup', captureMouseup, true);
                    rootRef.value.addEventListener('click', captureClick, true);
                }
                // document 级别监听 mouseup/mousemove，防止鼠标移出 canvas 后丢失事件
                docMousemoveHandler = captureMousemove;
                docMouseupHandler = captureMouseup;
                document.addEventListener('mousemove', docMousemoveHandler, true);
                document.addEventListener('mouseup', docMouseupHandler, true);
                
                if (props.src) {
                    console.log('=== 开始加载Excel文件 ===');
                    console.log('props.src:', props.src);
                    getData(props.src, props.requestOptions).then(renderExcel).catch(e => {
                        console.error('加载Excel文件失败:', e);
                        mediasSource = [];
                        workbookDataSource = {
                            _worksheets:[]
                        };
                        xs.loadData({});
                        emit('error', e);
                    });
                }
            });
        });

        onBeforeUnmount(()=>{
            // 清理 document 级别的事件监听
            if (docMousemoveHandler) {
                document.removeEventListener('mousemove', docMousemoveHandler, true);
                docMousemoveHandler = null;
            }
            if (docMouseupHandler) {
                document.removeEventListener('mouseup', docMouseupHandler, true);
                docMouseupHandler = null;
            }
            xs = null;
        });
        watch(() => props.src, () => {
            if (props.src) {
                getData(props.src, props.requestOptions).then(renderExcel).catch(e => {
                    mediasSource = [];
                    workbookDataSource = {
                        _worksheets:[]
                    };
                    xs.loadData({});
                    emit('error', e);
                });
            } else {
                mediasSource = [];
                workbookDataSource = {
                    _worksheets:[]
                };
                xs.loadData({});
                emit('error', new Error('src属性不能为空'));
            }
        });
        function getIconText(iconType) {
            const textMap = {
                'word': 'W',
                'excel': 'X',
                'pdf': 'P',
                'ppt': 'P',
                'zip': 'Z',
                'csv': 'C',
                'text': 'T',
                'image': 'I',
                'ole': 'O',
                'unknown': '?'
            };
            return textMap[iconType] || '?';
        }
        
        function getIconColor(iconType) {
            const colorMap = {
                'word': '#2b579a',
                'excel': '#217346',
                'pdf': '#e74c3c',
                'ppt': '#d24726',
                'zip': '#f39c12',
                'csv': '#27ae60',
                'text': '#95a5a6',
                'image': '#9b59b6',
                'ole': '#e67e22',
                'unknown': '#95a5a6'
            };
            return colorMap[iconType] || colorMap['unknown'];
        }
        
        function getAttachmentIconPath(iconType) {
            // 与 media.js 中 getIconBaseUrl() 保持一致：
            // - 优先使用宿主项目通过 window.__LUCKY_OFFICE_ICON_BASE__ 自定义的路径
            // - 否则走当前页面的 import.meta.env.BASE_URL，约定图标放在 static/icons/ 下
            let base = '/static/icons/';
            if (typeof window !== 'undefined' && window.__LUCKY_OFFICE_ICON_BASE__) {
                base = window.__LUCKY_OFFICE_ICON_BASE__;
            } else {
                try {
                    const envBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
                    base = envBase.endsWith('/') ? `${envBase}static/icons/` : `${envBase}/static/icons/`;
                } catch (e) {
                    // 保留默认 /static/icons/
                }
            }
            const iconMap = {
                'word': `${base}WORD.png`,
                'excel': `${base}ECEL.png`,
                'pdf': `${base}PDF.png`,
                'ppt': `${base}PPT.png`,
                'zip': `${base}ZIP.png`,
                'csv': `${base}CSV.png`,
                'ole': `${base}附件-其他附件.png`,
                'unknown': `${base}附件-其他附件.png`
            };
            return iconMap[iconType] || iconMap.unknown;
        }
        
        // 处理附件点击
        function handleAttachmentClick(attachment) {
            // 由外部消费 attachment 选中事件即可，无需在此打日志
        }
        
        // 处理下载
        function handleDownload(attachment) {
            downloadOLEObject(attachment);
        }
        
        function save(fileName){
            downloadFile(fileName || `vue-office-excel-${new Date().getTime()}.xlsx`,fileData);
        }
        return {
            wrapperRef,
            rootRef,
            attachmentInfo,
            getIconText,
            getIconColor,
            getAttachmentIconPath,
            save,
            // OLE相关方法
            handleAttachmentClick,
            handleDownload,
            formatFileSize
        };
    }
});
</script>

<template>
    <div class="vue-office-excel" ref="wrapperRef">
        <div class="vue-office-excel-main" ref="rootRef"></div>
        <!-- 附件信息显示区域（隐藏，附件改为画布上直接渲染） -->
        <div v-if="false" class="vue-office-excel-attachments" :class="{ 'has-attachments': attachmentInfo.length > 0 }">
            <div class="attachments-title">附件列表 ({{ attachmentInfo.length }})</div>
            <div v-if="attachmentInfo.length === 0" class="no-attachments">
                暂无附件
            </div>
            <div v-for="(att, index) in attachmentInfo" :key="index" 
                 class="attachment-item" 
                 :class="{ 'ole-attachment': att.isOLE }"
                 @click="handleAttachmentClick(att)">
                <img :src="getAttachmentIconPath(att.iconType)" class="attachment-icon-img" :alt="att.name">
                <div class="attachment-content">
                    <span class="attachment-name">{{ att.name }}</span>
                    <div v-if="att.isOLE" class="attachment-meta">
                        <span class="ole-tag">OLE对象</span>
                        <span v-if="att.parsed && att.parsed.extension" class="file-type">
                            ({{ att.parsed.extension.toUpperCase() }})
                        </span>
                        <span v-if="att.buffer" class="file-size">
                            {{ formatFileSize(att.buffer.length) }}
                        </span>
                    </div>
                </div>
                <div v-if="att.isOLE" class="download-btn" @click.stop="handleDownload(att)">
                    下载
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="less">
.vue-office-excel {
    height: 100%;
    overflow: hidden;
    position: relative;
    .vue-office-excel-main {
        height: 100%;
    }
    .vue-office-excel-attachments {
        position: absolute;
        bottom: 10px;
        right: 10px;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        max-width: 320px;
        z-index: 100;
        min-width: 200px;
        max-height: 400px;
        overflow-y: auto;
        
        .attachments-title {
            font-weight: bold;
            margin-bottom: 8px;
            padding-bottom: 5px;
            border-bottom: 1px solid #eee;
            font-size: 13px;
        }
        .no-attachments {
            font-size: 12px;
            color: #999;
            text-align: center;
            padding: 5px 0;
        }
        .attachment-item {
            display: flex;
            align-items: center;
            padding: 8px;
            margin-bottom: 4px;
            border-radius: 6px;
            cursor: pointer;
            transition: background-color 0.2s;
            
            &:hover {
                background-color: #f5f5f5;
            }
            
            &.ole-attachment {
                background-color: #fff9e6;
                border-left: 3px solid #ffa500;
                
                &:hover {
                    background-color: #fff3cc;
                }
            }
            
            .attachment-icon-img {
                width: 32px;
                height: 32px;
                margin-right: 10px;
                object-fit: contain;
            }
            
            .attachment-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                
                .attachment-name {
                    font-size: 13px;
                    color: #333;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-weight: 500;
                }
                
                .attachment-meta {
                    display: flex;
                    gap: 8px;
                    margin-top: 4px;
                    font-size: 11px;
                    color: #666;
                    
                    .ole-tag {
                        background-color: #ffa500;
                        color: white;
                        padding: 1px 6px;
                        border-radius: 3px;
                        font-size: 10px;
                        font-weight: bold;
                    }
                    
                    .file-type, .file-size {
                        color: #888;
                    }
                }
            }
            
            .download-btn {
                background-color: #007bff;
                color: white;
                border: none;
                padding: 4px 10px;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
                transition: background-color 0.2s;
                
                &:hover {
                    background-color: #0056b3;
                }
            }
        }
    }
}
</style>
