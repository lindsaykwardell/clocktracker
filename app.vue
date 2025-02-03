<template>
  <NuxtPage />
  <AnnouncementDialog id="fundraising-0225">
    <template #title>
      <h1 class="text-2xl font-bold font-sorts">
        Changelog
      </h1>
      <div class="text-lg text-stone-400">{{ formattedAnnouncementDate }}</div>
    </template>
    <p class="p-2">
      There's been a large number of changes since the last update, so I wanted to
      take a moment to highlight some of the most important ones. 
    </p>
    <p class="p-2">
      Before we dive in, though, ClockTracker is a free and open-source project, but it costs to run the servers and services. Please consider supporting this project on Ko-Fi in order to ensure that it remains available for the Clocktower community!
    </p>
    <p class="p-2">
      You can support ClockTracker by using <a href="https://ko-fi.com/clocktracker" class="text-blue-500 hover:underline">our Ko-Fi page</a>!
    </p>
    <p class="p-2">
      With that out of the way, here's a summary of the changes:
    </p>
    <ul class="list-disc list-inside p-2">
      <li>
        Enable claiming seats in an existing game (as long as you are friends with or in a community with the game's owner)
      </li>
      <li>
        Implement geolocation for finding communities and events
      </li>
      <li>
        Implement color shifting tokens depending on their alignment
      </li>
      <li>
        When entering a grimoire, only display the tokens of players with details. This allows for "empty seats" if travelers enter late or leave early.
      </li>
      <li>
        Enable creating private events (rather than just community-based events)
      </li>
      <li>
        Added support and documentation for running a development version of ClockTracker locally
      </li>
      <li>
        Auto focus the search box on the role selection dialog, and auto select the first option when "Enter" (or "Return") is pressed.
      </li>
      <li>
        Lots of bugfixes and performance improvements
      </li>
    </ul>
    <p class="p-2">
      Please let me know on Discord if you have any issues or feedback. Thank
      you!
    </p>
  </AnnouncementDialog>
  <VitePwaManifest />
</template>

<script setup lang="ts">
import "@fontsource/sorts-mill-goudy";

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

const announcementDate = dayjs.tz("2025-02-03", "America/Los_Angeles");
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
