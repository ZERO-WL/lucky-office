<script>
import { defineComponent, ref, onMounted, watch } from 'vue';
import {init as initPptxPreviewer} from 'pptx-preview';

export default defineComponent({
    name: 'VueOfficePptx',
    props: {
        src: [String, ArrayBuffer, Blob],
        requestOptions: {
            type: Object,
            default: () => ({})
        },
        options: {
            type: Object,
            default: () => ({})
        }
    },
    emits: ['rendered', 'error'],
    setup(props, { emit }) {
        let pptxViewer = null;
        const rootRef = ref(null);

        function init(){
            let container = rootRef.value;
            let width = props.options.width || container.getBoundingClientRect().width || 960;
            let height = props.options.height || container.getBoundingClientRect().height || 540;
            pptxViewer = initPptxPreviewer(container, {
                width,
                height
            })
        }
        function getPptxData(src){
            if(typeof src === 'string'){
                return fetch(src, props.requestOptions).then(response=>{
                    return response.arrayBuffer()
                })
            }
            if(src instanceof ArrayBuffer){
                return Promise.resolve(src)
            }

        }
        function preview(){
            if (props.src) {
                getPptxData(props.src).then(arrayBuffer=>{
                    pptxViewer.preview(arrayBuffer).then((pptx) =>{
                        emit('rendered', pptx);
                    }).catch(e => {
                        emit('error', e);
                    });

                }).catch(e=>{
                    emit('error', e);
                })
            }
        }
        onMounted(() => {
            init();
            preview();
        });
        watch(() => props.src, () => {
            preview();
        });
        return {
            rootRef
        }
    }
});
</script>

<template>
    <div class="vue-office-pptx">
        <div class="vue-office-pptx-main" ref="rootRef" style="width:100%; height: 100%;"></div>
    </div>
</template>
<style lang="less">
</style>
