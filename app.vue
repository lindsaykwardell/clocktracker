<template>
  <NuxtPage />
  <AnnouncementDialog v-if="shouldShowAnnouncement" id="sept-2024">
    <template #title>
      <h1 class="text-2xl font-bold font-dumbledor">
        Changelog for September 2024
      </h1>
      <div class="text-lg text-stone-400">{{ formattedAnnouncementDate }}</div>
    </template>
    <p class="p-2">
      There's a number of fun changes that have come out this month! Here are the changes for September 2024:
    </p>
    <ul class="list-disc list-inside p-2">
      <li>
        The new Boffin role has been added to the list of roles.
      </li>
      <li>
        Add a new "Dashboard" page that shows recent activity and upcoming events the user has signed up for.
      </li>
      <li>
        Add a public profile page for users, displaying favorite games and all played roles.
      </li>
      <li>
        Add percentages to charts (instead of just the total count).
      </li>
      <li>
        Add links to communities on the "Communities" page.
      </li>
      <li>
        Limit games shown on the roles and scripts page to the current user's, instead of all public games in the database.
      </li>
      <li>
        Add functionality to copy a grimoire from a previous game.
      </li>
      <li>
        Add support for up to 25 players in a game.
      </li>
      <li>
        Add new date, player count, script, and location filters to the games view.
      </li>
      <li>
        Allow users to tag themselves as a co-storyteller for a game.
      </li>
      <li>
        Improve search functionality.
      </li>
      <li>
        Improve the style of the "Games over time" chart.
      </li>
      <li>
        Improve transitions between pages to be smoother.
      </li>
      <li>
        Properly alphabetize the roles in the "all roles" view of player profiles.
      </li>
      <li>
        Expand the range for games to be merged so that they don't need to be recorded on the same exact date.
      </li>
      <li>
        Change how saving a game works to only warn users if the game is being created on the current day.
      </li>
      <li>
        When multiple games are being edited, the user is now returned to the games list instead of the dashbaord.
      </li>
      <li>
        Fix a bug related to displaying stats in scripts.
      </li>
      <li>
        Fix multiple bugs related to fetching roles for scripts.
      </li>
      <li>
        Fix a bug where a player name in the grimoire would try to default to a previously-entered name that was similar.
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

const announcementDate = dayjs.tz("2024-10-01", "America/Los_Angeles");
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
