<template>
  <Token
    :character="{ role: { token_url: reminder.token_url, type: '' } }"
    size="reminder"
    :reminderText="reminder.reminder"
  >
  </Token>
</template>

<script setup lang="ts">
defineProps<{
  reminder: {
    token_url: string;
    reminder: string;
  };
}>();
</script>
