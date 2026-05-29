<script setup>
import {ref, onMounted, watch} from 'vue';
import {useRouter, useRoute} from 'vue-router';
const router = useRouter();
const route = useRoute();
const current = ref([]);

// 所有 demo 路由对应的菜单 key（与 router.js 注册的路径保持一致）
const ROUTE_KEYS = ['excel', 'docx', 'pdf', 'pptx', 'js-excel', 'js-docx', 'js-pdf'];

function syncCurrent(){
    // 精确匹配当前路由对应的 menu key，避免 hash.includes('docx') 把 #/js-docx 误识别为 docx 的 bug
    const path = (route.path || '/excel').replace(/^\//, '');
    current.value = [ROUTE_KEYS.includes(path) ? path : 'excel'];
}

onMounted(syncCurrent);

// 路由切换时同步选中态（点击 menu / 浏览器前进后退 / 手输 url 都覆盖）
watch(() => route.path, syncCurrent);

function go({key}){
     router.push({
         path: key,
         query: {...route.query}
     });
}
</script>

<template>
  <div>
      <a-menu v-model:selectedKeys="current" mode="horizontal" @click="go">
          <a-menu-item key="excel">
              vue-excel 预览
          </a-menu-item>
          <a-menu-item key="docx">
             vue-docx 预览
          </a-menu-item>
          <a-menu-item key="pdf">
              vue-pdf 预览
          </a-menu-item>
          <a-menu-item key="pptx">
              vue-pptx 预览
          </a-menu-item>
          <a-menu-item key="js-excel">
              js-excel 预览
          </a-menu-item>
          <a-menu-item key="js-docx">
              js-docx 预览
          </a-menu-item>
          <a-menu-item key="js-pdf">
              js-pdf 预览
          </a-menu-item>
      </a-menu>
      <router-view/>
  </div>

</template>

<style scoped>
/deep/ .ant-tabs-nav-wrap{
  padding-left: 20px !important;
}

</style>
