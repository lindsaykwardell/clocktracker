<template>
  <StandardTemplate>
    <Spinner />
  </StandardTemplate>
</template>

<script setup lang="ts">
const router = useRouter();
const route = useRoute();
const gameId = route.params.id as string;

onMounted(() => {
  // Redirect to the new URL
  router.push(`/game/${gameId}`);
});
</script>
