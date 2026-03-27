<template>
  <nuxt-link
    :to="`/forum/${category.slug}`"
    class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded border
           border-stone-300 dark:border-stone-700/50
           bg-stone-300/40 dark:bg-stone-900/50
           hover:bg-stone-300/60 dark:hover:bg-stone-800/50
           transition-colors gap-1 sm:gap-0"
  >
    <div class="flex items-center gap-3">
      <span
        v-if="category.unread_count"
        class="w-2 h-2 rounded-full bg-primary shrink-0"
      />
      <div>
        <h3 class="font-sorts text-lg">{{ category.name }}</h3>
        <p
          v-if="category.description"
          class="text-sm text-stone-500 dark:text-stone-400"
        >
          {{ category.description }}
        </p>
      </div>
    </div>
    <div class="text-sm text-stone-500 dark:text-stone-400 shrink-0 sm:ml-4 sm:text-right pl-5 sm:pl-0">
      <div>
        {{ category.threadCount }} threads<template v-if="category.unread_count"> · <span class="text-primary/80">{{ category.unread_count }} unread</span></template>
      </div>
      <div v-if="category.lastPost" class="text-xs mt-0.5">
        Latest by {{ category.lastPost.author.display_name }}
      </div>
    </div>
  </nuxt-link>
</template>

<script setup lang="ts">
import type { ForumCategory } from "~/composables/useForum";

defineProps<{
  category: ForumCategory;
}>();
</script>
