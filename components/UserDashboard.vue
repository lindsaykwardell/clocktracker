<template>
  <template v-if="me.status === Status.SUCCESS">
    <div class="dashboard">
      <div class="content custom-scrollbar hidden lg:flex flex-col gap-4 p-4 bg-stone-200/30 dark:bg-stone-950">
        <YearInReviewLink id="year-in-review-menu" />
        <h1 class="text-xl font-sorts text-center">My Profile</h1>
        <ul class="px-4">
          <li>
            <nuxt-link
              :to="`/@${me.data.username}?view=games`"
              class="hover:underline"
              >My Games</nuxt-link
            >
          </li>
          <li>
            <nuxt-link
              :to="`/@${me.data.username}?view=pending`"
              class="hover:underline"
              >Tagged Games</nuxt-link
            >
          </li>
          <li>
            <nuxt-link
              :to="`/@${me.data.username}?view=stats`"
              class="hover:underline"
              >Stats</nuxt-link
            >
          </li>
        </ul>
        <hr class="border-stone-300 dark:border-stone-700/50" />
        <h1 class="text-xl font-sorts text-center">Role of the Day</h1>
        <nuxt-link
          class="flex flex-col items-center"
          :to="`/roles/${roleOfTheDay.data.value?.id}`"
        >
          <Token
            size="front"
            :character="{ 
              name: roleOfTheDay.data.value?.name,
              alignment: roleOfTheDay.data.value?.initial_alignment,
              role: roleOfTheDay.data.value!, 
            }"
          />
        </nuxt-link>
        <hr class="border-stone-300 dark:border-stone-700/50" />
        <template v-if="scriptsOfTheWeek.data.value">
          <h1 class="text-xl font-sorts text-center">Popular Scripts</h1>
          <ul class="px-4">
            <li v-for="script in scriptsOfTheWeek.data.value">
              <nuxt-link :to="getScriptLink(script)" class="hover:underline">
                {{ script.script }}
              </nuxt-link>
            </li>
          </ul>
          <hr class="border-stone-300 dark:border-stone-700/50" />
        </template>
        <template v-if="(myCommunities?.length ?? 0) > 0">
          <h1 class="font-sorts text-xl text-center">Communities</h1>
          <ul class="flex flex-col gap-1">
            <li
              v-for="community in myCommunities"
              class="flex gap-2 items-center"
            >
              <Avatar :value="community.icon" size="xs" aria-hidden="true" />
              <nuxt-link
                :to="`/community/${community.slug}`"
                class="hover:underline"
                >{{ community.name }}</nuxt-link
              >
            </li>
          </ul>
        </template>
      </div>
      <div
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

          <hr class="border-stone-300 dark:border-stone-700/50" />

          <div class="space-y-2">
            <h2 class="text-3xl font-sorts ">Activity Feed</h2>
            <ClientOnly>
              <ul class="mt-4 flex flex-col gap-3 lg:gap-6">
                <li v-for="update in updates.data.value" class="max-w-[800px] w-full mx-auto">
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
                  </div>
                </li>
              </ul>
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
              v-if="!featureFlags.isEnabled('ical')"
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
          >
            <Menu v-if="featureFlags.isEnabled('ical')">
              <MenuButton>
                <IconUI id="dots" :rounded="true" shadow />
              </MenuButton>
              <transition
                enter-active-class="transition duration-100 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-75 ease-out"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <MenuItems
                  class="ct-contextual-links right-0"
                >
                  <MenuItem>
                    <ButtonSubmenu
                      component="nuxt-link"
                      to="/event/create"
                      icon="calender-plus"
                    >
                      Create Event
                    </ButtonSubmenu>
                  </MenuItem>
                  <MenuItem v-if="copyIsSupported">
                    <ButtonSubmenu
                      @click.prevent="copyCalendarLink"
                      icon="copy"
                      v-tooltip="{
                        content: 'Copied!',
                        shown: showCopyTooltip,
                        triggers: [],
                      }"
                    >
                      Copy Calendar Link
                    </ButtonSubmenu>
                  </MenuItem>
                </MenuItems>
              </transition>
            </Menu>
          </Calendar>
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
      >
        <button
          class="flex-1 flex flex-col items-center text-xs"
          @click="selectedTab = 'updates'"
        >
          <ImageUI image="towncrier" class="w-9 m-auto" />
          Updates
        </button>
        <button
          class="flex-1 flex flex-col items-center text-xs"
          @click="selectedTab = 'events'"
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
import { Status } from "~/composables/useFetchStatus.js";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import { useClipboard } from "@vueuse/core";

definePageMeta({
  middleware: "auth",
});

const me = useMe();
const games = useGames();
const featureFlags = useFeatureFlags();
const updates = await useFetch("/api/dashboard/recent");
const roleOfTheDay = await useFetch("/api/role_of_the_day");
const scriptsOfTheWeek = await useFetch("/api/scripts_of_the_week");

const { data: events } = await useFetch<Event[]>("/api/events");
const selectedDay = ref<dayjs.Dayjs | null>(dayjs());
const selectedTab = ref<"updates" | "events">("updates");

const myCommunities = computed(() => {
  if (me.value.status === Status.SUCCESS) {
    return me.value.data.communities;
  } else {
    return [];
  }
});

const getGame = computed(() => {
  return (id: string) => {
    const game = games.getGame(id);

    if (game.status === Status.SUCCESS) {
      return [game.data];
    }

    return [];
  };
});

const userGames = computed(() => {
  if (me.value.status !== Status.SUCCESS) return { status: Status.IDLE };
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
  if (updates.data.value) {
    updates.data.value = (
      JSON.parse(
        JSON.stringify(updates.data.value)
      ) as typeof updates.data.value
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
      }

      return acc;
    }, [] as typeof updates.data.value);
  }
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

const icalUrl = ref<string | null>(null);

const copySource = computed(() => icalUrl.value ?? "");

const {
  copy,
  copied,
  isSupported: copyIsSupported,
} = useClipboard({ source: copySource, legacy: true });
const showCopyTooltip = ref(false);

async function copyCalendarLink() {
  try {
    const url = await $fetch("/api/ical");
    icalUrl.value = url;

    if (copyIsSupported.value) {
      await copy();
      if (copied.value) {
        showCopyTooltip.value = true;
        setTimeout(() => {
          showCopyTooltip.value = false;
        }, 2000);
      }
    }
  } catch (e) {
    // Do nothing
  }
}

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
    height: calc(100vh - 50px);
    overflow-y: hidden;
  }

  @media (min-width: 1024px) {
    grid-template-columns: 300px 1fr 300px;
  }

  & .content {
    @media (min-width: 768px) {
      height: calc(100vh - 50px);
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
