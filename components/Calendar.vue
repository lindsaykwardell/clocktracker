<template>
  <div>
    <div class="flex items-center gap-2">
      <div
        class="flex flex-grow justify-center md:justify-between max-w-[1000px] mx-auto gap-6 py-4"
        :class="{
          'text-xl lg:text-2xl': size === 'lg',
          'text-lg lg:text-xl': size === 'md',
          'lg:text-lg': size === 'sm',
          'text-sm': size === 'xs',
        }"
      >
        <Button 
          @click="backOneMonth"
          title="Previous month"
          icon="chevron-left"
          color="contrast"
          display="icon-only"
          size="sm"
          circular
        >
          Previous
        </Button>
        <h2 class="font-sorts">
          {{ formattedYearAndMonth }}
        </h2>
        <Button 
          @click="forwardOneMonth"
          title="Next month"
          icon="chevron-right"
          color="contrast"
          display="icon-only"
          size="sm"
          circular
        >
          Next
        </Button>
      </div>
      <div class="flex-shrink">
        <slot />
      </div>
    </div>
    <div class="grid grid-cols-7 text-xs md:text-base">
      <template v-for="week in weeks">
        <div v-for="day in week">
          <div
            v-if="day"
            @click="emit('selectDay', day)"
            class="p-1 hover:bg-stone-300 dark:hover:bg-stone-700 overflow-hidden"
            :class="{
              'min-h-[100px] md:min-h-[150px]': size !== 'sm' && size !== 'xs',
              'h-[40px] md:h-[75px]': size === 'sm',
              'h-[40px]': size === 'xs',
              'cursor-pointer': clickableDays,
              'border border-yellow-500': day.isSame(today, 'day'),
              'bg-stone-200 dark:bg-stone-700':
                selectedDay && day.isSame(selectedDay, 'day'),
            }"
          >
            <div
              class="text-stone-500"
              :class="{
                'text-center': size === 'sm' || size === 'xs',
                'text-xs': size === 'xs',
              }"
            >
              {{ day?.date() }}
            </div>
            <ul v-if="size !== 'sm' && size !== 'xs'">
              <li v-for="event in eventsOnDay(day)">
                <nuxt-link
                  :to="`/event/${event.id}`"
                  class="flex flex-col md:flex-row gap-3 rounded bg-purple-200 p-1"
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
                </nuxt-link>
              </li>
            </ul>
            <div
              v-else
              class="flex flex-wrap justify-center text-xl leading-none"
              :class="{
                'md:text-4xl': size === 'sm',
              }"
            >
              <div v-for="_ in eventsOnDay(day).length">·</div>
            </div>
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
  size: "xs" | "sm" | "md" | "lg";
  clickableDays?: boolean;
  selectedDay?: dayjs.Dayjs | null;
}>();

const emit = defineEmits(["viewChanged", "selectDay"]);

const year = ref(dayjs().year());
const month = ref(dayjs().month() + 1);
const today = dayjs();

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
