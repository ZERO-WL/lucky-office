<template>
<div ref="dom" style="height: calc(100vh - 50px);">
    
</div>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import jsPdf from '../../packages/js-pdf/index';
import '../../packages/js-excel/index.css';
const dom = ref(null);
onMounted(() => {
    window.myPdfPreview = jsPdf.init(dom.value, {
        onError: (e)=>{
            console.log('发生错误', e)
        },
        onRendered: ()=>{
            console.log('渲染完成')
        }
    });
    window.myPdfPreview.preview('/vue-office/examples/dist/static/test-files/test.pdf')


});

</script>

<style scoped>

</style>