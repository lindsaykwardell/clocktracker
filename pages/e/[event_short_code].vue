<template>
  <StandardTemplate>
    <div class="flex h-screen items-center justify-center">
      <Loading />
    </div>
  </StandardTemplate>
</template>

<script setup lang="ts">
const router = useRouter();
const route = useRoute();
const response = await useFetch(`/api/e/${route.params.event_short_code}`);

if (response.data) {
  router.push(response.data.value!);
} else {
  router.push("/404");
}
</script>
