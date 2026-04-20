<template>
  <div class="relative">
    <Token
      :class="reminderTypeClass"
      :character="{ role: { token_url: reminder.token_url, type: '' } }"
      :size="size ?? 'reminder'"
      :reminderText="reminder.reminder"
    >
    </Token>
    <span
      v-if="isTrackingRelevant"
      class="pointer-events-none absolute -bottom-4 left-[50%] translate-x-[-50%]"
      title="Used for grimoire event tracking"
    >
      <IconUI id="crosshair" color="muted" />
      <div class="sr-only">Tracking Reminder</div>
    </span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  reminder: {
    token_url: string;
    reminder: string;
    type?: "OFFICIAL" | "TRACKING" | "IMPORTED" | "LEGACY" | "CUSTOM" | null;
  };
  size?: "sm-reminder" | "reminder";
  isTrackingRelevant?: boolean;
}>();

const reminderTypeClass = computed(
  () => `reminder--${(props.reminder.type ?? "CUSTOM").toLowerCase()}`
);

const isTrackingRelevant = computed(() => props.isTrackingRelevant ?? false);
</script>
