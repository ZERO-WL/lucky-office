<template>
<div ref="dom" style="height: calc(100vh - 50px)">
    
</div>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import jsExcel from '../../packages/js-excel/index';
import '../../packages/js-excel/index.css';
const dom = ref(null);
onMounted(() => {
    window.myExcelPreview = jsExcel.init(dom.value, {
        transformData: function (workBook){
            console.log('transformData', workBook);
            return workBook;
        },
        cellSelected(event){
            console.log(event);
        },
        progressive: {
            initialRows: 30,
            batchRows: 100,
            onInitialDataReady(result){
                console.log('[js-excel demo progressive initial]', result.workbookData);
            },
            onProgress(progress){
                console.log('[js-excel demo progressive progress]', progress);
            }
        }

    });
    window.myExcelPreview.preview(`${import.meta.env.BASE_URL}static/test-files/超多列.xlsx`).then(_=>{
        // window.myExcelPreview.download();
        console.log('excel preview done', window.myExcelPreview);
    }).catch(err=>{
        console.log('err',err);
    });

});

</script>

<style scoped>

</style>