<template>
  <NuxtPage />
  <!-- <AnnouncementDialog id="announcement-3">
    <template #title>
      <h1 class="text-2xl font-bold font-dumbledor">Welcome to ClockTracker</h1>
    </template>
    <p>This is a cool app, with a cool announcement.</p>
  </AnnouncementDialog> -->
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
  Colors,
  PolarAreaController,
  RadialLinearScale,
} from "chart.js";

const friends = useFriends();
const users = useUsers();
const user = useSupabaseUser();
const featureFlags = useFeatureFlags();

await featureFlags.init();

onMounted(() => {
  users.fetchMe(user.value?.id);
  friends.fetchFriends();
  friends.fetchRequests();

  setInterval(() => {
    friends.fetchRequests();
    // one minute
  }, 1000 * 60);
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
  RadialLinearScale,
  LinearScale,
  ArcElement,
  PointElement,
  LineElement,
  PolarAreaController,
  Colors
);
</script>

<style>
body {
  @apply bg-stone-800 font-gothic text-stone-100;
}

:root {
  --vs-controls-color: #664cc3;
  --vs-border-color: #664cc3;

  --vs-dropdown-bg: #282c34;
  --vs-dropdown-color: #cc99cd;
  --vs-dropdown-option-color: #cc99cd;

  --vs-selected-bg: #664cc3;
  --vs-selected-color: #eeeeee;

  --vs-search-input-color: #eeeeee;

  --vs-dropdown-option--active-bg: #664cc3;
  --vs-dropdown-option--active-color: #eeeeee;
}

.v-select {
  white-space: nowrap;
  position: relative;
}
</style>
