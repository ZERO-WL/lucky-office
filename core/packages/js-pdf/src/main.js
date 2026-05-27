import {workerStr} from './worker.js';
import {pdfLibJsStr} from './pdf.js';
import {download as downloadFile, getUrl, loadScript} from '../../../utils/url';
import omit from 'lodash/omit';
import {debounce} from "lodash/function";

const pdfJsLibSrc = `data:text/javascript;base64,${pdfLibJsStr}`;
const PdfJsWorkerSrc = `data:text/javascript;base64,${workerStr}`;
let pdfJsLibLoaded = false;
let workerLoaded = false;
class JsPdfPreview{
    container = null;
    wrapper = null;
    wrapperMain = null;
    options = {};
    requestOptions = {};
    pdfDocument = null;
    loopCheckTimer = null;
    totalItems = 0; //pdf总页数
    pageWidth = 0;  //每个canvas dom宽度
    pageHeight = 0; //每个canvas dom高度
    containerHeight = 0; //外层容器高度
    visibleItems = 6; //可视区域内的页面数量，根据pdf高度重新计算
    canvasWidth = 0; //画布的尺寸-宽
    canvasHeight = 0; //画布的尺寸-高
    getViewportScale =2; //缩放比例
    onScroll = debounce( (e) => {
        const { scrollTop} = e.target;
        let paddingTop = parseInt(getComputedStyle(this.wrapperMain).paddingTop);
        const gap = this.options.gap || 10;
        const startIndex = Math.max(
            Math.floor(Math.max((scrollTop - paddingTop), 0) / (this.pageHeight + gap)) - 1,
            1
        );
        const endIndex = Math.min(startIndex + this.visibleItems - 1, this.totalItems); // 计算结束索引

        this.renderList(startIndex, endIndex); // 渲染列表项
    }, 60)
    constructor(container, options={}, requestOptions={}) {
        this.container = container;
        this.options = {
            staticFileUrl: 'https://unpkg.com/pdfjs-dist@3.1.81/',
            ...options
        };
        this.requestOptions = requestOptions;
        this.createWrapper();
        this.createWrapperMain();
    }
    createWrapper(){
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'vue-office-pdf';
        this.wrapper.setAttribute('style', 'text-align: center;overflow-y: auto;position: relative;height:100%');
        this.container.appendChild(this.wrapper);
        this.wrapper.addEventListener('scroll', this.onScroll);
    }
    createWrapperMain(){
        this.wrapperMain = document.createElement('div');
        this.wrapperMain.className = 'vue-office-pdf-wrapper';
        this.wrapperMain.setAttribute('style', 'background: gray; padding: 30px 0;position: relative;box-sizing: content-box');
        this.wrapper.appendChild(this.wrapperMain);
    }
    installPdfScript() {
        return loadScript(pdfJsLibSrc).then(() => {
            if (window.pdfjsLib && !workerLoaded) {
                workerLoaded = true;
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = PdfJsWorkerSrc;
            } else {
                return Promise.reject('window.pdfjsLib未找到');
            }
        });
    }
    waitPdfjsLoad(){
        return new Promise((resolve)=>{
            const loopCheck = () =>{
                if(window.pdfjsLib) {
                    resolve();
                }else{
                    this.loopCheckTimer = setTimeout(loopCheck, 10);
                }
            };
            loopCheck();
        });
    }
    checkPdfLib() {
        if (window.pdfjsLib) {
            return Promise.resolve();
        }
        if(!pdfJsLibLoaded){
            pdfJsLibLoaded = true;
            return this.installPdfScript();
        }else{
            return this.waitPdfjsLoad();
        }
    }
    getDocument(src){
        const loadingTask = window.pdfjsLib.getDocument({
            url: getUrl(src, { type: 'application/pdf' }),
            httpHeaders: this.requestOptions && this.requestOptions.headers,
            withCredentials: this.requestOptions && this.requestOptions.withCredentials,
            cMapUrl: `${this.options.staticFileUrl.endsWith('/') ? this.options.staticFileUrl : this.options.staticFileUrl + '/'}cmaps/`,
            cMapPacked: true,
            enableXfa: true,
            ...omit(this.options, ['width', 'staticFileUrl'])
        });
        return loadingTask.promise;
    }
    renderSinglePage(num, canvas){
        return this.pdfDocument.getPage(num).then((pdfPage) => {
            const viewport = pdfPage.getViewport({ scale: this.getViewportScale });
            let outputScale = window.devicePixelRatio > 2 ? 1.5 : 2;
            if(this.canvasWidth * viewport.height !== this.canvasHeight * viewport.width ){
                let width = Math.floor(viewport.width * outputScale);
                let height =  Math.floor(viewport.height * outputScale);
                let scale =  this.canvasHeight / height;
                outputScale = outputScale * scale;
                canvas.width = width * scale;
                canvas.style.width = parseInt(canvas.style.width) * scale + 'px';
            }
            const ctx = canvas.getContext('2d');
            const transform = outputScale !== 1
                ? [outputScale, 0, 0, outputScale, 0, 0]
                : null;

            const renderTask = pdfPage.render({
                canvasContext: ctx,
                transform,
                viewport
            });
            return renderTask.promise;
        });
    }
    getPageSize(pdfDocument){
        return pdfDocument.getPage(1).then((pdfPage) => {
            const maxWidth = this.options.width || this.wrapper.getBoundingClientRect().width - 20;
            let viewport = pdfPage.getViewport({ scale: 1 });
            if(viewport.width > maxWidth * 1.5) {
                this.getViewportScale = 0.5;
            }else if(viewport.width > maxWidth) {
                this.getViewportScale = 1;
            }else {
                this.getViewportScale = 2;
            }
            viewport = pdfPage.getViewport({ scale: this.getViewportScale });

            const outputScale = window.devicePixelRatio > 2 ? 1.5 : 2;
            let canvasWidth = Math.floor(viewport.width * outputScale);
            let canvasHeight = Math.floor(viewport.height * outputScale);
            let domWidth = Math.floor(viewport.width);
            let domHeight = Math.floor(viewport.height);
            if (this.options.width) {
                let scale = this.options.width / domWidth;
                domWidth = Math.floor(this.options.width);
                domHeight = Math.floor(domHeight * scale);
            }
            let wrapperWidth = this.wrapper.getBoundingClientRect().width - 20;
            if (domWidth > wrapperWidth) {
                let scale = wrapperWidth / domWidth;
                domWidth = Math.floor(wrapperWidth);
                domHeight = Math.floor(domHeight * scale);
            }

            return {
                width: domWidth,
                height: domHeight,
                canvasWidth,
                canvasHeight
            }
        });
    }
    createCanvas(index){
        let paddingTop = parseInt(getComputedStyle(this.wrapperMain).paddingTop);

        let gap = this.options.gap || 10;
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = (index -1) * (this.pageHeight + gap) + paddingTop + 'px';
        canvas.style.left = '50%';
        canvas.style.transform = 'translate(-50%)';
        canvas.style.backgroundColor = '#fff';
        canvas.setAttribute('data-id', index);
        canvas.width = this.canvasWidth;
        canvas.height = this.canvasHeight;
        canvas.style.width = `${this.pageWidth}px`;
        canvas.style.height = `${this.pageHeight}px`;
        return canvas
    }

    clearAllCanvas(){
        this.wrapperMain && (this.wrapperMain.innerHTML = '');
    }
    setOptions(options) {
        this.options = options;
    }
    setRequestOptions(requestOptions) {
        this.requestOptions = requestOptions;
    }
    preview(src){
        if(!src){
            this.clearAllCanvas();
            this.options.onError && this.options.onError(new Error('预览地址不能为空'));
            return;
        }
        this.checkPdfLib().then(_=>{
            this.getDocument(src).then(pdfDocument=>{
                this.pdfDocument && this.pdfDocument.destroy();
                this.pdfDocument = pdfDocument;
                this.getPageSize(pdfDocument).then(res =>{
                    this.totalItems = pdfDocument.numPages;
                    this.containerHeight = this.wrapper.getBoundingClientRect().height
                    this.pageWidth = res.width;
                    this.pageHeight = res.height;
                    this.canvasWidth = res.canvasWidth;
                    this.canvasHeight = res.canvasHeight;

                    let gap = this.options.gap || 10;
                    this.visibleItems = Math.ceil(this.containerHeight / (this.pageHeight + gap)) + 4; //多渲染4个
                    let height = (this.pageHeight + gap)  * this.totalItems - gap;
                    this.wrapperMain.style.height = height + 'px';

                    this.clearAllCanvas();
                    this.renderList(1, Math.min(this.totalItems, this.visibleItems));
                }).catch(e=>{
                    this.clearAllCanvas();
                    this.options.onError && this.options.onError(e);
                });
            }).catch(e=>{
                this.clearAllCanvas();
                this.options.onError && this.options.onError(e);
            });
        }).catch(e=>{
            this.clearAllCanvas();
            this.options.onError && this.options.onError(e);
        });
    }
    renderList(startIndex, endIndex){
        let list  = this.wrapperMain;
        let originNodes = [...list.childNodes]
        let tasks = [];
        if(list.childNodes.length === 0){
            for (let i = startIndex; i <= endIndex; i++) {
                let canvas = this.createCanvas(i)
                list.appendChild(canvas);
                tasks.push(this.renderSinglePage(i, canvas));
            }
        }else{
            let min = +originNodes[0].getAttribute('data-id');
            let max = +originNodes[originNodes.length -1].getAttribute('data-id');
            if(endIndex < min || startIndex > max){
                for (let i = startIndex; i <= endIndex; i++) {
                    let canvas = this.createCanvas(i)
                    list.appendChild(canvas);
                    tasks.push(this.renderSinglePage(i, canvas));
                }
            }

            if(startIndex < min && endIndex >= min){
                let firstChildNode = originNodes[0]
                for (let i = min-1; i >= startIndex; i--) {
                    let canvas = this.createCanvas(i);
                    list.insertBefore(canvas, firstChildNode);
                    firstChildNode = canvas;
                    tasks.push(this.renderSinglePage(i, canvas));
                }
            }

            for (let i = 0; i <= max-min; i++) {
                let id = +originNodes[i].getAttribute('data-id')
                if(id < startIndex || id > endIndex){
                    list.removeChild(originNodes[i])
                }
            }

            if(endIndex > max && startIndex <= max){
                for (let i = max + 1; i <= endIndex; i++) {
                    let canvas = this.createCanvas(i)
                    list.appendChild(canvas);
                    tasks.push(this.renderSinglePage(i, canvas));
                }
            }
        }
        Promise.all(tasks).then(_=>{
            this.options.onRendered && this.options.onRendered();
        }).catch(e =>{
            this.options.onError && this.options.onError(e);
        });
    }
    rerender(){
        this.renderList(1, Math.min(this.totalItems, this.visibleItems));
    }
    save(fileName){
        this.pdfDocument && this.pdfDocument._transport && this.pdfDocument._transport.getData().then(fileData=>{
            downloadFile(fileName || `js-preview-pdf-${new Date().getTime()}.pdf`,fileData.buffer);
        });
    }
    destroy(){
        this.wrapper.removeEventListener('scroll', this.onScroll);
        this.container.removeChild(this.wrapper);
        this.container = null;
        this.wrapper = null;
        this.wrapperMain = null;
        this.options = {};
        this.requestOptions = {};
        this.pdfDocument && this.pdfDocument.destroy();
        this.pdfDocument = null;
        this.loopCheckTimer && clearTimeout(this.loopCheckTimer);
    }
}
export function init(container, options, requestOptions){
    return new JsPdfPreview(container, options, requestOptions);
}