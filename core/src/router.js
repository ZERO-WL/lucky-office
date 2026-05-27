import {createRouter, createWebHashHistory} from 'vue-router';
const routes = [
    { path: '', redirect: '/excel' },
    { path: '/docx', component: ()=> import('./components/DocxDemo.vue') },
    { path: '/excel', component: ()=> import('./components/ExcelDemo.vue') },
    { path: '/pdf', component: ()=> import('./components/PdfDemo.vue') },
    { path: '/pptx', component: ()=> import('./components/PptxDemo.vue') },
    { path: '/js-docx', component: ()=> import('./components/JsDocxDemo.vue') },
    { path: '/js-excel', component: ()=> import('./components/JsExcelDemo.vue') },
    { path: '/js-pdf', component: ()=> import('./components/JsPdfDemo.vue') },
];

export default createRouter({
    history: createWebHashHistory(),
    routes
});