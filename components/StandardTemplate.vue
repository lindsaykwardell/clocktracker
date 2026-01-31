<template>
  <div class="main-layout">
    <Sidebar />
    <main class="flex-grow">
      <Topbar
        :expandSearchBar="expandSearchBar"
        :customSearch="customSearch"
        :customSearchPlaceholder="customSearchPlaceholder"
      />
      <ClientOnly>
        <div
          v-if="featureFlags.maintenanceIsScheduled"
          class="bg-orange-400 dark:bg-orange-900 p-2 min-h-[42px]"
        >
          <p class="ml-[42px] md:ml-0">
            On {{ formattedMaintenanceDate }}, ClockTracker will be down for
            scheduled maintenance. Please check Discord for updates.
          </p>
        </div>
      </ClientOnly>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

defineProps<{
  expandSearchBar?: boolean;
  customSearch?: (query: string) => void;
  customSearchPlaceholder?: string;
}>();

const featureFlags = useFeatureFlags();
// const showMenu = ref(false);

const formattedMaintenanceDate = computed(() => {
  if (!featureFlags.maintenanceIsScheduled) return "";

  return Intl.DateTimeFormat(navigator.language, {
    dateStyle: "full",
    timeStyle: "short",
  }).format(featureFlags.maintenanceIsScheduled);
});

</script>

<style>
.main-layout {
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  grid-template-columns: auto 1fr;

  /* &:has(#sidebar.open) {
    &:before {
      @apply bg-black;

      content: "";
      position: fixed;
      inset: 0;
      opacity: 0.25;
      z-index: 500;
    }
  } */
}

@media(max-width: 800px){
  .main-layout {
    grid-template-columns: 1fr;
  }
}
</style>
