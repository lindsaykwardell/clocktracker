<template>
  <NuxtPage />
  <AnnouncementDialog v-if="shouldShowAnnouncement" id="august-2024">
    <template #title>
      <h1 class="text-2xl font-bold font-dumbledor">
        Changelog for August 2024
      </h1>
      <div class="text-lg text-stone-400">{{ formattedAnnouncementDate }}</div>
    </template>
    <p class="p-2">
      This month had a large infrastructure change, as well as a number of
      feature releases and fixes. Here are the changes for August 2024:
    </p>
    <ul class="list-disc list-inside p-2">
      <li>Add Lord of Typhon to the available characters.</li>
      <li>Add functionality to edit and delete multiple games at once.</li>
      <li>Add "Sort by Alignment" to the games view.</li>
      <li>
        Require users to choose the win state (win/loss/no result) when creating
        a game.
      </li>
      <li>
        Track tutorials and announcements that users have seen on the server,
        rather than per device.
      </li>
      <li>
        Add a "Games" page for communities, so all games for that community can
        be viewed in one place.
      </li>
      <li>Add the ability to export games from ClockTracker as a CSV.</li>
      <li>
        Migrate the database and file storage from Supabase to Fly.io and
        Tigris. Most of the work of this month was done here, to reduce hosting
        costs and improve performance.
      </li>
      <li>
        Fix the Discord bot ping frequency (from repeating every minute to one
        ping per event).
      </li>
      <li>
        Fix a bug where the Discord bot would attempt to ping non-Discord users.
      </li>
      <li>
        Fix a bug with uploading scripts using characters with multiple words in
        their name.
      </li>
      <li>Fix a bug preventing players from being untagged in a Grimoire.</li>
    </ul>
    <p class="p-2">
      Please let me know on Discord if you have any issues or feedback. Thank
      you!
    </p>
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
  Filler,
} from "chart.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { User } from "~/composables/useUsers";

dayjs.extend(utc);
dayjs.extend(timezone);

const users = useUsers();
const user = useSupabaseUser();
const featureFlags = useFeatureFlags();

await featureFlags.init();
await featureFlags.fetchScheduledMaintenance();

watch(
  user,
  async (current, previous) => {
    if (featureFlags.isEnabled("maintenance")) {
      return;
    }

    if (current?.id !== previous?.id) {
      try {
        await users.fetchMe(current?.id);
      } catch (e) {
        console.error("Error fetching user settings", e);
      }
    }
  },
  {
    immediate: true,
    deep: true,
  }
);

const announcementDate = dayjs.tz("2024-09-01", "America/Los_Angeles");
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
  Filler,
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
