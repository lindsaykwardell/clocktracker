<template>
  <section class="max-w-[600px] bg-stone-900 rounded shadow">
    <img
      v-if="event.image"
      :src="event.image"
      class="w-full md:w-[600px] object-cover h-[250px]"
    />
    <div class="p-3 flex flex-col gap-2">
      <div class="flex text-stone-400">
        <div class="flex-grow">
          <ClientOnly>
            <time
              >{{ formatDate(event.start) }} ﹒
              {{ formatTime(event.start) }}</time
            >
            - <time>{{ formatTime(event.end) }}</time>
          </ClientOnly>
        </div>
        <div>
          <template v-if="event.location_type === 'ONLINE'"> Online </template>
          <template v-else>
            {{ event.location }}
          </template>
        </div>
      </div>
      <h2 class="font-dumbledor text-lg lg:text-xl">{{ event.title }}</h2>
      <VueMarkdown class="post" :source="event.description" />
      <div class="flex justify-between gap-2 items-center">
        <div>
          <template v-if="event.player_count">
            <span class="text-stone-400">
              {{ registeredPlayerCount }}/{{ event.player_count }} players
              registered
            </span>
            <template v-if="waitlistCount > 0">
              <span class="text-stone-400">({{ waitlistCount }} waiting)</span>
            </template>
          </template>
          <template v-else>
            <span class="text-stone-400">
              {{ registeredPlayerCount }} players registered
            </span>
          </template>
        </div>
        <slot name="register" :event="event" />
      </div>

      <slot name="footer" :event="event" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { Event } from "~/composables/useCommunities";
import VueMarkdown from "vue-markdown-render";

const props = defineProps<{
  event: Event;
}>();

const registeredPlayerCount = computed(() => {
  const count = props.event.registered_players.length;
  const max = props.event.player_count;

  if (max && count >= max) {
    return max;
  } else {
    return count;
  }
});

const waitlistCount = computed(() => {
  const count = props.event.registered_players.length;
  const max = props.event.player_count;

  if (max && count >= max) {
    return count - max;
  } else {
    return 0;
  }
});

function formatDate(date: string) {
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "medium",
  }).format(new Date(date));
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat(navigator.language, {
    timeStyle: "short",
  }).format(new Date(date));
}
</script>
