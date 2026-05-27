<script setup>
import {defineProps, watch} from 'vue';
import {useRoute} from 'vue-router';
import usePreview from '../hooks/usePreview.js';
import useLoading from '../hooks/useLoading.js';
import {isTest} from '../../utils/test.js';
const props = defineProps({
  accept: String,
  placeholder: String,
  defaultSrc: String
});

const route = useRoute();
// 优先使用 URL query 参数中的 url，其次回退到 defaultSrc
const initialSrc = (route && route.query && typeof route.query.url === 'string' && route.query.url)
    ? route.query.url
    : props.defaultSrc;

const {type, inputSrc, src, xls, fileList, beforeUpload} = usePreview(initialSrc);
watch(src,()=>{
    useLoading.showLoading();
},{
    immediate: true
});

// 监听路由 query.url 变化（例如从一个带 url 的路由跳到另一个）
watch(() => route && route.query && route.query.url, (newUrl) => {
    if (newUrl && typeof newUrl === 'string') {
        inputSrc.value = newUrl;
        src.value = newUrl;
        xls.value = newUrl.endsWith('.xls');
    }
});

</script>

<template>
  <div class="preview-wrapper">
    <div class="operate-area" v-if="!isTest()">
      <a-radio-group v-model:value="type" button-style="solid">
        <a-radio-button value="url">远程文件地址</a-radio-button>
        <a-radio-button value="upload">上传本地文件</a-radio-button>
      </a-radio-group>
      <a-input
          v-if="type==='url'"
          v-model:value="inputSrc"
          :placeholder="props.placeholder"
          style="width: 600px; margin-left:10px;"
      />
      <a-button
          v-if="type==='url'"
          type="primary"
          style="margin-left: 10px"
          @click="src=inputSrc; xls=inputSrc.endsWith('xls')"
      >
        预览
      </a-button>
      <a-upload
          v-if="type !== 'url'"
          :accept="props.accept"
          action=""
          :beforeUpload="beforeUpload"
          :file-list="[]"
      >
        <a-button  style="margin-left: 10px">
          <upload-outlined></upload-outlined>
          选择文件
        </a-button>
      </a-upload>

    </div>
    <slot :src="src" :xls="xls"></slot>
    <div class="preview-wrapper-main">

    </div>
  </div>
</template>

<style scoped>
.preview-wrapper{
  height: calc(100vh - 46px);
  display: flex;
  flex-direction: column;
}
.operate-area {
  display: flex;
  margin: 10px;
  align-items: center;
  flex-wrap: wrap;
}
</style>