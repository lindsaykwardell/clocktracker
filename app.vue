<template>
  <NuxtPage />
  <AnnouncementDialog id="fleshandbone-040525-">
    <template #title>
      <h1 class="text-2xl font-bold font-sorts">
        Announcing "Living Scripts" integration!
      </h1>
      <div class="text-lg text-stone-400">{{ formattedAnnouncementDate }}</div>
    </template>
    <p class="p-2">
      A new integration is now available for ClockTracker:
      <strong>"Living Scripts"</strong>!
    </p>
    <p class="p-2">From the Living Scripts website:</p>
    <p
      class="p-2 pl-6 border-l-4 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 italic"
    >
      <em>
        If you've ever gathered your group to play Blood on the Clocktower and
        wondered, "What script should we play?"—you're in the right place.
        Living Scripts takes the game you love and transforms it into an
        evolving, dynamic campaign system that builds tension, bonds, and a
        story you’ll remember long after the games end. Think of it as Blood on
        the Clocktower—but with consequences that ripple across multiple
        sessions.
      </em>
    </p>
    <p class="p-2">
      Living Scripts is a new way to play Blood on the Clocktower that allows
      you to connect your games together into a campaign, with a "living" script
      that changes every game. With this integration, ClockTracker now supports
      a built-in method of supporting Living Scripts, by importing the campaign
      and script information directly.
    </p>
    <p class="p-2">
      When you are adding a game, you can now select to use a Living Script
      campaign from the script selection dialog. There are two options: Classic
      (a standard script) or Living Scripts.
    </p>
    <img src="/img/ls-1.png" />
    <p class="p-2">
      Once you select a Living Script campaign, you will be able to choose from
      the available scripts in that campaign. Details such as the notes and the
      game date, will be automatically filled in, and the custom background
      image (if any) will be used for the game session.
    </p>
    <img src="/img/ls-2.png" />
    <p class="p-2">
      You can also add a Living Scripts game directly to ClockTracker usign the
      provided button on the Living Scripts website.
    </p>
    <img src="/img/ls-3.png" />
    <p class="p-2">
      Living Scripts is an exciting, new way to play ClockTower, and I highly
      recommend you check it out! The website is
      <a
        href="https://fleshandbone.app/"
        target="_blank"
        class="text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-600"
        >fleshandbone.app</a
      >.
    </p>
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
