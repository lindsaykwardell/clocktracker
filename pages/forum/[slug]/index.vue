<template>
  <StandardTemplate>
    <div class="px-4 lg:px-8 pt-4 lg:pt-8 pb-4 lg:pb-8 max-w-4xl mx-auto overflow-hidden">
      <nuxt-link
        to="/forum"
        class="text-sm text-stone-500 dark:text-stone-400 hover:underline"
      >
        &larr; Discussions
      </nuxt-link>

      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 mb-2 gap-2">
        <h1 class="font-sorts text-2xl lg:text-3xl">
          {{ categoryName }}
        </h1>
        <div class="flex items-center gap-2 shrink-0">
          <Button
            v-if="isLoggedIn"
            color="contrast"
            size="sm"
            class="![--btn-border:theme(colors.stone.300)] dark:![--btn-border:theme(colors.stone.700)] hover:![--btn-border:var(--btn-bg)]"
            :class="isCategorySubscribed ? '[&:not(:hover)_.ui-icon]:text-primary dark:[&:not(:hover)_.ui-icon]:text-purple-400' : ''"
            :icon="isCategorySubscribed ? 'bell-fill' : 'bell'"
            :aria-pressed="isCategorySubscribed"
            @click="toggleCategorySubscription"
            :disabled="subscribing"
          >
            {{ isCategorySubscribed ? "Subscribed" : "Subscribe" }}
          </Button>
          <nuxt-link v-if="isLoggedIn && canCreateThread" :to="`/forum/${slug}/new`">
            <Button color="primary" size="sm">New Thread</Button>
          </nuxt-link>
        </div>
      </div>

      <p
        v-if="categoryDescription"
        class="text-sm text-stone-500 dark:text-stone-400 mb-6 lg:mb-8"
      >
        {{ categoryDescription }}
      </p>
      <div v-else class="mb-6 lg:mb-8" />

      <template v-if="threadData?.status === Status.SUCCESS">
        <div
          v-if="threadData.data.threads.length"
          class="flex flex-col gap-2"
        >
          <ForumMutedContent v-for="thread in threadData.data.threads" :key="thread.id" :author-id="thread.author.user_id">
<nuxt-link
            :to="threadLink(thread)"
            class="flex items-center gap-3 p-3 sm:p-4 rounded border
                   border-stone-300 dark:border-stone-700/50
                   bg-stone-300/40 dark:bg-stone-900/50
                   hover:bg-stone-300/60 dark:hover:bg-stone-800/50
                   transition-colors"
          >
            <div class="relative shrink-0">
              <Avatar
                :value="thread.author.avatar"
                size="sm"
                class="border-stone-800"
                background
              />
              <span
                v-if="thread.has_unread"
                class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-stone-100 dark:border-stone-900"
              />
            </div>
            <!-- Left: what it is and who started it. Right: how active it is. -->
            <div class="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <!-- Unread: bold, full colour. Read: normal weight, a step lighter but still readable. -->
                <h3 class="break-words min-w-0" :class="thread.has_unread ? 'font-semibold' : 'font-normal text-stone-600 dark:text-stone-400'">{{ thread.title }}</h3>
                <IconUI v-if="thread.is_pinned" id="pin" size="sm" class="text-primary shrink-0" />
                <Badge v-if="thread.is_locked" color="caution" size="sm" class="shrink-0">Locked</Badge>
              </div>
              <p class="text-sm text-stone-600 dark:text-stone-400">
                by {{ thread.author.display_name }} on {{ formatShortDate(thread.created_at) }}
              </p>
            </div>
            <div class="shrink-0 flex flex-wrap sm:flex-col gap-x-3 sm:items-end text-stone-600 dark:text-stone-400">
              <span class="flex items-center gap-1 text-sm">
                <IconUI
                  v-if="thread.is_subscribed"
                  id="bell-fill"
                  size="xs"
                  class="text-primary dark:text-purple-400"
                  title="Subscribed"
                />
                {{ thread._count.posts }} {{ thread._count.posts === 1 ? "post" : "posts" }}
              </span>
              <span class="text-sm sm:text-xs">last post {{ formatShortDate(thread.last_post_at) }}</span>
            </div>
            </div>
          </nuxt-link>
</ForumMutedContent>
        </div>
        <p v-else class="text-center py-3 text-stone-400">
          No threads yet. Start the conversation!
        </p>

        <Pager
          v-if="threadData.data.total > threadData.data.perPage"
          v-model:page="page"
          :total-pages="Math.ceil(threadData.data.total / threadData.data.perPage)"
          class="mt-4"
        />
      </template>
      <Loading v-else />
    </div>
  </StandardTemplate>
</template>

<script setup lang="ts">
import { Status } from "~/composables/useFetchStatus";

const route = useRoute();
const router = useRouter();
const slug = computed(() => route.params.slug as string);
const forum = useForum();
const user = useUser();
const me = useMe();
const page = ref(Math.max(1, Number(route.query.page) || 1));

const forumMe = ref<{ permissions: string[]; is_admin: boolean } | null>(null);
const isCategorySubscribed = ref(false);
const subscribing = ref(false);

const isLoggedIn = computed(() => !!user.value);

const isModOrAdmin = computed(() => {
  const meVal = me.value;
  if (meVal.status === Status.SUCCESS && meVal.data.is_admin) return true;
  if (!forumMe.value) return false;
  return forumMe.value.permissions.some((p) =>
    ["EDIT_ANY_POST", "DELETE_ANY_POST", "LOCK_THREAD", "PIN_THREAD", "BAN_USER", "MANAGE_CATEGORIES"].includes(p)
  );
});

const threadData = computed(() => forum.threads.get(slug.value));

const canCreateThread = computed(() => {
  const data = threadData.value;
  if (data?.status !== Status.SUCCESS) return true;
  if (!data.data.category.mod_posting_only) return true;
  return isModOrAdmin.value;
});

const categoryName = computed(() => {
  const data = threadData.value;
  if (data?.status === Status.SUCCESS) return data.data.category.name;
  return "";
});

const categoryDescription = computed(() => {
  const data = threadData.value;
  if (data?.status === Status.SUCCESS) return data.data.category.description;
  return null;
});

// Sync category subscription status from fetched data
watch(threadData, (data) => {
  if (data?.status === Status.SUCCESS) {
    isCategorySubscribed.value = data.data.category.is_subscribed ?? false;
  }
}, { immediate: true });

async function toggleCategorySubscription() {
  subscribing.value = true;
  try {
    const result = await $fetch<{ subscribed: boolean }>(`/api/forum/categories/${slug.value}/subscribe`, {
      method: "POST",
    });
    isCategorySubscribed.value = result.subscribed;
  } catch {
    // ignore
  } finally {
    subscribing.value = false;
  }
}

function threadLink(thread: { id: string; has_unread?: boolean; _count: { posts: number } }) {
  const base = `/forum/${slug.value}/${thread.id}`;
  if (thread.has_unread) return `${base}?unread=1`;
  // If all read and multi-page, go to last page
  const perPage = 25;
  const lastPage = Math.ceil(thread._count.posts / perPage);
  if (lastPage > 1) return `${base}?page=${lastPage}`;
  return base;
}

onMounted(async () => {
  forum.fetchThreads(slug.value, page.value);
  try {
    forumMe.value = await $fetch("/api/forum/me");
  } catch {}
});
// Keep ?page in the address in step with the page shown (reload, shared links).
watch(page, (p) => {
  forum.fetchThreads(slug.value, p);
  const { page: _page, ...rest } = route.query;
  router.replace({ query: p > 1 ? { ...rest, page: String(p) } : rest });
});

useHead({ title: () => categoryName.value || "Discussions" });
</script>
