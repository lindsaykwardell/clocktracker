<template>
  <LoginForm />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "guest",
});
</script>
