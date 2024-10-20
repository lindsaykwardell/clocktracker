<template>
  <StandardTemplate>
    <div class="flex justify-center items-center h-screen">
      <Loading />
    </div>
  </StandardTemplate>
</template>

<script setup lang="ts">
const router = useRouter();
const route = useRoute();
const eventId = route.params.eventId as string;

onMounted(() => {
  // Redirect to the new URL
  router.push(`/event/${eventId}`);
});
</script>
