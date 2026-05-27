let cache = [];
let clipWidth = 60; //左侧序号列宽
let clipHeight = 25; //顶部序号行高
let defaultColWidth = 80;
let defaultRowHeight = 24;
let devicePixelRatio = window.devicePixelRatio || 1;

const attachmentIcons = {};

function loadAttachmentIcon(type) {
    if (attachmentIcons[type]) {
        return Promise.resolve(attachmentIcons[type]);
    }
    
    const iconMap = {
        word: '/vue-office/examples/dist/static/icons/WORD.png',
        excel: '/vue-office/examples/dist/static/icons/ECEL.png',
        pdf: '/vue-office/examples/dist/static/icons/PDF.png',
        ppt: '/vue-office/examples/dist/static/icons/PPT.png',
        zip: '/vue-office/examples/dist/static/icons/ZIP.png',
        csv: '/vue-office/examples/dist/static/icons/CSV.png',
        ole: '/vue-office/examples/dist/static/icons/附件-其他附件.png',
        unknown: '/vue-office/examples/dist/static/icons/附件-其他附件.png'
    };
    
    const iconSrc = iconMap[type] || iconMap.unknown;
    if (!iconSrc) {
        return Promise.resolve(null);
    }
    
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            attachmentIcons[type] = img;
            resolve(img);
        };
        img.onerror = () => {
            console.warn(`Failed to load icon: ${iconSrc}`);
            resolve(null);
        };
        img.src = iconSrc;
    });
}

export function renderImage(ctx, medias, sheet, offset, options={}){
    // console.log('medias', medias);
    // console.log('sheet', sheet);
    // console.log('offset',  offset)
    if(sheet && sheet._media && sheet._media.length){
        sheet._media.forEach(media => {
            let {imageId, range, type} = media;
            if(type === 'image'){
                let position = calcPosition(sheet,range,offset, options);
                drawImage(ctx,imageId, medias[imageId], position);
            }
        });
    }

}

// 附件图标路径映射
const attachmentIconPaths = {
    word: '/vue-office/examples/dist/static/icons/WORD.png',
    excel: '/vue-office/examples/dist/static/icons/ECEL.png',
    pdf: '/vue-office/examples/dist/static/icons/PDF.png',
    ppt: '/vue-office/examples/dist/static/icons/PPT.png',
    zip: '/vue-office/examples/dist/static/icons/ZIP.png',
    csv: '/vue-office/examples/dist/static/icons/CSV.png',
    ole: '/vue-office/examples/dist/static/icons/附件-其他附件.png'
};

export function renderAttachments(ctx, sheet, offset, options={}) {
    try {
        console.log('=== renderAttachments 被调用 ===');
        console.log('ctx:', ctx);
        console.log('sheet:', sheet);
        console.log('sheet.name:', sheet?.name);
        console.log('sheet.attachments:', sheet?.attachments);
        console.log('sheet._media:', sheet?._media);
        
        if (!ctx) {
            console.log('renderAttachments: ctx is null');
            return;
        }
        
        if (!sheet) {
            console.log('renderAttachments: sheet is null');
            return;
        }
        
        if (!sheet?.attachments || sheet.attachments.length === 0) {
            console.log('renderAttachments: 没有附件数据');
            return;
        }
        
        console.log('=== 开始渲染附件 ===');
        console.log('总附件数:', sheet.attachments.length);
        
        let renderedCount = 0;
        // 把 offset 注入 options，供 renderAttachmentIcon / calcPosition 取滚动信息
        const mergedOptions = { ...options, offset };
        // 遍历附件并渲染 - 只有有range信息的才渲染在画布上
        sheet.attachments.forEach((attachment, index) => {
            if (!attachment.range) {
                console.log(`跳过附件 ${index}: 没有位置信息，不在画布上渲染`, attachment.name);
                return;
            }
            
            console.log(`渲染附件 ${index}:`, attachment);
            renderAttachmentIcon(ctx, attachment, index, sheet, mergedOptions);
            renderedCount++;
        });
        
        console.log(`=== 附件渲染完成，共渲染 ${renderedCount} 个 ===`);
    } catch (error) {
        console.error('renderAttachments error:', error);
    }
}

function drawFileIcon(ctx, x, y, size, iconType) {
    ctx.save();
    
    // 绘制背景
    ctx.fillStyle = getIconBackgroundColor(iconType);
    
    // 绘制圆角矩形背景
    const padding = 2 * devicePixelRatio;
    const radius = 3 * devicePixelRatio;
    ctx.beginPath();
    ctx.moveTo(x + radius + padding, y + padding);
    ctx.lineTo(x + size - radius + padding, y + padding);
    ctx.quadraticCurveTo(x + size + padding, y + padding, x + size + padding, y + radius + padding);
    ctx.lineTo(x + size + padding, y + size - radius + padding);
    ctx.quadraticCurveTo(x + size + padding, y + size + padding, x + size - radius + padding, y + size + padding);
    ctx.lineTo(x + radius + padding, y + size + padding);
    ctx.quadraticCurveTo(x + padding, y + size + padding, x + padding, y + size - radius + padding);
    ctx.lineTo(x + padding, y + radius + padding);
    ctx.quadraticCurveTo(x + padding, y + padding, x + radius + padding, y + padding);
    ctx.closePath();
    ctx.fill();
    
    // 绘制图标文字
    const iconText = getIconText(iconType);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${(size * 0.4)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(iconText, x + size / 2 + padding, y + size / 2 + padding);
    
    ctx.restore();
}

function getIconBackgroundColor(iconType) {
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



function renderAttachmentIcon(ctx, attachment, index, sheet, options) {
  try {
    // 检查是否有range信息，没有的话不应该在这里渲染
    if (!attachment.range) {
      console.log('renderAttachmentIcon: 附件没有range信息，跳过画布渲染', attachment.name);
      return;
    }
    
    // 计算单元格区域 - 使用 sheet 计算准确位置
    const position = calcPosition(sheet, attachment.range, options.offset || {}, options);
    
    // 防御 NaN：如果 position.height/width 是 NaN 或 undefined，使用默认值
    const cellHeight = (position.height && !isNaN(position.height)) ? position.height : (defaultRowHeight * devicePixelRatio);
    const cellWidth = (position.width && !isNaN(position.width)) ? position.width : (defaultColWidth * devicePixelRatio);
    
    // 卡片尺寸（限制最大宽高，避免一个附件占据过大区域）
    const padding = 6 * devicePixelRatio;
    const maxCardWidth = 140 * devicePixelRatio;
    const cardWidth = Math.min(cellWidth - padding * 2, maxCardWidth);
    const cardHeight = Math.min(cellHeight - padding * 2, 90 * devicePixelRatio);
    
    // 卡片左上角坐标：拖拽中由鼠标驱动；有固定坐标时减去滚动偏移后使用；否则在 cell 中居中放置
    let cardX, cardY;
    if (attachment._dragging && typeof attachment._dragX === 'number' && typeof attachment._dragY === 'number') {
      cardX = attachment._dragX * devicePixelRatio;
      cardY = attachment._dragY * devicePixelRatio;
    } else if (typeof attachment._fixedX === 'number' && typeof attachment._fixedY === 'number') {
      // _fixedX/Y 是绝对坐标（含滚动），渲染时需减去当前滚动偏移
      const scrollX = (options.offset && options.offset.scroll) ? options.offset.scroll.x : 0;
      const scrollY = (options.offset && options.offset.scroll) ? options.offset.scroll.y : 0;
      cardX = (attachment._fixedX - scrollX) * devicePixelRatio;
      cardY = (attachment._fixedY - scrollY) * devicePixelRatio;
    } else {
      cardX = position.x + (cellWidth - cardWidth) / 2;
      cardY = position.y + (cellHeight - cardHeight) / 2;
    }
    
    const iconSize = Math.min(36 * devicePixelRatio, cardHeight * 0.55);
    const iconX = cardX + (cardWidth - iconSize) / 2;
    const iconY = cardY + 8 * devicePixelRatio;
    
    // 是否选中
    const isSelected = !!attachment._selected;
    
    // 计算下载按钮位置（在卡片底部右侧）
    const downloadBtnW = 44 * devicePixelRatio;
    const downloadBtnH = 18 * devicePixelRatio;
    const downloadBtnX = cardX + cardWidth - downloadBtnW - 6 * devicePixelRatio;
    const downloadBtnY = cardY + cardHeight - downloadBtnH - 4 * devicePixelRatio;
    attachment._downloadBtnInfo = {
      x: downloadBtnX / devicePixelRatio,
      y: downloadBtnY / devicePixelRatio,
      width: downloadBtnW / devicePixelRatio,
      height: downloadBtnH / devicePixelRatio,
    };

    // 计算预览按钮位置（在下载按钮左侧并排）
    const previewBtnW = 44 * devicePixelRatio;
    const previewBtnH = 18 * devicePixelRatio;
    const previewBtnGap = 4 * devicePixelRatio;
    const previewBtnX = downloadBtnX - previewBtnW - previewBtnGap;
    const previewBtnY = downloadBtnY;
    attachment._previewBtnInfo = {
      x: previewBtnX / devicePixelRatio,
      y: previewBtnY / devicePixelRatio,
      width: previewBtnW / devicePixelRatio,
      height: previewBtnH / devicePixelRatio,
    };
    
    // 存储附件位置信息，用于点击交互（以 CSS 像素为单位）
    if (!attachment._renderInfo) {
      attachment._renderInfo = {};
    }
    attachment._renderInfo.x = cardX / devicePixelRatio;
    attachment._renderInfo.y = cardY / devicePixelRatio;
    attachment._renderInfo.width = cardWidth / devicePixelRatio;
    attachment._renderInfo.height = cardHeight / devicePixelRatio;
    
    const iconType = attachment.iconType || attachment.type || 'unknown';
    const cachedImg = attachmentIcons[iconType];
    
    // 如果图标未缓存，先异步加载并触发重绘
    if (!cachedImg) {
      loadAttachmentIcon(iconType).then(() => {
        // 触发外部重绘（通过 options 传入的 onIconLoaded 回调）
        if (typeof options.onIconLoaded === 'function') {
          options.onIconLoaded();
        }
      });
      return;
    }
    
    // 同步绘制：背景 → 图标 → 名称 → (选中态下)下载按钮
    drawAttachmentCard(ctx, attachment, {
      cardX, cardY, cardWidth, cardHeight,
      iconX, iconY, iconSize,
      downloadBtnX, downloadBtnY, downloadBtnW, downloadBtnH,
      previewBtnX, previewBtnY, previewBtnW, previewBtnH,
      isSelected, cachedImg, iconType, index,
      isDragging: !!attachment._dragging,
    });
    
  } catch (error) {
    console.error('renderAttachmentIcon error:', error);
  }
}

function drawAttachmentCard(ctx, attachment, p) {
  const {cardX, cardY, cardWidth, cardHeight, iconX, iconY, iconSize,
    downloadBtnX, downloadBtnY, downloadBtnW, downloadBtnH,
    previewBtnX, previewBtnY, previewBtnW, previewBtnH,
    isSelected, cachedImg, iconType, index, isDragging} = p;
  
  // 1. 卡片背景与边框
  ctx.save();
  if (isDragging) {
    ctx.globalAlpha = 0.75;
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 12 * devicePixelRatio;
    ctx.shadowOffsetX = 2 * devicePixelRatio;
    ctx.shadowOffsetY = 4 * devicePixelRatio;
  }
  ctx.fillStyle = isSelected ? '#E6F4FF' : '#FFFFFF';
  ctx.strokeStyle = isSelected ? '#1890FF' : (isDragging ? '#1890FF' : '#D9D9D9');
  ctx.lineWidth = (isSelected || isDragging ? 2 : 1) * devicePixelRatio;
  drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, 4 * devicePixelRatio);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  
  // 2. 图标（顶部居中）
  if (cachedImg) {
    ctx.save();
    ctx.drawImage(cachedImg, iconX, iconY, iconSize, iconSize);
    ctx.restore();
  } else {
    drawFileIcon(ctx, iconX, iconY, iconSize, iconType);
  }
  
  // 3. 文件名（图标下方居中）
  const name = attachment.name || attachment.originalName || `附件${index + 1}`;
  ctx.save();
  ctx.fillStyle = '#333333';
  ctx.font = `${11 * devicePixelRatio}px Arial`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  
  const textY = iconY + iconSize + 4 * devicePixelRatio;
  const textMaxWidth = cardWidth - 8 * devicePixelRatio;
  let displayName = name;
  const textWidth = ctx.measureText(name).width;
  if (textWidth > textMaxWidth) {
    const ellipsisW = ctx.measureText('...').width;
    let truncatedWidth = 0;
    for (let i = 0; i < name.length; i++) {
      truncatedWidth += ctx.measureText(name[i]).width;
      if (truncatedWidth > textMaxWidth - ellipsisW) {
        displayName = name.substring(0, i) + '...';
        break;
      }
    }
  }
  ctx.fillText(displayName, cardX + cardWidth / 2, textY);
  ctx.restore();
  
  // 4. 选中态：绘制预览按钮 + 下载按钮
  if (isSelected) {
    // 预览按钮：白底 + 蓝边 + 蓝字（次要操作）
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#1890FF';
    ctx.lineWidth = 1 * devicePixelRatio;
    drawRoundRect(ctx, previewBtnX, previewBtnY, previewBtnW, previewBtnH, 3 * devicePixelRatio);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1890FF';
    ctx.font = `${10 * devicePixelRatio}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('预览', previewBtnX + previewBtnW / 2, previewBtnY + previewBtnH / 2);
    ctx.restore();

    // 下载按钮：蓝底白字（主操作）
    ctx.save();
    ctx.fillStyle = '#1890FF';
    drawRoundRect(ctx, downloadBtnX, downloadBtnY, downloadBtnW, downloadBtnH, 3 * devicePixelRatio);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${10 * devicePixelRatio}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('下载', downloadBtnX + downloadBtnW / 2, downloadBtnY + downloadBtnH / 2);
    ctx.restore();
  }
}

function drawRoundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function calcPosition(sheet, range, offset, options){
    let {widthOffset, heightOffset} = options;
    
    let nativeCol = 0, nativeColOff = 0, nativeRow = 0, nativeRowOff = 0;
    let nativeColEnd = 0, nativeColOffEnd = 0, nativeRowEnd = 0, nativeRowOffEnd = 0;
    let isSimpleRange = false;
    
    if (range.tl && range.br) {
        // 使用tl和br格式
        let {tl, br} = range;
        ({nativeCol=0, nativeColOff=0, nativeRow=0, nativeRowOff=0} = tl);
        ({nativeCol: nativeColEnd=0, nativeColOff: nativeColOffEnd=0, nativeRow: nativeRowEnd=0, nativeRowOff: nativeRowOffEnd=0} = br);
    } else if (range.startRow !== undefined && range.startCol !== undefined) {
        // 使用简单的startRow/startCol格式
        nativeRow = range.startRow;
        nativeCol = range.startCol;
        nativeRowEnd = range.endRow !== undefined ? range.endRow : range.startRow;
        nativeColEnd = range.endCol !== undefined ? range.endCol : range.startCol;
        isSimpleRange = true;
    }

    let basicX = clipWidth;
    let basicY = clipHeight;
    for(let i=0; i < nativeCol; i++){
        basicX += sheet?._columns?.[i]?.width*6 || defaultColWidth;
        basicX += widthOffset || 0;
    }
    for(let i=0; i < nativeRow; i++){
        basicY += sheet?._rows?.[i]?.height || defaultRowHeight;
        basicY += heightOffset || 0;
    }
    let x = basicX + nativeColOff/12700;
    let y = basicY + nativeRowOff/12700;

    let width = 0;
    let height = 0;
    if(nativeCol === nativeColEnd && range.br){
        width = (nativeColOffEnd - nativeColOff) / 12700;
    }else if(range.br) {
        width = (sheet?._columns?.[nativeCol]?.width*6 || defaultColWidth) - nativeColOff/12700;

        for(let i = nativeCol+1; i < nativeColEnd; i++){
            width += sheet?._columns?.[i]?.width*6 || defaultColWidth;
        }
        width += nativeColOffEnd / 12700;
    }else if(range.ext?.width){
        width = range.ext.width / 1.333333;
    }else if(isSimpleRange){
        // simple range 格式：累加 nativeCol 到 nativeColEnd 的列宽
        for(let i = nativeCol; i <= nativeColEnd; i++){
            width += sheet?._columns?.[i]?.width*6 || defaultColWidth;
        }
        if(width === 0){
            width = defaultColWidth;
        }
    }
    if(nativeRow === nativeRowEnd && range.br){
        height = (nativeRowOffEnd - nativeRowOff) / 12700;
    }else if(range.br) {
        height = (sheet?._rows?.[nativeRow]?.height || defaultRowHeight) - nativeRowOff/12700;
        for(let i = nativeRow+1; i < nativeRowEnd; i++){
            height += sheet?._rows?.[i]?.height || defaultRowHeight;
        }
        height += nativeRowOffEnd / 12700;
    }else if(range.ext?.height){
        height = range.ext.height / 1.333333;
    }else if(isSimpleRange){
        // simple range 格式：累加 nativeRow 到 nativeRowEnd 的行高
        for(let i = nativeRow; i <= nativeRowEnd; i++){
            height += sheet?._rows?.[i]?.height || defaultRowHeight;
        }
        if(height === 0){
            height = defaultRowHeight;
        }
    }

    return {
        x: (x - (offset?.scroll?.x || 0)) * devicePixelRatio,
        y: (y - (offset?.scroll?.y || 0)) * devicePixelRatio,
        width: width * devicePixelRatio,
        height: height * devicePixelRatio
    };
}
export function clearCache(){
    cache = [];
}

function drawImage(ctx,index, data, position){
    getImage(index, data).then(image=>{
        let sx = 0;
        let sy = 0;
        let sWidth = image.width;
        let sHeight = image.height;
        let dx = position.x;
        let dy = position.y;
        let dWidth = position.width;
        let dHeight = position.height;
        let scaleX = dWidth / sWidth;
        let scaleY = dHeight / sHeight;

        if(dx < clipWidth * devicePixelRatio){
            let diff = clipWidth * devicePixelRatio - dx;
            dx = clipWidth * devicePixelRatio;
            dWidth -= diff;
            sWidth -= diff/scaleX;
            sx += diff/scaleX;
        }
        if(dy < clipHeight * devicePixelRatio){
            let diff = clipHeight * devicePixelRatio - dy;
            dy = clipHeight * devicePixelRatio;
            dHeight -= diff;
            sHeight -= diff/scaleY;
            sy += diff/scaleY;
        }
        // console.log('=>', sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
        let scale =  window.outerWidth / window.innerWidth;
        ctx.drawImage(image, sx, sy, sWidth, sHeight, dx*scale, dy*scale, dWidth*scale, dHeight*scale);
    }).catch(e=>{
        console.error(e);
    });
}
function getImage(index, data){
    return new Promise(((resolve, reject) => {
        if(cache[index]){
            return resolve(cache[index]);
        }
        const {buffer} = data.buffer;
        let blob = new Blob([buffer], { type: 'image/' + data.extension});
        let url = URL.createObjectURL(blob);
        let image = new Image();
        image.src = url;
        image.onload = function (){
            resolve(image);
            cache[index] = image;
        };
        image.onerror = function (e){
            reject(e);
        };
    }));

}
