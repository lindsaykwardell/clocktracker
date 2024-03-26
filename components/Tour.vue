<template>
  <VTour
    ref="tour"
    :steps="steps"
    @onTourStart="tourStarted = true"
    @onTourEnd="onTourEnd"
  />
  <div
    v-if="tourStarted"
    class="fixed top-0 left-0 w-screen h-screen flex justify-center items-center bg-stone-800/40 z-50"
  >
    <div id="anchor-center" class="w-[1px] h-[1px]" />
  </div>
</template>

<script setup lang="ts">
const tour = ref();
const tourStarted = ref(false);

const props = defineProps<{
  steps: Step[];
  tourKey: string;
}>();

const emit = defineEmits(["onTourStart", "onTourEnd"]);

function onTourEnd() {
  localStorage.removeItem("vjt-default");

  const tours = JSON.parse(localStorage.getItem("tours") || "{}");
  localStorage.setItem(
    "tours",
    JSON.stringify({ ...tours, [props.tourKey]: true })
  );

  tourStarted.value = false;
  emit("onTourEnd");
}

onMounted(() => {
  localStorage.removeItem("vjt-default");
  localStorage.removeItem("vjt-tour");
  if (
    JSON.parse(localStorage.getItem("tours") || "{}")[props.tourKey] !== true
  ) {
    setTimeout(() => {
      tour.value.startTour();
      emit("onTourStart");
    }, 1000);
  }
});
</script>

<style lang="scss">
@import "@globalhive/vuejs-tour/src/style/style.scss";
</style>
