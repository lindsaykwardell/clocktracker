<template>
  <StandardTemplate>
    <template v-if="me.status === Status.SUCCESS">
      <h1 class="text-3xl font-bold mb-8 font-dumbledor py-4 text-center">
        My Upcoming Events
      </h1>
      <div class="flex flex-col lg:flex-row gap-4">
        <div class="w-full lg:w-1/2">
          <Calendar
            size="sm"
            :events="events"
            @selectDay="selectDay"
            :selectedDay="selectedDay"
            clickableDays
          />
        </div>
        <div class="w-full lg:w-1/2 flex flex-col gap-4">
          <nuxt-link
            v-for="event in eventsOnDay"
            :to="`/community/${event.community.slug}/event/${event.id}`"
            class="w-full"
          >
            <EventCard :event="event" class="m-auto" />
          </nuxt-link>
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

const users = useUsers();
const user = useSupabaseUser();

const me = computed(() => {
  return users.getUserById(user.value?.id);
});

const events = await $fetch<Event[]>("/api/events");
const selectedDay = ref<dayjs.Dayjs | null>(dayjs());

function selectDay(val: dayjs.Dayjs) {
  selectedDay.value = val;
}

const eventsOnDay = computed(() => {
  if (selectedDay.value === null) return [];

  return events.filter((e) => {
    const start = dayjs(e.start);
    const end = dayjs(e.end);

    return (
      selectedDay.value!.isSame(start, "day") ||
      selectedDay.value!.isSame(end, "day")
    );
  });
});
</script>
