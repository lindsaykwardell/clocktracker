<template>
  <StandardTemplate>
    <div class="px-4 lg:px-8 pt-4 lg:pt-8 pb-4 lg:pb-8 max-w-4xl mx-auto">
      <nuxt-link
        to="/forum"
        class="text-sm text-stone-500 dark:text-stone-400 hover:underline"
      >
        &larr; Discussions
      </nuxt-link>
      <h1 class="font-sorts text-2xl lg:text-3xl mt-2 mb-6">Subscribed Threads</h1>

      <div class="flex gap-2 mb-4">
        <Button
          :color="showUnreadOnly ? 'primary' : 'secondary'"
          size="sm"
          @click="showUnreadOnly = !showUnreadOnly"
        >
          {{ showUnreadOnly ? "Showing unread" : "Show all" }}
        </Button>
      </div>

      <Loading v-if="loading" />
      <p v-else-if="subscriptions.length === 0" class="text-center py-8 text-stone-400">
        {{ showUnreadOnly ? "No unread threads." : "You haven't subscribed to any threads yet." }}
      </p>
      <div v-else class="flex flex-col gap-2">
        <nuxt-link
          v-for="sub in subscriptions"
          :key="sub.id"
          :to="`/forum/${sub.thread.categorySlug}/${sub.thread.id}`"
          class="p-3 rounded border transition-colors block"
          :class="sub.hasUnread
            ? 'border-primary/50 bg-primary/5 hover:border-primary'
            : 'border-stone-300 dark:border-stone-700/50 bg-stone-300/40 dark:bg-stone-900/50 hover:border-purple-700'"
        >
          <div class="flex items-center gap-2">
            <span
              v-if="sub.hasUnread"
              class="w-2 h-2 rounded-full bg-primary shrink-0"
            />
            <span class="font-semibold">{{ sub.thread.title }}</span>
          </div>
          <div class="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {{ sub.thread.author.display_name }}
            &middot; {{ sub.thread.postCount }} {{ sub.thread.postCount === 1 ? "post" : "posts" }}
            &middot; last activity {{ formatDate(sub.thread.lastPostAt) }}
          </div>
        </nuxt-link>
      </div>
    </div>
  </StandardTemplate>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });

type Subscription = {
  id: string;
  lastReadAt: string;
  hasUnread: boolean;
  thread: {
    id: string;
    title: string;
    lastPostAt: string;
    categorySlug: string;
    author: { display_name: string };
    postCount: number;
  };
};

const subscriptions = ref<Subscription[]>([]);
const loading = ref(true);
const showUnreadOnly = ref(true);

async function fetchSubscriptions() {
  loading.value = true;
  try {
    subscriptions.value = await $fetch<Subscription[]>("/api/forum/subscriptions", {
      query: { unread: showUnreadOnly.value },
    });
  } catch {
    subscriptions.value = [];
  } finally {
    loading.value = false;
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

onMounted(fetchSubscriptions);
watch(showUnreadOnly, fetchSubscriptions);

useHead({ title: "Subscribed Threads" });
</script>
