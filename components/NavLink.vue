<template>
  <nuxt-link
    :to="to"
    class="text-stone-900 hover:text-stone-800 dark:text-stone-200 dark:hover:text-stone-100 hover:underline flex gap-2 items-center whitespace-nowrap w-full"
  >
    <div class="relative">
      <div class="w-[50px] overflow-hidden">
        <span
          v-if="notificationCount && notificationCount > 0"
          class="absolute top-1 left-1 text-stone-200 bg-red-800 rounded-full px-2 py-1 text-xs font-bold aspect-square"
          aria-label="Unread notifications"
        >
          {{ notificationCount }}
        </span>
        <img :src="`/img/role/${icon}.png`" class="max-w-[125%]" alt="" />
      </div>
    </div>
    <span class="">
      <slot />
    </span>
  </nuxt-link>
</template>

<script setup lang="ts">
defineProps<{
  to: string;
  icon: string;
  notificationCount?: number;
}>();
</script>
