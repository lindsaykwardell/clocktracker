<template>
  <nuxt-link
    :to="to"
    class="flex gap-2 items-center justify-between whitespace-nowrap w-full px-3 py-3 rounded text-stone-900 hover:bg-stone-300 dark:text-stone-200 dark:hover:bg-stone-700"
  >
    <div class="flex gap-2 items-center">
      <div class="relative">
        <div class="w-[38px] overflow-hidden">
          <ImageUI :image="icon" alt="" />
        </div>
      </div>
      <span class="w-full">
        <slot />
      </span>
    </div>
    
    <Badge
      v-if="notificationCount && notificationCount > 0"
      color="negative"
      size="sm"
    >
      <span class="sr-only">Unread notifications: </span>{{ notificationCount }}
    </Badge>
  </nuxt-link>
</template>

<script setup lang="ts">
defineProps<{
  to: string;
  icon: string;
  notificationCount?: number;
}>();
</script>
