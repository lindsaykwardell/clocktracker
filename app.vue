<template>
    <NuxtPage />
    <AnnouncementDialog
      v-if="announcement"
      :id="`announcement-${announcement.threadId}`"
    >
      <template #title>
        <h1 class="text-2xl font-bold font-sorts">{{ announcement.title }}</h1>
        <div class="text-lg text-stone-400">{{ formatAnnouncementDate(announcement.createdAt) }}</div>
      </template>
      <template v-slot="{ close }">
        <div class="p-2">
          <MarkdownRenderer
            class="post text-lg max-w-[80ch]"
            :source="announcement.body"
            :options="{ html: false }"
          />
          <div v-if="featureFlags.isEnabled('forum')" class="flex justify-center mt-4">
            <nuxt-link
              :to="`/forum/${announcement.categorySlug}/${announcement.threadId}`"
              class="text-sm text-primary hover:underline"
              @click="close"
            >
              View full thread &rarr;
            </nuxt-link>
          </div>
        </div>
      </template>
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
import ChartDataLabels from "chartjs-plugin-datalabels";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { User } from "~/composables/useUsers";
import { nanoid } from "nanoid";

dayjs.extend(utc);
dayjs.extend(timezone);

const users = useUsers();
const user = useUser();
const featureFlags = useFeatureFlags();

await featureFlags.init();
await featureFlags.fetchScheduledMaintenance();

// Fetch user settings during SSR
const { data: userSettings, error: userSettingsError } = await useAsyncData(
    "userSettings",
    async () => {
        if (!user.value?.id) {
            // console.log('useAsyncData handler: No user ID');
            return null;
        }
        try {
            let headers = {};
            if (process.server) {
                const event = useRequestEvent();
                const cookieHeader = event?.node.req.headers.cookie;
                if (cookieHeader) {
                    headers = { cookie: cookieHeader };
                }
            }
            // console.log('useAsyncData handler: Fetching /api/settings with headers:', headers);
            const settings = await $fetch<User>("/api/settings", { headers });
            // console.log('useAsyncData handler: Fetched settings:', settings);
            return settings || null; // Ensure we return null if settings is falsy for any reason
        } catch (e: any) {
            console.error(
                "Error fetching user settings in useAsyncData handler:",
                e.message,
                e.data || "",
            );
            return null;
        }
    },
    {
        server: true,
        watch: [() => user.value?.id],
        default: () => null, // Provide a default value for userSettings, ensuring it's not undefined
    },
);

// Watch for fetched/updated userSettings to store them in Pinia
watch(
    userSettings,
    (newSettings, oldSettings) => {
        // console.log('userSettings watcher: newSettings:', newSettings, 'oldSettings:', oldSettings);
        if (newSettings) {
            // console.log('userSettings watcher: Storing new settings in Pinia');
            users.storeUser(newSettings);
            // Re-register push subscription on this browser if user has notifications enabled
            if (import.meta.client) {
                syncPushSubscription(!!newSettings.push_notifications_enabled);
            }
        } else if (oldSettings && !newSettings) {
            // Handle user logging out or settings becoming null after being populated
            // You might want to clear the specific user from Pinia store or reset to an initial state.
            // For now, this just logs. Depending on your Pinia store logic for 'storeUser' with null or
            // how you handle user logout, this part might need adjustment.
            // console.log('userSettings watcher: newSettings is null, user might have logged out or fetch failed.');
        }
    },
    { immediate: true },
);

// Watch for user ID changes (e.g., login/logout), primarily for client-side scenarios
// or if useAsyncData initially fails to load data for an authenticated user.
watch(
    () => user.value?.id,
    async (currentId, previousId) => {
        // console.log(`User ID watcher: currentId=${currentId}, previousId=${previousId}, userSettings.value exists=${!!userSettings.value}`);
        if (featureFlags.isEnabled("maintenance")) {
            return;
        }

        if (currentId) {
            // If userSettings is null (or doesn't match currentId) and we have a currentId,
            // it means useAsyncData hasn't loaded it for this user yet, or failed.
            if (
                !userSettings.value ||
                userSettings.value.user_id !== currentId
            ) {
                // console.log(`User ID watcher: Settings not loaded for ${currentId} or mismatch, attempting fetchMe.`);
                try {
                    await users.fetchMe(currentId);
                } catch (e: any) {
                    console.error(
                        "Error in user ID watch calling fetchMe:",
                        e.message,
                    );
                }
            }
        } else if (!currentId && userSettings.value) {
            // User logged out and we still have old userSettings. `useAsyncData` should re-run due to its watch
            // and return null, which will then trigger the userSettings watcher to clear things if needed.
            // console.log('User ID watcher: User logged out, useAsyncData should clear userSettings.');
        }
    },
    {
        immediate: true,
        deep: false,
    },
);

// Forum announcement
const announcement = ref<{
    threadId: string;
    title: string;
    body: string;
    postId: string;
    author: { display_name: string };
    createdAt: string;
    categorySlug: string;
} | null>(null);

onMounted(async () => {
    try {
        const data = await $fetch("/api/forum/announcement");
        if (data) {
            announcement.value = data;
        }
    } catch {}
});

function formatAnnouncementDate(date: string) {
    return new Intl.DateTimeFormat(navigator.language, {
        dateStyle: "medium",
    }).format(new Date(date));
}

const announcementDate = dayjs.tz("2025-12-01", "America/Los_Angeles");
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
        return titleChunk ? `${titleChunk} | ClockTracker` : "ClockTracker";
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
    Colors,
    ChartDataLabels,
);

// Datalabels off by default.
ChartJS.defaults.set("plugins.datalabels", {
    display: false,
});

// Disable animations to prevent requestAnimationFrame stutter when many
// charts render or re-render simultaneously.
ChartJS.defaults.set("animation", false as unknown as Record<string, unknown>);
</script>

<style>
body {
    @apply bg-stone-50 dark:bg-stone-800 font-gothic dark:text-stone-100;
}

.ct-card {
    @apply p-4 relative rounded border dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 overflow-hidden;

    &--event {
        @apply p-0;
    }

    &__title {
        @apply font-sorts text-xl lg:text-2xl;
    }

    &__subline {
        @apply text-sm text-stone-500 dark:text-stone-400;
    }

    &__tags {
        @apply flex gap-6 mt-2 text-stone-600;
    }

    a:not(.overlay-link),
    button:not(.overlay-link) {
        position: relative;
        z-index: 1;
    }

    .overlay-link::after {
        content: "";
        inset: 0;
        position: absolute;

        @apply transition duration-150 rounded border border-transparent hover:border-purple-700;
    }
}

.ct-contextual-links {
    @apply absolute right-0 z-10;
    @apply flex flex-col items-start min-w-[150px];
    @apply divide-y divide-stone-100 dark:divide-stone-900;
    @apply overflow-hidden whitespace-nowrap;
    @apply bg-stone-100 dark:bg-stone-900 rounded shadow-md;
    @apply rounded shadow-md;
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

    --color-base-100: theme(colors.stone.100);
    --color-base-200: theme(colors.stone.200);
    --color-base-300: theme(colors.stone.300);
    --color-base-content: theme(colors.zinc.900);

    --tailwind-spacing: 0.25rem;
    --border: 1px;
    --depth: 1;
    --noise: 0;
}

.dark {
    --color-base-100: theme(colors.stone.800);
    --color-base-200: theme(colors.stone.900);
    --color-base-300: theme(colors.stone.950);
    --color-base-content: theme(colors.stone.100);
}

.post img {
    @apply max-w-full rounded mx-auto block;
}

.post blockquote {
    @apply border-l-2 border-stone-400 dark:border-stone-600 pl-4 py-1 my-2 opacity-75;
}

.v-select {
    white-space: nowrap;
    position: relative;
}
</style>
