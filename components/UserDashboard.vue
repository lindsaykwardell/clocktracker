<template>
  <template v-if="me.status === Status.SUCCESS">
    <div class="dashboard">
      <div
        ref="scrollContainerRef"
        class="content custom-scrollbar md:overflow-y-scroll pb-20 md:pb-0 px-4"
        :class="{
          block: selectedTab === 'updates',
          'hidden md:block': selectedTab === 'events',
        }"
      >
        <div class="max-w-[800px] w-full mx-auto mt-4 mb-8 space-y-8">
          
          <div class="space-y-2">
            <div>
              <h2 class="text-xl font-sorts">Stats at a glance</h2>
              <p class="text-xs text-stone-500 dark:text-stone-400">Changes shown for the last 30 days.</p>
            </div>
            <div>
              <UserStatsSummary
                v-if="userGames.status === Status.SUCCESS"
                :games="userGames.data"
                variant="dashboard"
                class="flex-none"
              />
            </div>
          </div>

          <div class="hidden md:grid grid-cols-2 gap-4">
            <div v-if="roleOfTheDay.data.value" class="flex items-center gap-4 rounded-lg border border-stone-300 dark:border-stone-700/50 p-4">
              <nuxt-link
                :to="`/roles/${roleOfTheDay.data.value.id}`"
                class="shrink-0"
              >
                <Token
                  size="front"
                  :character="{
                    name: roleOfTheDay.data.value.name,
                    alignment: roleOfTheDay.data.value.initial_alignment,
                    role: roleOfTheDay.data.value,
                  }"
                />
              </nuxt-link>
              <div>
                <h3 class="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Role of the Day</h3>
                <nuxt-link
                  :to="`/roles/${roleOfTheDay.data.value.id}`"
                  class="text-lg font-sorts hover:underline"
                >
                  {{ roleOfTheDay.data.value.name }}
                </nuxt-link>
              </div>
            </div>
            <div v-if="scriptsOfTheWeek.data.value" class="rounded-lg border border-stone-300 dark:border-stone-700/50 p-4">
              <h3 class="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Popular Scripts</h3>
              <ul class="space-y-1">
                <li v-for="script in scriptsOfTheWeek.data.value" :key="script.script_id">
                  <nuxt-link :to="getScriptLink(script)" class="text-sm hover:underline">
                    {{ script.script }}
                  </nuxt-link>
                </li>
              </ul>
            </div>
          </div>

          <hr class="border-stone-300 dark:border-stone-700/50" />

          <div class="space-y-2">
            <h2 class="text-3xl font-sorts">Activity Feed</h2>
            <ClientOnly>
              <ul class="mt-4 flex flex-col gap-3 lg:gap-6">
                <li v-for="update in allUpdates" class="max-w-[800px] w-full mx-auto">
                  <div class="flex flex-col gap-2">
                    <template v-if="update.kind === 'new_event'">
                      <div class="flex gap-2 items-center">
                        <Avatar :value="update.event.community?.icon" size="xs" aria-hidden="true" />
                        <div class="flex flex-col">
                          <span class="text-sm text-stone-500 dark:text-stone-400">
                            <template v-if="update.event.community">
                              New Event in
                              <nuxt-link
                                :to="`/community/${update.event.community?.slug}`"
                                class="font-semibold hover:underline"
                                >{{ update.event.community?.name }}</nuxt-link
                              >
                            </template>
                            <template v-else-if="update.event.created_by">
                              New Event by
                              <template
                                v-if="
                                  update.event.created_by.user_id ===
                                  me.data.user_id
                                "
                              >
                                you
                              </template>
                              <template v-else>
                                <nuxt-link
                                  :to="`/@${update.event.created_by.username}`"
                                  class="hover:underline"
                                  >{{
                                    update.event.created_by.display_name
                                  }}</nuxt-link
                                >
                              </template>
                            </template>
                          </span>
                        </div>
                      </div>
                      <EventCard
                        v-if="update.kind === 'new_event'"
                        :event="update.event"
                        display="large"
                      />
                    </template>

                    <template v-else-if="update.kind === 'new_post'">
                      <div class="flex gap-2 items-center">
                        <Avatar :value="update.post.community?.icon" size="xs" aria-hidden="true" />
                        <div class="flex flex-col">
                          <span class="text-sm text-stone-500 dark:text-stone-400">
                            New Post in
                            <nuxt-link
                              :to="`/community/${update.post.community?.slug}`"
                              class="hover:underline"
                            >
                              {{ update.post.community?.name }}
                            </nuxt-link>
                          </span>
                        </div>
                      </div>
                      <CommunityPost
                        v-if="update.kind === 'new_post'"
                        :post="update.post"
                        :community="update.post.community"
                        :isMember="true"
                        @deleted="postDeleted"
                      />
                    </template>

                    <template v-else-if="update.kind === 'friend_request'">
                      <div>
                        <div class="text-sm text-stone-500 dark:text-stone-400 flex gap-2 items-center">
                          <Avatar
                            :value="
                              update.request.user_id === me.data.user_id
                                ? update.request.from_user.avatar
                                : update.request.user.avatar
                            "
                            size="xs"
                            aria-hidden="true"
                          />
                          <span>
                            New friend request
                            <template v-if="update.request.user_id === me.data.user_id">
                              received from {{ update.request.from_user.display_name }}
                            </template>
                            <template v-else>
                              sent to {{ update.request.user.display_name }}
                            </template>
                          </span>
                        </div>
                      </div>
                      <UserCard
                        :username="
                          update.request.user_id === me.data.user_id
                            ? update.request.from_user.username
                            : update.request.user.username
                        "
                        class="w-full"
                      >
                        <div class="p-2">
                          <FriendButton
                            :username="
                              update.request.user_id === me.data.user_id
                                ? update.request.from_user.username
                                : update.request.user.username
                            "
                            :user_id="
                              update.request.user_id === me.data.user_id
                                ? update.request.from_user.user_id
                                : update.request.user.user_id
                            "
                          />
                        </div>
                      </UserCard>
                    </template>
                    <template v-else-if="update.kind === 'tagged_game'">
                      <div>
                        <div
                          class="text-sm text-stone-500 dark:text-stone-400 flex gap-2 items-center"
                        >
                          <Avatar
                            :value="update.game.parent_game?.user?.avatar"
                            size="xs"
                            aria-hidden="true"
                          />
                          <span
                            >You were tagged in a game by
                            {{ update.game.parent_game?.user?.display_name }}</span
                          >
                        </div>
                      </div>
                      <div>
                        <GameOverviewGrid
                          :games="getGame(update.game.id)"
                          showSingleGame
                        />
                      </div>
                    </template>
                    <template v-else-if="update.kind === 'forum_post' && featureFlags.isEnabled('forum')">
                      <div class="flex gap-2 items-center">
                        <Avatar
                          :value="update.forumPost.author.avatar"
                          size="xs"
                          aria-hidden="true"
                        />
                        <div class="flex flex-col">
                          <span class="text-sm text-stone-500 dark:text-stone-400">
                            New post in
                            <nuxt-link
                              :to="`/forum/${update.forumPost.thread.category.slug}/${update.forumPost.thread.id}#post-${update.forumPost.id}`"
                              class="font-semibold hover:underline"
                            >
                              {{ update.forumPost.thread.title }}
                            </nuxt-link>
                          </span>
                        </div>
                      </div>
                      <ForumPost
                        :post="update.forumPost"
                        :threadId="update.forumPost.thread.id"
                        :threadIsLocked="update.forumPost.thread.is_locked"
                        :currentUserId="me.data.user_id"
                        :canEditPost="me.data.is_admin || update.forumPost.author.user_id === me.data.user_id"
                        :canDeletePost="me.data.is_admin || update.forumPost.author.user_id === me.data.user_id"
                        @quote="dashboardQuotePost(update.forumPost)"
                        @deleted="forumPostDeleted"
                      />
                    </template>
                  </div>
                </li>
              </ul>
              <div v-if="nextCursor" ref="sentinelRef" class="flex justify-center py-8">
                <Loading v-if="loadingMore" />
              </div>
            </ClientOnly>

          </div>
        </div>
      </div>
      <div
        class="flex flex-col gap-4 md:gap-8 bg-stone-200/30 dark:bg-stone-950 p-4 pb-20 md:pb-4"
        :class="{
          block: selectedTab === 'events',
          'hidden md:flex': selectedTab === 'updates',
        }"
      >
        <div class="flex-1">
          <div class="text-center">
            <Button
              component="nuxt-link"
              to="/event/create"
              size="sm"
            >
              Create Event
            </Button>
          </div>
          <Calendar
            size="xs"
            :events="events ?? []"
            @selectDay="selectDay"
            :selectedDay="selectedDay"
            clickableDays
          />
        </div>
        <div class="calendar-events custom-scrollbar flex flex-col gap-4 pl-2 pr-1">
          <template
            v-for="event in eventsOnDay"
          >
            <EventCard
              display="small"
              :event="event"
              class="mx-auto flex-none"
              :canModifyEvent="canModifyEvent(event)"
              @deleted="removeEvent"
            />
          </template>
        </div>
      </div>
      <div
        class="app-nav md:hidden fixed bottom-0 left-0 flex p-2 bg-stone-50 border-t border-stone-400 dark:border-stone-700 dark:bg-stone-950 w-full"
        :class="{ 'pb-6': isCapacitor }"
      >
        <button
          class="flex-1 flex flex-col items-center text-xs"
          @click="selectedTab = 'updates'; selectionChanged()"
        >
          <ImageUI image="towncrier" class="w-9 m-auto" />
          Updates
        </button>
        <button
          class="flex-1 flex flex-col items-center text-xs"
          @click="selectedTab = 'events'; selectionChanged()"
        >
          <ImageUI image="clockmaker" class="w-9 m-auto" />
          Events
        </button>
        <nuxt-link
          class="flex-1 flex flex-col items-center text-xs"
          to="/add-game"
        >
          <ImageUI image="mezepheles" class="w-9 m-auto" />
          Add Game
        </nuxt-link>
      </div>
    </div>
  </template>
  <template v-else-if="me.status === Status.ERROR"> </template>
  <div v-else class="flex h-screen justify-center items-center">
    <Loading />
  </div>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import type { Event } from "~/composables/useCommunities";
import type { GameRecord } from "~/composables/useGames";
import { Status } from "~/composables/useFetchStatus.js";

definePageMeta({
  middleware: "auth",
});

const me = useMe();
const games = useGames();
const featureFlags = useFeatureFlags();
const isCapacitor = useRuntimeConfig().public.isCapacitorBuild;
const { selectionChanged } = useHaptics();
const { data: initialPage } = await useFetch("/api/dashboard/recent");
const roleOfTheDay = await useFetch("/api/role_of_the_day");
const scriptsOfTheWeek = await useFetch("/api/scripts_of_the_week");

// Pagination state
const allUpdates = ref(initialPage.value?.updates ?? []);
const nextCursor = ref(initialPage.value?.nextCursor ?? null);
const loadingMore = ref(false);
const sentinelRef = ref<HTMLElement | null>(null);

watch(initialPage, (val) => {
  if (val) {
    allUpdates.value = val.updates;
    nextCursor.value = val.nextCursor;
  }
});

async function loadMore() {
  if (loadingMore.value || !nextCursor.value) return;
  loadingMore.value = true;
  try {
    const data = await $fetch("/api/dashboard/recent", {
      query: { cursor: nextCursor.value },
    });
    allUpdates.value = [...allUpdates.value, ...data.updates];
    nextCursor.value = data.nextCursor;
  } finally {
    loadingMore.value = false;
  }
}

const scrollContainerRef = ref<HTMLElement | null>(null);

onMounted(() => {
  let observer: IntersectionObserver | null = null;

  watch([sentinelRef, scrollContainerRef], ([sentinel, root]) => {
    if (observer) observer.disconnect();
    if (!sentinel) return;
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { root: root || null, rootMargin: "200px" }
    );
    observer.observe(sentinel);
  }, { immediate: true });

  onUnmounted(() => observer?.disconnect());
});

const { data: events } = await useFetch<Event[]>("/api/events");
const selectedDay = ref<dayjs.Dayjs | null>(dayjs());
const selectedTab = ref<"updates" | "events">("updates");

// Pre-compute tagged game arrays so GameOverviewGrid instances get stable
// references and don't re-render when unrelated store data changes.
const taggedGameArrays = computed(() => {
  const result: Record<string, GameRecord[]> = {};
  for (const update of allUpdates.value) {
    if (update.kind === "tagged_game") {
      const game = games.getGame(update.game.id);
      if (game.status === Status.SUCCESS) {
        result[update.game.id] = [game.data];
      }
    }
  }
  return result;
});

const getGame = (id: string): GameRecord[] => {
  return taggedGameArrays.value[id] ?? [];
};

const userGames = computed(() => {
  if (me.value.status !== Status.SUCCESS) return { status: Status.IDLE as const };
  return games.getByPlayer(me.value.data.username);
});

// Calendar-related functions

function selectDay(val: dayjs.Dayjs) {
  selectedDay.value = val;
}

function canModifyEvent(event: Event) {
  if (me.value.status !== Status.SUCCESS) return false;

  return me.value.data.community_admin?.some(
    (c) => c.id === event.community?.id
  );
}

function postDeleted(id: string) {
  allUpdates.value = (
    JSON.parse(
      JSON.stringify(allUpdates.value)
    ) as typeof allUpdates.value
  ).reduce((acc, update) => {
    switch (update.kind) {
      case "new_event":
        acc.push(update);
        break;
      case "new_post":
        if (update.post.id !== id) {
          const replyIndex = update.post.replies.findIndex(
            (r) => r.id === id
          );

          if (replyIndex === -1) {
            acc.push(update);
          } else {
            update.post.replies.splice(replyIndex, 1);
            update.post._count.replies--;
            acc.push(update);
          }
          break;
        }
      default:
        acc.push(update);
        break;
    }

    return acc;
  }, [] as typeof allUpdates.value);
}

function dashboardQuotePost(forumPost: { thread: { id: string; category: { slug: string } }; id: string }) {
  navigateTo(`/forum/${forumPost.thread.category.slug}/${forumPost.thread.id}?quote=${forumPost.id}`);
}

function forumPostDeleted(id: string) {
  allUpdates.value = allUpdates.value.filter(
    (update) => !(update.kind === "forum_post" && update.forumPost.id === id)
  );
}

function removeEvent(id: string) {
  events.value = events.value?.filter((e) => e.id !== id) ?? null;
}

const eventsOnDay = computed(() => {
  if (selectedDay.value === null) return [];

  return events.value?.filter((e) => {
    const start = dayjs(e.start);
    const end = dayjs(e.end);

    return (
      selectedDay.value!.isSame(start, "day") ||
      selectedDay.value!.isSame(end, "day")
    );
  });
});

function getScriptLink(script: {
  script_id: string;
  script: string;
  version: string;
  author: string;
  games: number;
}) {
  if (script.script === "Sects & Violets") return "/scripts/Sects_and_Violets";

  if (script.script_id) {
    return `/scripts/${script.script.replaceAll(" ", "_")}?version=${
      script.version
    }`;
  }
}

onMounted(async () => {
  if (me.value.status === Status.SUCCESS) {
    games.fetchPlayerGames(me.value.data.username);
  }
});
</script>

<style scoped>
.dashboard {
  position: relative;
  display: flex;
  flex-direction: column-reverse;

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: 1fr 300px;
    height: calc(100vh - 50px - var(--cap-status-bar-height, 0px));
    overflow-y: hidden;
  }

  & .content {
    @media (min-width: 768px) {
      height: calc(100vh - 50px - var(--cap-status-bar-height, 0px));
      overflow-y: scroll;
    }
  }
}

.calendar-events {
  @media (min-width: 768px) {
    height: calc(100vh - 350px - 3rem);
    overflow-y: scroll;
  }
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: oklch(0.869 0.005 56.366) transparent; /* Stone 300 */
  scrollbar-gutter: stable;
}

.custom-scrollbar:where(.dark, .dark *) {
  scrollbar-color: oklch(0.444 0.011 73.639) transparent; /* Stone 600 */
}

.app-nav {
  z-index: 99;
}
</style>
