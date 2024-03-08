<template>
  <div>
    <div
      class="flex justify-around py-4"
      :class="{
        'text-xl lg:text-2xl': size === 'lg',
        'text-lg lg:text-xl': size === 'md',
        'lg:text-lg': size === 'sm',
      }"
    >
      <button @click="backOneMonth">＜</button>
      <h2 class="font-dumbledor">
        {{ formattedYearAndMonth }}
      </h2>
      <button @click="forwardOneMonth">＞</button>
    </div>
    <div class="grid grid-cols-7 text-xs md:text-base">
      <template v-for="week in weeks">
        <div v-for="day in week">
          <div
            v-if="day"
            class="min-h-[100px] md:min-h-[150px] p-1 hover:bg-stone-700"
          >
            <span class="text-stone-500">{{ day?.date() }}</span>
            <ul v-if="size !== 'sm'">
              <li v-for="event in eventsOnDay(day)">
                <a
                  :href="`/community/${event.community.slug}/event/${event.id}`"
                  class="flex flex-col md:flex-row gap-3"
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
  </div>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import type { Event } from "~/composables/useCommunities";

const props = defineProps<{
  events: Event[];
  size: "sm" | "md" | "lg";
}>();

const emit = defineEmits(["viewChanged"]);

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

function eventsOnDay(day: dayjs.Dayjs) {
  return props.events.filter((e) => {
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

  emit("viewChanged", { year: year.value, month: month.value });
}

function forwardOneMonth() {
  if (month.value === 12) {
    year.value++;
    month.value = 1;
  } else {
    month.value++;
  }

  emit("viewChanged", { year: year.value, month: month.value });
}

onMounted(() => {
  emit("viewChanged", { year: year.value, month: month.value });
});
</script>
