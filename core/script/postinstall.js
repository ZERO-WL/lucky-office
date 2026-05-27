const { switchVersion, loadModule } = require('./utils');
const Vue = loadModule('vue');
if (!Vue || typeof Vue.version !== 'string') {
    console.warn(
        '[lucky-office] Vue is not found. Please run "npm install vue" to install.'
    );
} else if (Vue.version.startsWith('3.')) {
    switchVersion(3);
} else {
    console.warn(
        `[lucky-office] Vue version v${Vue.version} is not supported. lucky-office only ships Vue 3 build, please upgrade to Vue 3.`
    );
}