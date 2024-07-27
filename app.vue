<template>
  <NuxtPage />
  <AnnouncementDialog v-if="shouldShowAnnouncement" id="changelog-07-24">
    <template #title>
      <h1 class="text-2xl font-bold font-dumbledor">Changelog for July 2024</h1>
      <div class="text-lg text-stone-400">{{ formattedAnnouncementDate }}</div>
    </template>
    <p class="p-2">
      Hello everyone! Starting this month, I will be posting a changelog at the
      beginning of each month to keep you all updated on the changes I've made
      to ClockTracker. Here are the changes for July 2024:
    </p>
    <ul class="list-disc list-inside p-2">
      <li>
        Add Zealot to the available characters
      </li>
      <li>
        Moved game filters into a dropdown menu, rather than spread out above
        the games list
      </li>
      <li>
        Changed "Player Roles" to "Your Roles" on the game editor
      </li>
      <li>
        Updated the tagged games tab to always show, even when there are no
        games to accept
      </li>
      <li>
        Support filtering the games list by multiple players
      </li>
      <li>
        Added a time zone field to communities (defaults to UTC)
      </li>
      <li>
        Add a user's communities to their page
      </li>
      <li>
        Add a user's total game count (split by storyteller and player) to their
        header
      </li>
      <li>
        Correctly display the number of games shown after filters have been
        applied
      </li>
      <li>
        Rename the "Charts" tab of a user's profile to the "Stats" tab
      </li>
      <li>
        Add a list of all roles and which ones have been played to the Stats tab.
      </li>
      <li>
        Show travelers on the stats tab
      </li>
      <li>
        Fixed a bug where users who sign up with email skip the onboarding step
      </li>
      <li>
        Fixed multiple bugs for custom script uploads
      </li>
      <li>
        Fixed a bug where community events would not appear on the final day of
        the month
      </li>
      <li>
        Fixed a bug where script stats would fail to load, causing the page to
        crash
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

const announcementDate = dayjs.tz("2024-08-01", "America/Los_Angeles");

const formattedAnnouncementDate = computed(() => {
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "full",
  }).format(announcementDate.toDate());
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
