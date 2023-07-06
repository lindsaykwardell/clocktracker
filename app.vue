<template>
  <NuxtPage />
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
} from "chart.js";

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
  ArcElement
);
</script>

<style>
body {
  @apply bg-stone-800 font-raleway text-stone-100;
}

.router-link-active {
  @apply underline;
}
</style>
