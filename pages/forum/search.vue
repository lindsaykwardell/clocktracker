<template>
  <StandardTemplate>
    <div class="px-4 lg:px-8 pt-4 lg:pt-8 pb-4 lg:pb-8 max-w-4xl mx-auto">
      <nuxt-link
        to="/forum"
        class="text-sm text-stone-500 dark:text-stone-400 hover:underline"
      >
        &larr; Discussions
      </nuxt-link>
      <h1 class="font-sorts text-2xl lg:text-3xl mt-2 mb-6">Search</h1>

      <form @submit.prevent="search" class="flex gap-2 mb-6">
        <Input v-model="query" placeholder="Search discussions..." class="flex-1" />
        <Button type="submit" color="primary" :disabled="!query.trim() || loading">
          Search
        </Button>
      </form>

      <Loading v-if="loading" />

      <template v-else-if="hasSearched">
        <!-- Thread results -->
        <template v-if="results.threads.length">
          <h2 class="font-sorts text-lg mb-3">Threads</h2>
          <div class="flex flex-col gap-2 mb-6">
            <nuxt-link
              v-for="thread in results.threads"
              :key="thread.id"
              :to="`/forum/${thread.categorySlug}/${thread.id}`"
              class="p-3 rounded border border-stone-300 dark:border-stone-700/50
                     bg-stone-300/40 dark:bg-stone-900/50 hover:border-purple-700
                     transition-colors block"
            >
              <div class="font-semibold">{{ thread.title }}</div>
              <div class="text-xs text-stone-500 dark:text-stone-400 mt-1">
                {{ thread.author.display_name }}
                &middot; {{ thread.postCount }} {{ thread.postCount === 1 ? "post" : "posts" }}
                &middot; {{ formatDate(thread.last_post_at) }}
              </div>
            </nuxt-link>
          </div>
        </template>

        <!-- Post results -->
        <template v-if="results.posts.length">
          <h2 class="font-sorts text-lg mb-3">Posts</h2>
          <div class="flex flex-col gap-2">
            <nuxt-link
              v-for="post in results.posts"
              :key="post.id"
              :to="`/forum/${post.thread.categorySlug}/${post.thread.id}`"
              class="p-3 rounded border border-stone-300 dark:border-stone-700/50
                     bg-stone-300/40 dark:bg-stone-900/50 hover:border-purple-700
                     transition-colors block"
            >
              <div class="text-sm font-semibold text-stone-500 dark:text-stone-400">
                {{ post.thread.title }}
              </div>
              <p class="text-sm mt-1 line-clamp-2">{{ post.body }}</p>
              <div class="text-xs text-stone-500 dark:text-stone-400 mt-1">
                {{ post.author.display_name }} &middot; {{ formatDate(post.created_at) }}
              </div>
            </nuxt-link>
          </div>
        </template>

        <p
          v-if="!results.threads.length && !results.posts.length"
          class="text-center py-8 text-stone-400"
        >
          No results found for "{{ lastQuery }}".
        </p>
      </template>
    </div>
  </StandardTemplate>
</template>

<script setup lang="ts">
type SearchResults = {
  threads: {
    id: string;
    title: string;
    created_at: string;
    last_post_at: string;
    author: { display_name: string };
    postCount: number;
    categorySlug: string;
  }[];
  posts: {
    id: string;
    body: string;
    created_at: string;
    author: { display_name: string };
    thread: {
      id: string;
      title: string;
      categorySlug: string;
    };
  }[];
};

const query = ref("");
const lastQuery = ref("");
const loading = ref(false);
const hasSearched = ref(false);
const results = ref<SearchResults>({ threads: [], posts: [] });

async function search() {
  if (!query.value.trim()) return;
  loading.value = true;
  lastQuery.value = query.value;

  try {
    results.value = await $fetch<SearchResults>("/api/forum/search", {
      query: { q: query.value },
    });
    hasSearched.value = true;
  } catch (err: any) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "medium",
  }).format(new Date(date));
}

// If query param is present, search immediately
const route = useRoute();
if (route.query.q) {
  query.value = route.query.q as string;
  search();
}

useHead({ title: "Search Discussions" });
</script>
