<template>
  <img :src="resolvedSrc" />
</template>

<script setup lang="ts">
import { isOfflineImageRef, getOfflineImageObjectURL } from "~/utils/offlineImages";

const props = defineProps<{ src: string }>();

const config = useRuntimeConfig();
const resolvedSrc = ref("");
let objectUrl: string | null = null;

function revoke() {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }
}

function storagePath(file: string) {
  return `${config.public.supabase.url}/storage/v1/object/public/game-attachments/${file}`;
}

async function resolve(src: string) {
  revoke();
  if (isOfflineImageRef(src)) {
    // Locally-stored image waiting to sync — render from its blob.
    objectUrl = await getOfflineImageObjectURL(src);
    resolvedSrc.value = objectUrl ?? "";
  } else if (src.startsWith("http")) {
    resolvedSrc.value = src;
  } else {
    resolvedSrc.value = storagePath(src);
  }
}

watch(() => props.src, resolve, { immediate: true });
onUnmounted(revoke);
</script>
