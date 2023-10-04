// @ts-ignore
import VTour from "@globalhive/vuejs-tour";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VTour);
});
