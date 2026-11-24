<template>
  <nuxt-link
    :to="to"
    :aria-current="isCurrent ? 'page' : undefined"
  >
    <div class="relative">
      <div class="w-[24px] md:w-[32px] overflow-hidden">
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
const props = defineProps<{
  to: string;
  icon: string;
  notificationCount?: number;
}>();

const route = useRoute();
const router = useRouter();

// The router's own check ignores the query, so "My Games" (?view=games) and
// "My Stats" (?view=stats) would both count as current on either tab.
const isCurrent = computed(() => {
  const target = router.resolve(props.to);
  if (target.path !== route.path) return false;
  return Object.entries(target.query).every(
    ([key, value]) => String(route.query[key] ?? "") === String(value ?? "")
  );
});
</script>
