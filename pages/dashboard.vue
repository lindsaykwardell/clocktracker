<template>
  <StandardTemplate>
    <div v-if="me.status === Status.SUCCESS" class="grid grid-cols-12">
      <div class="col-span-12 md:col-span-4">
        <Calendar
          size="sm"
          :events="events"
          @selectDay="selectDay"
          clickableDays
        />
        <div class="w-full flex flex-col gap-4">
          <nuxt-link
            v-for="event in eventsOnDay"
            :to="`/community/${event.community.slug}/event/${event.id}`"
            class="w-full"
          >
            <EventCard :event="event" />
          </nuxt-link>
        </div>
      </div>
    </div>
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
const selectedDay = ref<dayjs.Dayjs | null>(null);

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
