<template>
  <template v-if="me.status === Status.SUCCESS">
    <div class="dashboard">
      <div class="content hidden lg:flex flex-col gap-4 p-4 dark:bg-stone-950">
        <h1 class="text-xl font-dumbledor text-center">My Profile</h1>
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
        <hr class="border-stone-600" />
        <h1 class="text-xl font-dumbledor text-center">Role of the Day</h1>
        <nuxt-link
          class="flex flex-col items-center"
          :to="`/roles/${roleOfTheDay.data.value?.id}`"
        >
          <Token
            size="lg"
            :character="{ name: roleOfTheDay.data.value?.name,
          alignment: roleOfTheDay.data.value?.type === 'TRAVELER' ? 'NEUTRAL' :
          roleOfTheDay.data.value?.initial_alignment, role:
          roleOfTheDay.data.value!, }"
          />
          <h2 class="text-center font-bold">
            {{ roleOfTheDay.data.value?.name }}
          </h2>
        </nuxt-link>
        <hr class="border-stone-600" />
        <template v-if="games.getRecentScripts.length > 0">
          <h1 class="text-xl font-dumbledor text-center">Recent Scripts</h1>
          <ul class="px-4">
            <li v-for="script in games.getRecentScripts">
              <nuxt-link :to="script.url" class="hover:underline">
                {{ script.name }}
              </nuxt-link>
            </li>
          </ul>
          <hr class="border-stone-600" />
        </template>
        <template v-if="(myCommunities?.length ?? 0) > 0">
          <h1 class="font-dumbledor text-xl text-center">Communities</h1>
          <ul>
            <li
              v-for="community in myCommunities"
              class="flex gap-2 items-center"
            >
              <Avatar :value="community.icon" size="xs" />
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
        class="content md:overflow-y-scroll pb-20 md:pb-0"
        :class="{
          block: selectedTab === 'updates',
          'hidden md:block': selectedTab === 'events',
        }"
      >
        <ClientOnly>
          <ul class="px-4">
            <li v-for="update in updates.data.value" class="py-3">
              <div class="flex flex-col gap-2">
                <template v-if="update.kind === 'new_event'">
                  <div class="flex gap-2 items-center">
                    <Avatar :value="update.event.community?.icon" size="xs" />
                    <div class="flex flex-col">
                      <span class="text-sm text-stone-500 dark:text-stone-400">
                        <template v-if="update.event.community">
                          New Event in
                          <nuxt-link
                            :to="`/community/${update.event.community?.slug}`"
                            class="hover:underline"
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
                  <nuxt-link :to="`/event/${update.event.id}`">
                    <EventCard
                      v-if="update.kind === 'new_event'"
                      :event="update.event"
                      width="full"
                    />
                  </nuxt-link>
                </template>
                <template v-else-if="update.kind === 'new_post'">
                  <div class="flex gap-2 items-center">
                    <Avatar :value="update.post.community?.icon" size="xs" />
                    <div class="flex flex-col">
                      <span class="text-sm text-stone-500 dark:text-stone-400">
                        New Post in
                        <nuxt-link
                          :to="`/community/${update.post.community?.slug}`"
                          class="hover:underline"
                          >{{ update.post.community?.name }}</nuxt-link
                        >
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
                    <div
                      class="text-sm text-stone-500 dark:text-stone-400 flex gap-2 items-center"
                    >
                      <Avatar
                        :value="
                          update.request.user_id === me.data.user_id
                            ? update.request.from_user.avatar
                            : update.request.user.avatar
                        "
                        size="xs"
                      />
                      <span
                        >New friend request
                        <template
                          v-if="update.request.user_id === me.data.user_id"
                        >
                          received from
                          {{ update.request.from_user.display_name }}</template
                        ><template v-else>
                          sent to {{ update.request.user.display_name }}
                        </template></span
                      >
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
                      cardWidth="w-full"
                    />
                  </div>
                </template>
              </div>
            </li>
          </ul>
        </ClientOnly>
      </div>
      <div
        class="flex flex-col gap-4 dark:bg-stone-950 p-4 pb-20 md:pb-0"
        :class="{
          block: selectedTab === 'events',
          'hidden md:block': selectedTab === 'updates',
        }"
      >
        <div>
          <!-- <Button
            component="nuxt-link"
            to="/event/create"
            tertiary
            fontSize="sm"
          >
            Create Event
          </Button> -->
          <Calendar
            size="xs"
            :events="events ?? []"
            @selectDay="selectDay"
            :selectedDay="selectedDay"
            clickableDays
          >
            <Menu>
              <MenuButton>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 16 16"
                  class="w-6"
                >
                  <path
                    fill="#a8a29e"
                    d="M3 9.5a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3"
                  />
                </svg>
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
                  class="absolute right-0 z-10 bg-stone-100 dark:bg-stone-800 rounded shadow-md whitespace-nowrap flex flex-col items-start min-w-[150px]"
                >
                  <MenuItem>
                    <nuxt-link
                      to="/event/create"
                      class="flex gap-1 w-full items-center text-black dark:text-white text-sm px-2 min-h-[32px]"
                    >
                      Create Event
                    </nuxt-link>
                  </MenuItem>
                  <MenuItem
                    v-if="featureFlags.isEnabled('ical') && copyIsSupported"
                  >
                    <button
                      @click.prevent="copyCalendarLink"
                      class="flex gap-1 w-full items-center text-black dark:text-white text-sm px-2 min-h-[32px]"
                      v-tooltip="{
                        content: 'Copied!',
                        shown: showCopyTooltip,
                        triggers: [],
                      }"
                    >
                      Copy Calendar Link
                    </button>
                  </MenuItem>
                </MenuItems>
              </transition>
            </Menu>
          </Calendar>
        </div>
        <div class="flex flex-col gap-4 calendar-events">
          <nuxt-link
            v-for="event in eventsOnDay"
            :to="`/event/${event.id}`"
            class="w-full"
          >
            <EventCard
              size="sm"
              :event="event"
              class="m-auto"
              :canModifyEvent="canModifyEvent(event)"
              @deleted="removeEvent"
            />
          </nuxt-link>
        </div>
      </div>
      <div
        class="md:hidden fixed bottom-0 left-0 flex p-2 bg-stone-50 border-t border-stone-400 dark:border-stone-700 dark:bg-stone-950 w-full"
      >
        <button
          class="flex-1 flex flex-col items-center text-xs"
          @click="selectedTab = 'updates'"
        >
          <img :src="`/img/role/towncrier.png`" class="w-10 m-auto" />
          Updates
        </button>
        <button
          class="flex-1 flex flex-col items-center text-xs"
          @click="selectedTab = 'events'"
        >
          <img :src="`/img/role/clockmaker.png`" class="w-10 m-auto" />
          Events
        </button>
        <nuxt-link
          class="flex-1 flex flex-col items-center text-xs"
          to="/add-game"
        >
          <img :src="`/img/role/mezepheles.png`" class="w-10 m-auto" />
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
    height: calc(100vh - 350px);
    overflow-y: scroll;
  }
}
</style>
