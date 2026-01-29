<template>
  <SettingsTemplate>
    <section
      class="w-full flex flex-col items-center justify-center gap-12 py-4"
    >
      <h2 class="font-sorts text-4xl text-center">Account & Data</h2>
      <div class="space-y-4 w-full xl:w-3/4">
        <h3 class="text-2xl">Export Game Data</h3>
        <div class="w-full text-left max-w-[80ch]">
          <p class="text-stone-500 dark:text-stone-400">
            Exporting game data will download a CSV file with all of your game
            details. Some details, such as the grimoire and attached files, cannot
            be exported.
          </p>
        </div>
        <Button
          component="a"
          href="/api/export"
          color="primary"
        >
          Export Data
        </Button>
      </div>
      
    </section>
  </SettingsTemplate>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});
</script>
