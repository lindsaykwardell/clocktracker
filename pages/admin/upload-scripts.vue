<template>
  <input type="file" @change="upload" />
  {{ uploadResult }}
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

const uploadResult = ref("");

async function upload(event: Event) {
  // Parse selected CSV
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  // Get file contents
  const contents = await file.text();

  const result = await useFetch("/api/admin/upload-scripts", {
    method: "POST",
    body: contents,
  });

  if (result.data.value) {
    uploadResult.value = `Uploaded ${result.data.value.count} scripts!`;
  }
}
</script>
