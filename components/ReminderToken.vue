<template>
  <Token
    :class="reminderTypeClass"
    :character="{ role: { token_url: reminder.token_url, type: '' } }"
    :size="size ?? 'reminder'"
    :reminderText="reminder.reminder"
  >
  </Token>
</template>

<script setup lang="ts">
const props = defineProps<{
  reminder: {
    token_url: string;
    reminder: string;
    type?: "OFFICIAL" | "TRACKING" | "CUSTOM" | null;
  };
  size?: "sm-reminder" | "reminder";
}>();

const reminderTypeClass = computed(
  () => `reminder--${(props.reminder.type ?? "CUSTOM").toLowerCase()}`
);
</script>
