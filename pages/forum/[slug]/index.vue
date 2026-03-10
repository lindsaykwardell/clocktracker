<template>
  <StandardTemplate>
    <div class="px-4 lg:px-8 pt-4 lg:pt-8 pb-4 lg:pb-8 max-w-4xl mx-auto">
      <nuxt-link
        to="/forum"
        class="text-sm text-stone-500 dark:text-stone-400 hover:underline"
      >
        &larr; Discussions
      </nuxt-link>

      <div class="flex items-center justify-between mt-3 mb-2">
        <h1 class="font-sorts text-2xl lg:text-3xl">
          {{ categoryName }}
        </h1>
        <nuxt-link v-if="isLoggedIn && canCreateThread" :to="`/forum/${slug}/new`">
          <Button color="primary">New Thread</Button>
        </nuxt-link>
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
          <nuxt-link
            v-for="thread in threadData.data.threads"
            :key="thread.id"
            :to="threadLink(thread)"
            class="flex items-center justify-between p-4 rounded border
                   border-stone-300 dark:border-stone-700/50
                   bg-stone-300/40 dark:bg-stone-900/50
                   hover:bg-stone-300/60 dark:hover:bg-stone-800/50
                   transition-colors"
          >
            <div class="flex items-center gap-3 min-w-0">
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
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold truncate" :class="thread.has_unread ? '' : 'text-stone-400 dark:text-stone-500'">{{ thread.title }}</h3>
                  <div class="flex items-center gap-1 shrink-0" v-if="thread.is_pinned || thread.is_locked">
                    <IconUI v-if="thread.is_pinned" id="pin" size="sm" class="text-primary" />
                    <Badge v-if="thread.is_locked" color="caution" size="sm">Locked</Badge>
                  </div>
                </div>
                <p class="text-sm text-stone-500 dark:text-stone-400">
                  by {{ thread.author.display_name }}
                  &middot; {{ formatDate(thread.created_at) }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0 ml-4">
              <IconUI
                v-if="thread.is_subscribed"
                id="star"
                size="sm"
                class="text-primary shrink-0"
                title="Subscribed"
              />
              <div class="text-right text-sm text-stone-500 dark:text-stone-400">
                <div>{{ thread._count.posts }} posts</div>
                <div class="text-xs">{{ formatDate(thread.last_post_at) }}</div>
              </div>
            </div>
          </nuxt-link>
        </div>
        <p v-else class="text-center py-3 text-stone-400">
          No threads yet. Start the conversation!
        </p>

        <div
          v-if="threadData.data.total > threadData.data.perPage"
          class="flex justify-center gap-2 mt-4"
        >
          <Button
            v-if="page > 1"
            @click="page--"
            color="secondary"
            size="sm"
          >
            Previous
          </Button>
          <span class="flex items-center text-sm text-stone-500">
            Page {{ page }}
          </span>
          <Button
            v-if="threadData.data.total > page * threadData.data.perPage"
            @click="page++"
            color="secondary"
            size="sm"
          >
            Next
          </Button>
        </div>
      </template>
      <Loading v-else />
    </div>
  </StandardTemplate>
</template>

<script setup lang="ts">
import { Status } from "~/composables/useFetchStatus";

const route = useRoute();
const slug = computed(() => route.params.slug as string);
const forum = useForum();
const user = useUser();
const me = useMe();
const page = ref(1);

const forumMe = ref<{ permissions: string[]; is_admin: boolean } | null>(null);

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

function threadLink(thread: { id: string; has_unread?: boolean; _count: { posts: number } }) {
  const base = `/forum/${slug.value}/${thread.id}`;
  if (thread.has_unread) return `${base}?unread=1`;
  // If all read and multi-page, go to last page
  const perPage = 25;
  const lastPage = Math.ceil(thread._count.posts / perPage);
  if (lastPage > 1) return `${base}?page=${lastPage}`;
  return base;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "medium",
  }).format(new Date(date));
}

onMounted(async () => {
  forum.fetchThreads(slug.value, page.value);
  try {
    forumMe.value = await $fetch("/api/forum/me");
  } catch {}
});
watch(page, (p) => forum.fetchThreads(slug.value, p));

useHead({ title: () => categoryName.value || "Discussions" });
</script>
