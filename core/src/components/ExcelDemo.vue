<script setup>
import VueOfficeExcel from '../../packages/vue-excel/index';
import '../../packages/vue-excel/src/index.css';
import PreviewWrapper from '../common/PreviewWrapper.vue';
import useLoading from '../hooks/useLoading.js';
import {ref} from 'vue';
function onRendered(){
    useLoading.hideLoading();
}
function onError(e){
    console.log('出差',e);
    useLoading.hideLoading();
}



function transformData(data){
    console.log('transformData', data);
    return data;
}

const defaultSrc = location.origin +
    (location.pathname + '/').replace('//', '/')
    + 'static/test-files/带附件.xlsx';
const docxRef = ref();

function beforeTransformData(data){
    console.log('beforeTransformData', data, docxRef);

    data._worksheets.forEach(worksheet=>{
        let line = 0;
        if( worksheet._rows[line] && worksheet._rows[line]._cells){
            for(let i = 0;i < worksheet._rows[line]._cells.length;i++){
                let cell = worksheet._rows[line]._cells[i];
                if(!cell){
                    //单元格不存在
                    worksheet._rows[line]._cells[i] = {
                        text: '',
                        value:'',
                        style: {
                            bgcolor: '#00ff00'
                        }
                    }
                }else{
                    cell.style = {
                        bgcolor: '#00ff00'
                    }
                }
            }
        }

    })
    return data;
}

function switchSheet(sheetIndex){
    console.log('当前sheet', sheetIndex);
}

function cellSelected(event){
    console.log('点击了单元格', event)
}

function cellsSelected(event){
    console.log('选择了单元格', event)
}

function onAttachmentPreview({ url, name, previewType }) {
    console.log('[attachment-preview]', name, previewType, url);
    if (previewType) {
        // 走本项目内核预览：跳转到对应预览路由的新标签页
        const base = location.origin + location.pathname;
        const target = `${base}#/${previewType}?url=${encodeURIComponent(url)}`;
        window.open(target, '_blank');
    } else {
        // 不支持的类型（图片、txt 等）回退到浏览器原生
        window.open(url, '_blank');
    }
}
// setTimeout(()=>{
//     console.log( docxRef.value.download());
// }, 2000);
</script>

<template>
  <PreviewWrapper
      accept=".xlsx,.xls"
      placeholder="请输入xlsx文件地址"
      :default-src="defaultSrc"
  >
    <template  v-slot="slotProps">
      <VueOfficeExcel
          ref="docxRef"
          :src="slotProps.src"
          :options="{beforeTransformData, transformData, xls: slotProps.xls}"
          style="flex: 1;height: 0"
          v-loading="true"
          @rendered="onRendered"
          @error="onError"
          @switchSheet="switchSheet"
          @cellSelected="cellSelected"
          @cellsSelected="cellsSelected"
          @attachment-preview="onAttachmentPreview"
      />
    </template>

  </PreviewWrapper>
</template>


<style scoped>

</style>