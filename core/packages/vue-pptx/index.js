import VueOfficePptx from './src/main.vue';

VueOfficePptx.install = function (Vue) {
    Vue.component(VueOfficePptx.name, VueOfficePptx);
};

export default VueOfficePptx;