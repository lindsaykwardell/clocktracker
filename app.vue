<template>
  <NuxtPage />
  <!-- <AnnouncementDialog id="db-outage">
    <template #title>
      <h1 class="text-2xl font-bold font-dumbledor">
        Unexpected Database Outage
      </h1>
      <div class="text-lg text-stone-400">{{ announcementDate }}</div>
    </template>
    <p class="p-2">
      There was an unexpected database outage on {{ announcementDate }}. The
      issue has been resolved, but any games or other data created during this
      time may have been lost.
    </p>
    <p class="p-2">
      As a reminder, we will be performing scheduled maintenance on our server
      on {{ maintenanceDate }}. During this time, you may experience some
      downtime. We apologize for any inconvenience this may cause.
    </p>
    <p class="p-2">
      Please join our Discord server for any updates and further announcements.
      Thank you!
    </p>
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
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

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

const announcementDate = computed(() => {
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "full",
  }).format(dayjs.tz("2024-04-27", "America/Los_Angeles").toDate());
});

const maintenanceDate = computed(() => {
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "full",
  }).format(dayjs.tz("2024-04-29", "America/Los_Angeles").toDate());
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
  @apply bg-stone-50 dark:bg-stone-800 font-gothic dark:text-stone-100;
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
