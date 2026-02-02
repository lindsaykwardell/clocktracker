<template>
  <nuxt-link
    :to="to"
  >
    <div class="relative">
      <div class="w-[28px] md:w-[32px] overflow-hidden">
        <ImageUI :image="icon" alt="" />
      </div>
    </div>
    <span class="flex justify-between">
      <slot />
      <Badge
        v-if="notificationCount && notificationCount > 0"
        color="negative"
        size="sm"
      >
        <span class="sr-only">Unread notifications: </span>{{ notificationCount }}
      </Badge>
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
