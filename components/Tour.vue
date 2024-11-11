<template>
  <VTour
    ref="tour"
    :steps="steps"
    @onTourStart="tourStarted = true"
    @onTourEnd="onTourEnd"
  />
  <div
    class="fixed top-0 left-0 w-screen h-screen flex justify-center items-center pointer-events-none"
    :class="{
      'bg-stone-800/40 z-50': tourStarted,
    }"
  >
    <div id="anchor-center" class="w-[1px] h-[1px]" />
  </div>
</template>

<script setup lang="ts">
import { nanoid } from "nanoid";
import "@globalhive/vuejs-tour/dist/style.css"

const tour = ref();
const tourStarted = ref(false);
const { did, isDone } = useDids();
const me = useMe();

const props = defineProps<{
  steps: Step[];
  tourKey: string;
  devMode?: boolean;
}>();

const tourKey = computed(() => {
  if (props.devMode) {
    return nanoid();
  } else {
    return props.tourKey;
  }
});

const emit = defineEmits(["onTourStart", "onTourEnd"]);

function onTourEnd() {
  localStorage.removeItem("vjt-default");

  did(tourKey.value);

  tourStarted.value = false;
  emit("onTourEnd");
}

onMounted(async () => {
  localStorage.removeItem("vjt-default");
  localStorage.removeItem("vjt-tour");

  // Migration path from localStorage to dids
  const tours = localStorage.getItem("tours");

  if (tours) {
    const parsedTours = JSON.parse(tours);

    for (const key in parsedTours) {
      await did(key);
    }

    localStorage.removeItem("tours");
  }
  // end migration path

  setTimeout(() => {
    if (
      me.value.status === Status.SUCCESS &&
      !me.value.data.disable_tutorials &&
      !isDone(tourKey.value)
    ) {
      tour.value.startTour();
      emit("onTourStart");
    }
  }, 1000);
});
</script>