<template>
  <div
    class="shadow p-3 rounded my-4 bg-gray-200 dark:bg-stone-900 dark:text-stone-300 text-sm"
  >
    <div class="flex flex-wrap items-center gap-4 md:h-12">
      <Avatar :value="post.user.avatar" size="xs" />
      <div class="flex flex-col flex-grow">
        <div>{{ post.user.display_name }}</div>
        <div class="text-sm">
          <a href="#" class="decoration-stone-500 dark:decoration-stone-400">
            <span class="text-stone-500 dark:text-stone-400">
              {{ post.user.username }}
            </span>
          </a>
        </div>
      </div>
    </div>
    <VueMarkdown class="post" :source="post.content" />
    <div
      class="text-sm flex gap-4 px-4 pt-3 text-stone-500 dark:text-stone-400"
    >
      <div class="flex gap-4 md:gap-12 flex-grow">
        <div class="flex gap-3 items-center">
          <svg width="24" height="24" viewBox="0 0 28 28">
            <path
              fill="currentColor"
              d="M10.03 5.47a.75.75 0 0 1 0 1.06L5.56 11h8.69C20.187 11 25 15.813 25 21.75a.75.75 0 0 1-1.5 0a9.25 9.25 0 0 0-9.25-9.25H5.56l4.47 4.47a.75.75 0 1 1-1.06 1.06l-5.75-5.75a.75.75 0 0 1 0-1.06l5.75-5.75a.75.75 0 0 1 1.06 0Z"
            />
          </svg>
          {{ repliesCount }}
        </div>
      </div>
      <div class="flex gap-2 md:gap-4 flex-shrink items-center">
        <time class="text-stone-500 dark:text-stone-400">{{
          formattedDate
        }}</time>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CommunityPost } from "~/composables/useCommunities";
import VueMarkdown from "vue-markdown-render";

const props = defineProps<{
  post: CommunityPost;
}>();

const repliesCount = 0;

const formattedDate = computed(() => {
  return new Intl.DateTimeFormat(navigator.language).format(
    new Date(props.post.created_at)
  );
});
</script>

<style>
.post {
  h1 {
    @apply text-3xl;
  }
  h2 {
    @apply text-2xl;
  }
  h3 {
    @apply text-xl;
  }
  h4 {
    @apply text-lg;
  }
  h5 {
    @apply text-base;
  }
  h6 {
    @apply text-sm;
  }

  ul {
    @apply list-disc list-inside;
  }
  ol {
    @apply list-decimal list-inside;
  }
  li {
    @apply my-1;
  }
  li ul,
  li ol {
    @apply ml-4;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    @apply my-4;
  }

  p,
  ul,
  ol,
  table,
  pre,
  img {
    @apply my-2;
  }

  table {
    @apply w-full;
    th {
      @apply bg-stone-300 font-bold;
    }
    tr {
      @apply border-b border-stone-300;
    }
    tr:nth-child(even) {
      @apply bg-stone-200;
    }
    td {
      @apply p-1;
    }
  }
  a {
    @apply text-blue-600 hover:underline;
  }
  hr {
    @apply my-4 border-stone-300;
  }
}
</style>
