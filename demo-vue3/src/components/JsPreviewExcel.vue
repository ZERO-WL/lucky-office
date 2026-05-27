<template>
    <div id="excel" style="height: 100vh"></div>
</template>

<script>
import jsPreviewExcel from "@lucky-office/js-excel";
import '@lucky-office/js-excel/lib/index.css';
export default {
    name: "JsPreviewExcelDemo",
    data(){
      return {
          myExcelPreviewer: null
      }
    },
    mounted(){
        this.myExcelPreviewer = jsPreviewExcel.init(document.getElementById('excel'));
        this.myExcelPreviewer .preview('http://static.shanhuxueyuan.com/test.xlsx').then(()=>{
            console.log('预览完成');
        }).catch(e=>{
            console.log('预览失败', e);
        })
    },
    beforeUnmount() {
        this.myExcelPreviewer.destroy();
    }
};
</script>

<style scoped>

</style>