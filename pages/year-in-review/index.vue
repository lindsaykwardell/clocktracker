<template>
  <div class="flex h-screen w-screen justify-center items-center">
    <Loading />
  </div>
</template>

<script setup lang="ts">
const user = useMe();
const router = useRouter();

onMounted(async () => {
  if (user.value.status === Status.SUCCESS) {
    const yirId = await $fetch("/api/year_in_review");

    if (yirId) {
      router.push(`/year-in-review/2024/${yirId}`);
    } else {
      router.push("/404");
    }
  }
});
</script>
