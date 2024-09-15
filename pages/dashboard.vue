<template>
  <StandardTemplate>
    <template v-if="me.status === Status.SUCCESS">
      <div class="dashboard">
        <div class="flex flex-col gap-4 p-4 bg-stone-950">
          <h1 class="text-xl font-dumbledor text-center">My Profile</h1>
          <ul class="px-4">
            <li>
              <nuxt-link
                :to="`/@${me.data.username}?view=games`"
                class="hover:underline"
                >Games</nuxt-link
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
          <h1 class="text-xl font-dumbledor text-center">Recent Scripts</h1>
          <ul class="px-4">
            <li v-for="script in games.getRecentScripts">
              <nuxt-link :to="script.url" class="hover:underline">
                {{ script.name }}
              </nuxt-link>
            </li>
          </ul>
          <hr class="border-stone-600" />
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
        </div>
        <div></div>
        <div class="flex flex-col gap-4 bg-stone-950 p-4">
          <Calendar
            size="xs"
            :events="events"
            @selectDay="selectDay"
            :selectedDay="selectedDay"
            clickableDays
          />
          <div class="flex flex-col gap-4 calendar-events">
            <nuxt-link
              v-for="event in eventsOnDay"
              :to="`/community/${event.community.slug}/event/${event.id}`"
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
      </div>
    </template>
    <template v-else-if="me.status === Status.ERROR"> </template>
    <div v-else class="flex h-screen justify-center items-center">
      <Loading />
    </div>
  </StandardTemplate>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import type { Event } from "~/composables/useCommunities";

const me = useMe();
const games = useGames();

const events = ref(await $fetch<Event[]>("/api/events"));
const selectedDay = ref<dayjs.Dayjs | null>(dayjs());

const myCommunities = computed(() => {
  if (me.value.status === Status.SUCCESS) {
    return me.value.data.communities;
  } else {
    return [];
  }
});

/**
 * We need to find all the recent stuff that has happened.
 * This is a computed property that will return the events
 *
 * Things we need to fetch:
 * - Newly scheduled events
 * - New community posts
 * - New friend requests?
 * - Recently tagged games?
 */

// Calendar-related functions

function selectDay(val: dayjs.Dayjs) {
  selectedDay.value = val;
}

function canModifyEvent(event: Event) {
  if (me.value.status !== Status.SUCCESS) return false;

  return me.value.data.community_admin?.some(
    (c) => c.id === event.community.id
  );
}

function removeEvent(id: string) {
  events.value = events.value.filter((e) => e.id !== id);
}

const eventsOnDay = computed(() => {
  if (selectedDay.value === null) return [];

  return events.value.filter((e) => {
    const start = dayjs(e.start);
    const end = dayjs(e.end);

    return (
      selectedDay.value!.isSame(start, "day") ||
      selectedDay.value!.isSame(end, "day")
    );
  });
});

watch(
  me,
  () => {
    if (me.value.status === Status.SUCCESS) {
      games.fetchPlayerGames(me.value.data.username);
    }
  },
  {
    immediate: true,
  }
);
</script>

<style scoped>
.dashboard {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
}

.calendar-events {
  height: calc(100vh - 350px);
  overflow-y: scroll;
}
</style>
