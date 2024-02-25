<template>
  <Token
    :character="{ role: { token_url: reminder.token_url } }"
    size="reminder"
  >
    <template #reminder>
      {{ reminder.reminder }}
    </template>
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
