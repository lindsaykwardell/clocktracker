<template>
  <CommunityTemplate v-slot="{ community, isModerator }">
    <div class="flex justify-around py-4">
      <button class="text-2xl" @click="backOneMonth">＜</button>
      <h2 class="font-dumbledor text-xl lg:text-2xl">
        {{ formattedYearAndMonth }}
      </h2>
      <button class="text-2xl" @click="forwardOneMonth">＞</button>
    </div>
    <div class="grid grid-cols-7">
      <template v-for="week in weeks">
        <div v-for="day in week">
          <div v-if="day" class="h-[150px] p-1 hover:bg-stone-700">
            <span class="text-stone-500">{{ day?.date() }}</span>
            <ul>
              <li v-for="event in eventsOnDay(day)">
                <a
                  :href="`/community/${community.data.slug}/event/${event.id}`"
                  class="flex gap-3"
                >
                  <div class="flex-grow hover:underline">
                    <span class="text-stone-500">
                      {{ formatStartTime(event.start) }}
                    </span>
                    {{ event.title }}
                  </div>
                  <span v-if="event.player_count">
                    {{
                      event.player_count > event.registered_players.length
                        ? event.registered_players.length
                        : event.player_count
                    }}/{{ event.player_count }}
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </template>
    </div>
    <div v-if="isModerator" class="flex justify-end p-4">
      <nuxt-link
        :to="`/community/${community.data.slug}/events/create`"
        class="bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-4"
      >
        Create Event
      </nuxt-link>
    </div>
  </CommunityTemplate>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { Event } from "~/composables/useCommunities";

const route = useRoute();
const slug = route.params.slug as string;

const year = ref(dayjs().year());
const month = ref(dayjs().month() + 1);

const formattedYearAndMonth = computed(() => {
  return dayjs()
    .year(year.value)
    .month(month.value - 1)
    .format("MMMM YYYY");
});

function formatStartTime(start: string) {
  return dayjs(start).format("h:mm A");
}

const weeks = computed(() => {
  const start = dayjs()
    .year(year.value)
    .month(month.value - 1)
    .startOf("month")
    .startOf("week");
  const end = dayjs()
    .year(year.value)
    .month(month.value - 1)
    .endOf("month");

  const weeks = [];

  for (let i = 0; i <= end.diff(start, "week"); i++) {
    const week = [];
    for (let j = 0; j < 7; j++) {
      const day = start.add(i, "week").add(j, "day");
      if (day.month() === month.value - 1) {
        week.push(day);
      } else {
        week.push(null);
      }
    }
    weeks.push(week);
  }

  return weeks;
});

const events = ref<Event[]>([]);

function eventsOnDay(day: dayjs.Dayjs) {
  return events.value.filter((e) => {
    const start = dayjs(e.start);
    const end = dayjs(e.end);

    return day.isSame(start, "day") || day.isSame(end, "day");
  });
}

function backOneMonth() {
  if (month.value === 1) {
    year.value--;
    month.value = 12;
  } else {
    month.value--;
  }
}

function forwardOneMonth() {
  if (month.value === 12) {
    year.value++;
    month.value = 1;
  } else {
    month.value++;
  }
}

watchEffect(async () => {
  events.value = await $fetch<Event[]>(
    `/api/community/${slug}/events/calendar/${year.value}/${month.value}`
  );
});
</script>
