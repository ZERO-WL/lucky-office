<template>
<div ref="dom">
    
</div>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import jsDocx from '../../packages/js-docx/index';
import '../../packages/js-docx/index.css';
const dom = ref(null);
onMounted(() => {
    const base = import.meta.env.BASE_URL;
    let myDocxPreview = jsDocx.init(dom.value);
    myDocxPreview.preview(`${base}static/test-files/test.docx`).then(_=>{
        console.log('docx preview done');
        setTimeout(()=>{
            // myDocxPreview.download();
            myDocxPreview.preview(`${base}static/test-files/test2.docx`);
        }, 3000);
    }).catch(err=>{
        console.log('err',err);
    });
});

</script>

<style scoped>

</style>