<template>
  <Dialog v-model:visible="show" size="md">
    <template #title>
      <slot name="title" />
    </template>
    <div class="p-4">
      <slot />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
const user = useSupabaseUser();

const props = defineProps<{
  id: string;
}>();

const show = ref(false);

onMounted(() => {
  const latestAnnouncement = localStorage.getItem("announcement");
  if (user.value && latestAnnouncement !== props.id) {
    show.value = true;
    localStorage.setItem("announcement", props.id);
  }
});

watch(user, () => {
  const latestAnnouncement = localStorage.getItem("announcement");
  if (user.value && latestAnnouncement !== props.id) {
    show.value = true;
    localStorage.setItem("announcement", props.id);
  }
});
</script>
