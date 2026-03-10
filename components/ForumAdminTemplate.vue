<template>
  <StandardTemplate>
    <div class="px-4 lg:px-8 pt-4 lg:pt-8 pb-4 lg:pb-8 max-w-4xl mx-auto">
      <nuxt-link
        to="/forum/admin"
        class="text-sm text-stone-500 dark:text-stone-400 hover:underline"
      >
        &larr; Administration
      </nuxt-link>
      <h1 class="font-sorts text-2xl lg:text-3xl mt-2 mb-6">{{ title }}</h1>

      <template v-if="!hasAccess">
        <p class="text-center py-8 text-stone-400">
          You do not have permission to access this page.
        </p>
      </template>

      <template v-else>
        <slot />
      </template>
    </div>
  </StandardTemplate>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  hasAccess: boolean;
}>();
</script>
