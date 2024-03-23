<template>
  <section class="max-w-[600px] bg-stone-900 rounded shadow">
    <img
      v-if="event.image"
      :src="event.image"
      class="w-full md:w-[600px] object-cover h-[150px] md:h-[250px]"
    />
    <div class="p-3 flex flex-col gap-2">
      <div class="flex flex-col md:flex-row text-stone-400">
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
      <VueMarkdown
        class="post text-sm md:text-base"
        :source="event.description"
      />
      <div class="flex flex-col md:flex-row gap-2 items-top justify-between">
        <div
          class="flex-1 flex gap-3 items-center"
          v-if="event.storytellers.length"
        >
          <span class="text-sm text-stone-500"
            >Storyteller{{ event.storytellers.length === 1 ? "" : "s" }}</span
          >
          <div>
            <template v-for="(storyteller, index) in event.storytellers">
              <span>{{ storyteller }}</span>
              <template v-if="index !== event.storytellers.length - 1"
                >,
              </template>
            </template>
          </div>
        </div>
        <div class="flex-1 flex gap-3 items-center" v-if="event.script">
          <span class="text-sm text-stone-500">Script</span>
          <a class="hover:underline" :href="scriptLink(event)" target="">
            {{ event.script }}
            <!-- <template
              v-if="
                game.data.associated_script && !isBaseScript(game.data.script)
              "
            >
              v{{ game.data.associated_script.version }}
            </template> -->
          </a>
        </div>
      </div>
      <div class="flex flex-col md:flex-row justify-between gap-2 items-center">
        <div>
          <span class="text-stone-400">
            <template v-if="event.player_count">
              {{ registeredPlayerCount }}/{{ event.player_count }}
            </template>
            <template v-else>
              {{ registeredPlayerCount }}
            </template>
            players registered
          </span>
          <template v-if="waitlistCount > 0">
            <span class="text-stone-400">({{ waitlistCount }} waiting)</span>
          </template>
        </div>
        <slot name="register" :event="event" />
      </div>

      <slot name="footer" :event="event" />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Event } from "~/composables/useCommunities";
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
  const waitlistedPlayers = props.event.waitlists.flatMap(
    (w) => w.users
  ).length;

  if (max && count >= max) {
    return count - max + waitlistedPlayers;
  } else {
    return 0 + waitlistedPlayers;
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

function scriptLink(event: { script: string; script_id: number | null }) {
  if (event.script === "Sects & Violets") return "/scripts/Sects_and_Violets";

  if (event.script_id) return `/scripts/${event.script.replaceAll(" ", "_")}`;

  return `https://botcscripts.com/?search=${event.script.replace(
    / /g,
    "+"
  )}&script_type=&include=&exclude=&edition=&author=`;
}
</script>
