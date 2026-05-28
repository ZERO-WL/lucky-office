<script>
import { defineComponent, ref, onMounted, watch, onBeforeUnmount } from 'vue';
import workerStr from './worker?raw';
import pdfjsLib from './pdf?raw';
import { download as downloadFile, getUrl, loadScript } from '../../../utils/url';
import { base64_encode } from '../../../utils/base64';
import omit from 'lodash/omit';
import {debounce} from "lodash/function";

const pdfJsLibSrc = `data:text/javascript;base64,${(base64_encode(pdfjsLib))}`;
const PdfJsWorkerSrc = `data:text/javascript;base64,${(base64_encode(workerStr))}`;
let pdfJsLibLoaded = false;
let workerLoaded = false;
export default defineComponent({
    name: 'VueOfficePdf',
    props: {
        src: [String, ArrayBuffer, Blob],
        requestOptions: {
            type: Object,
            default: () => ({})
        },
        staticFileUrl: {
            type: String,
            default: 'https://unpkg.com/pdfjs-dist@3.1.81/'
        },
        options: {
            type: Object,
            default: () => ({})
        },
        defaultScale: {
            type: Number,
            default: 1
        }
    },
    emits: ['rendered', 'error'],
    setup(props, { emit }) {
        let pdfDocument = null;
        let loadingTask = null;
        const containerRef = ref(null); //最外层容器
        const wrapperRef = ref(null);   //canvas渲染外层容器

        const rootRef = ref([]); //todo 待删除
        const numPages = ref(0); //todo 待删除

        let totalItems = 0; //pdf总页数
        let pageWidth = 0;  //每个canvas dom宽度
        let pageHeight = 0; //每个canvas dom高度
        let containerHeight = 0; //外层容器高度
        let visibleItems = 6; //可视区域内的页面数量，根据pdf高度重新计算
        let canvasWidth = 0; //画布的尺寸-宽
        let canvasHeight = 0; //画布的尺寸-高

        let loopCheckTimer = null;

        let getViewportScale = 2;
        let userScale = ref(props.options.defaultScale || 1);

        onBeforeUnmount(()=>{
            if(pdfDocument === null){
                return;
            }
            pdfDocument.destroy();
            pdfDocument = null;
            loadingTask = null;
            loopCheckTimer && clearTimeout(loopCheckTimer);
        });
        function getScale(){
            return userScale;
        }
        function setScale(scale){
            userScale.value = scale;
            init();
        }
        function installPdfScript() {
            return loadScript(pdfJsLibSrc).then(() => {
                if (window.pdfjsLib && !workerLoaded) {
                    workerLoaded = true;
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PdfJsWorkerSrc;
                } else {
                    return Promise.reject('window.pdfjsLib未找到');
                }
            });
        }

        function waitPdfjsLoad(){
            return new Promise((resolve)=>{
                const loopCheck = () =>{
                    if(window.pdfjsLib) {
                        resolve();
                    }else{
                        loopCheckTimer = setTimeout(loopCheck, 10);
                    }
                };
                loopCheck();
            });
        }
        function checkPdfLib() {
            if (window.pdfjsLib) {
                return Promise.resolve();
            }
            if(!pdfJsLibLoaded){
                pdfJsLibLoaded = true;
                return installPdfScript();
            }else{
                return waitPdfjsLoad();
            }

        }

        function clearCanvas(){
            wrapperRef.value.innerHTML = '';
        }
        function init() {
            if (!props.src) {
                clearCanvas();
                emit('error', new Error('src不能为空'))
                return;
            }
            loadingTask = window.pdfjsLib.getDocument({
                url: getUrl(props.src, { type: 'application/pdf' }),
                // httpHeaders: props.requestOptions && props.requestOptions.headers,
                withCredentials: props.requestOptions && props.requestOptions.withCredentials,
                cMapUrl: `${props.staticFileUrl.endsWith('/') ? props.staticFileUrl : props.staticFileUrl + '/'}cmaps/`,
                cMapPacked: true,
                enableXfa: true,
                ...omit(props.options, ['width'])
            });
            loadingTask.promise.then((pdf) => {
                pdfDocument && pdfDocument.destroy();
                pdfDocument = pdf;

                getPageSize(pdfDocument).then(res =>{
                    totalItems = pdfDocument.numPages;
                    containerHeight = containerRef.value.getBoundingClientRect().height
                    pageWidth = res.width;
                    pageHeight = res.height;
                    canvasWidth = res.canvasWidth;
                    canvasHeight = res.canvasHeight;

                    let gap = props.options.gap || 10;
                    visibleItems = Math.ceil(containerHeight / (pageHeight + gap)) + 4; //多渲染4个
                    let height = (pageHeight + gap)  * totalItems - gap;
                    wrapperRef.value.style.height = height + 'px';

                    clearCanvas();
                    renderList(1, Math.min(totalItems, visibleItems));
                })
            }).catch((e) => {
                emit('error', e);
            });
        }

        function getPageSize(pdfDocument){
            return pdfDocument.getPage(1).then((pdfPage) => {
                let maxWidth = props.options.width || ( wrapperRef.value.getBoundingClientRect().width - 20);
                let viewport = pdfPage.getViewport({ scale: 1 });
                if(viewport.width > maxWidth * 2) {
                    getViewportScale = 0.5;
                }else if(viewport.width > maxWidth) {
                    getViewportScale = 1;
                }else {
                    getViewportScale = 2;
                }
                viewport = pdfPage.getViewport({ scale: getViewportScale * (userScale.value < 1 ? userScale.value : 1) });
                const outputScale = window.devicePixelRatio > 2 ? 1.5 : 2;
                let canvasWidth = Math.floor(viewport.width * outputScale);
                let canvasHeight = Math.floor(viewport.height * outputScale);

                let domWidth = Math.floor(viewport.width);
                let domHeight = Math.floor(viewport.height);
                if (props.options.width) {
                    let scale = props.options.width / domWidth;
                    domWidth = Math.floor(props.options.width);
                    domHeight = Math.floor(domHeight * scale);
                }
                let wrapperWidth = wrapperRef.value.getBoundingClientRect().width - 20;
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
            }).catch((e) => {
                emit('error', e);
            });
        }
        const onScrollPdf = debounce(function (e) {
            const { scrollTop} = e.target;
            let paddingTop = parseInt(getComputedStyle(wrapperRef.value).paddingTop) || 0;
            const gap = props.options.gap || 10;
            const startIndex = Math.max(
                Math.floor(Math.max((scrollTop - paddingTop), 0) / (pageHeight + gap)) - 1,
                1
            );
            const endIndex = Math.min(startIndex + visibleItems - 1, totalItems); // 计算结束索引

            renderList(startIndex, endIndex); // 渲染列表项
        }, 60)


        function createCanvas(index){
            let paddingTop = parseInt(getComputedStyle(wrapperRef.value).paddingTop) || 0;
            let gap = props.options.gap || 10;
            const canvas = document.createElement('canvas');
            canvas.style.position = 'absolute';
            canvas.style.top = (index -1) * (pageHeight + gap) + paddingTop + 'px';
            canvas.style.left = '50%';
            canvas.style.transform = 'translate(-50%)';
            canvas.style.backgroundColor = '#fff';
            canvas.setAttribute('data-id', index);
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            canvas.style.width = `${pageWidth}px`;
            canvas.style.height = `${pageHeight}px`;
            return canvas
        }
        function renderList(startIndex, endIndex){
            let list  = wrapperRef.value;
            let originNodes = [...list.childNodes]
            let tasks = [];
            if(list.childNodes.length === 0){
                for (let i = startIndex; i <= endIndex; i++) {
                    let canvas = createCanvas(i)
                    list.appendChild(canvas);
                    tasks.push(renderPage(i, canvas));
                }
            }else{
                let min = +originNodes[0].getAttribute('data-id');
                let max = +originNodes[originNodes.length -1].getAttribute('data-id');
                if(endIndex < min || startIndex > max){
                    for (let i = startIndex; i <= endIndex; i++) {
                        let canvas = createCanvas(i)
                        list.appendChild(canvas);
                        tasks.push(renderPage(i, canvas));
                    }
                }

                if(startIndex < min && endIndex >= min){
                    let firstChildNode = originNodes[0]
                    for (let i = min-1; i >= startIndex; i--) {
                        let canvas = createCanvas(i);
                        list.insertBefore(canvas, firstChildNode);
                        firstChildNode = canvas;
                        tasks.push(renderPage(i, canvas));
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
                        let canvas = createCanvas(i)
                        list.appendChild(canvas);
                        tasks.push(renderPage(i, canvas));
                    }
                }
            }
            Promise.all(tasks).then(_=>{
                emit('rendered')
            }).catch(e => {
                emit('error', e)
            })
        }
        function renderPage(num, canvas) {
            return pdfDocument.getPage(num).then((pdfPage) => {
                const viewport = pdfPage.getViewport({ scale: getViewportScale * (userScale.value < 1 ? userScale.value : 1) });
                let outputScale = window.devicePixelRatio > 2 ? 1.5 : 2;
                if(canvasWidth * viewport.height !== canvasHeight * viewport.width ){
                    let width = Math.floor(viewport.width * outputScale);
                    let height =  Math.floor(viewport.height * outputScale);
                    let scale =  canvasHeight / height;
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

        function rerender(){
            renderList(1, Math.min(totalItems, visibleItems));
        }
        onMounted(() => {
            if (props.src) {
                checkPdfLib().then(init).catch(e => {
                    console.warn(e);
                });
            }
        });

        watch(() => props.src, () => {
            checkPdfLib().then(init).catch(e => {
                console.warn(e);
            });
        });
        function save(fileName) {
            pdfDocument && pdfDocument._transport && pdfDocument._transport.getData().then(fileData => {
                downloadFile(fileName || `vue-office-pdf-${new Date().getTime()}.pdf`, fileData.buffer);
            });
        }
        return {
            containerRef,
            wrapperRef,
            rootRef,
            numPages,
            save,
            onScrollPdf,
            rerender,
            userScale,
            getScale,
            setScale
        };
    }
});
</script>

<template>
    <div class="vue-office-pdf" ref="containerRef" style="text-align: center;overflow-y: auto;position: relative;" @scroll="onScrollPdf">
        <div ref="wrapperRef"
             class="vue-office-pdf-wrapper"
             style="background: gray; padding: 30px 0;position: relative;box-sizing: content-box"
             :style="{width: `${100 * (userScale < 1 ? 1 : userScale)}%`}"
        ></div>
        <slot></slot>
    </div>
</template>
<style lang="less">
</style>
