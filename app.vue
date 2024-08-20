<template>
  <NuxtPage />
  <AnnouncementDialog v-if="shouldShowAnnouncement" id="maint-8-20">
    <template #title>
      <h1 class="text-2xl font-bold font-dumbledor">
        Maintenance {{ formattedMaintenceDayAndMonth }}
      </h1>
      <div class="text-lg text-stone-400">{{ formattedAnnouncementDate }}</div>
    </template>
    <p class="p-2">
      Starting {{ formattedMaintenanceStart }}, the site will be down for
      maintenance for a few hours. During this time, I will be migrating the
      database to a new server. The site will be back up as soon as possible.
      Please check Discord for updates.
    </p>
    <p class="p-2">Thank you for your understanding and patience.</p>
  </AnnouncementDialog>
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
await featureFlags.fetchScheduledMaintenance();

onMounted(() => {
  if (featureFlags.isEnabled("maintenance")) {
    return;
  }
  
  users.fetchMe(user.value?.id);
  friends.fetchFriends();
  friends.fetchRequests();

  setInterval(() => {
    friends.fetchRequests();
    // one minute
  }, 1000 * 60);
});

const announcementDate = dayjs.tz("2024-08-14", "America/Los_Angeles");
const maintenanceMode = featureFlags.maintenanceIsScheduled;

const formattedAnnouncementDate = computed(() => {
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "full",
  }).format(announcementDate.toDate());
});

const formattedMaintenceDayAndMonth = computed(() => {
  if (!maintenanceMode) return "";

  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "full",
  }).format(maintenanceMode);
});

const formattedMaintenanceStart = computed(() => {
  if (!maintenanceMode) return "";

  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "full",
    timeStyle: "short",
  }).format(maintenanceMode);
});

const shouldShowAnnouncement = computed(() => {
  return dayjs().isAfter(announcementDate);
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
