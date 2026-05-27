<script setup>
import VueOfficePptx from '../../packages/vue-pptx/index';
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
const defaultSrc = location.origin + 
    (location.pathname + '/').replace('//', '/') 
    + 'static/test-files/test.pptx';
const docxRef = ref();

const pptxWidth = Math.min(960, window.innerWidth)
const requestOptions = {
    headers: {
    }
};
</script>

<template>
  <PreviewWrapper
      accept=".pptx"
      placeholder="请输入pptx文件地址"
      :default-src="defaultSrc"
  >
    <template  v-slot="slotProps">
       <div style="flex: 1;height: 0; background: black">
           <VueOfficePptx
               ref="docxRef"
               :src="slotProps.src"
               :request-options="requestOptions"
               style="height: calc(100vh - 100px)"
               :options="{width: pptxWidth}"
               @rendered="onRendered"
               @error="onError"
           >
           </VueOfficePptx>
       </div>
    </template>
  </PreviewWrapper>
</template>

<style scoped>

</style>