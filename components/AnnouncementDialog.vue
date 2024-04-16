<template>
  <Dialog v-model:visible="show" size="md">
    <template #title>
      <slot name="title" />
    </template>
    <div class="p-4">
      <slot />
    </div>
    <div class="flex justify-center p-4">
      <a
        href="https://ko-fi.com/clocktracker"
        class="text-center text-lg bg-blue-950 hover:bg-blue-800 transition duration-150 text-white font-bold py-2 px-4 rounded flex justify-center gap-4 items-center"
      >
        <KoFi />
        <span>Support ClockTracker on Ko-fi</span>
      </a>
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
  }
});

watch(user, () => {
  const latestAnnouncement = localStorage.getItem("announcement");
  if (user.value && latestAnnouncement !== props.id) {
    show.value = true;
  }
});

watch(show, (value) => {
  if (!value) {
    localStorage.setItem("announcement", props.id);
  }
});
</script>
