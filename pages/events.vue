<template>
  <StandardTemplate>
    <template v-if="me.status === Status.SUCCESS">
      <div class="flex flex-col lg:flex-row gap-4 relative">
        <div class="w-full lg:w-1/2 sticky top-0">
          <Calendar
            size="sm"
            :events="events"
            @selectDay="selectDay"
            :selectedDay="selectedDay"
            clickableDays
          />
        </div>
        <div class="w-full lg:w-1/2 flex flex-col gap-4">
          <template
            v-for="event in eventsOnDay"
            class="w-full"
          >
            <EventCard
              :event="event"
              class="m-auto"
              :canModifyEvent="canModifyEvent(event)"
              @deleted="removeEvent"
            />
          </template>
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
import { Status } from "~/composables/useFetchStatus";

const users = useUsers();
const user = useSupabaseUser();

const me = computed(() => {
  return users.getUserById(user.value?.id);
});

const events = ref(await $fetch<Event[]>("/api/events"));
const selectedDay = ref<dayjs.Dayjs | null>(dayjs());

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
</script>
