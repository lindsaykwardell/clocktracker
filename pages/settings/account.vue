<template>
  <SettingsTemplate>
    <section
      class="w-full flex flex-col items-center justify-center gap-12 py-4"
    >
      <h2 class="font-dumbledor text-4xl text-center">Account & Data</h2>
      <div class="w-full text-left">
        <a href="/api/export" class="underline">Export Game Data</a>
        <p>Exporting game data will download a CSV file with all of your game details. Some details, such as the grimoire and attached files, cannot be exported.</p>
      </div>
    </section>
  </SettingsTemplate>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});
</script>
