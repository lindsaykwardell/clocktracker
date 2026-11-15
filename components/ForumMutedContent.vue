<template>
  <div>
    <template v-if="!loaded">
      <button v-if="error" type="button" class="text-sm underline" @click.stop.prevent="refresh">Unable to load mute preferences. Retry</button>
      <span v-else class="text-sm text-stone-500">Loading content…</span>
    </template>
    <template v-else>
      <div v-if="isMuted" class="flex items-center justify-between gap-3 text-sm text-stone-500 dark:text-stone-400">
        <span>Content from a muted user</span>
        <button type="button" class="text-primary underline" :aria-expanded="revealed" @click.stop.prevent="revealed = !revealed">
          {{ revealed ? 'Hide muted content' : 'View muted content' }}
        </button>
      </div>
      <div v-if="!isMuted || revealed" :class="{ 'mt-3': isMuted }"><slot /></div>
    </template>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{ authorId: string }>();
const { muted, loaded, error, refresh } = useForumMutes();
const isMuted = computed(() => !!muted.value[props.authorId]);
const revealed = ref(false);
watch(isMuted, () => { revealed.value = false; });
</script>
