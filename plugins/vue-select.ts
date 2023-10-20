import vSelect from "vue-select";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('v-select', vSelect);
});
