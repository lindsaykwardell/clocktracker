<template>
  <NuxtPage />
  <AnnouncementDialog id="custom-script-uploads">
    <template #title>
      <h1 class="text-2xl font-bold font-dumbledor">
        Feature Preview - Upload Scripts
      </h1>
      <div class="text-lg text-stone-400">{{ announcementDate }}</div>
    </template>
    <p class="p-2">
      We are excited to announce a new feature that will be rolling out soon:
      custom script and homebrew uploads! This feature will allow users to
      upload their favorite scripts for use on ClockTracker.
    </p>
    <img src="/blog/upload-1.webp" alt="Upload a script" />
    <p class="p-2">
      When you are creating a game, you can upload a custom JSON file by
      selecting "Upload a script". The script can use the official characters,
      or custom characters (such as Fall of Rome). If a script provides custom
      images, they will be applied to the grimoire (including a script logo!)
    </p>
    <img src="/blog/upload-2.webp" alt="Custom script in action" />
    <img src="/blog/upload-3.webp" alt="Grimoire for a tagged game" />
    <p class="p-2">
      Tagged games work the same as always, and tagged players may now use the
      script they were tagged in for future games.
    </p>
    <img src="/blog/upload-4.webp" alt="User was tagged in a custom game" />
    <p class="p-2">
      Custom uploaded scripts are visible to all ClockTracker users, but they
      are scoped to each individual upload (so if someone else uploads the same
      script, you will each have separate stats). This is to prevent accidental
      merging of a script. Further work may go into this to make it even better,
      but this should work for now as an initial approach.
    </p>

    <p class="p-2">
      Users may only use a script that they have either uploaded or been tagged
      in. If you wish to use a custom script, you will need to upload a copy
      yourself.
    </p>
    <img src="/blog/upload-5.webp" alt="Custom script selection" />
    <p class="p-2">
      Script uploading will first roll out to Ko-Fi supporters, with a
      full release after testing is complete. If you are interested in testing
      this feature, please consider supporting ClockTracker on Ko-Fi. If you are
      already a Ko-Fi supporter, head over to
      <a class="underline" href="/settings/perks">Settings</a> to opt into
      preview features.
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
import { nanoid } from "nanoid";

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
  }).format(new Date("2024-04-16"));
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
