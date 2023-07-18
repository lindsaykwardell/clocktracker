<template>
  <NuxtPage />
  <VitePwaManifest />
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";

const notificationStore = useNotifications();
const user = useSupabaseUser();

let stop = () => {};

onMounted(() => {
  stop = notificationStore.pollNotifications(user);
});

onUnmounted(() => {
  stop();
});

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - ClockTracker` : "ClockTracker";
  },
});

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  PointElement,
  LineElement
);
</script>

<style>
body {
  @apply bg-stone-800 font-gothic text-stone-100;
}
</style>
