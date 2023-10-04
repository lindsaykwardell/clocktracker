<template>
  <VTour ref="tour" :steps="steps" @onTourEnd="onTourEnd" />
</template>

<script setup lang="ts">
import type { Step } from "~/composables/useStep";

const tour = ref();

const props = defineProps<{
  steps: Step[];
  tourKey: string;
}>();

function onTourEnd() {
  localStorage.removeItem("vjt-tour");

  const tours = JSON.parse(localStorage.getItem("tours") || "{}");
  localStorage.setItem(
    "tours",
    JSON.stringify({ ...tours, [props.tourKey]: true })
  );
}

onMounted(() => {
  if (
    JSON.parse(localStorage.getItem("tours") || "{}")[props.tourKey] !== true
  ) {
    setTimeout(() => {
      tour.value.startTour();
    }, 1000);
  }
});
</script>

<style lang="scss">
@import "@globalhive/vuejs-tour/src/style/style.scss";
</style>
