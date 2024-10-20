<template>
  <section
    class="bg-stone-200 dark:bg-stone-900 rounded shadow"
    :class="{
      'text-sm': size === 'sm',
      'max-w-full': width === 'full',
      'max-w-[600px]': width !== 'full',
    }"
  >
    <img
      v-if="event.image"
      :src="event.image"
      class="w-full md:w-[600px] object-cover h-[150px] md:h-[250px] m-auto"
    />
    <div class="p-3 flex flex-col gap-2">
      <div
        class="flex text-stone-500 dark:text-stone-400 items-center"
        :class="{
          'flex-row': size !== 'sm',
          'flex-col': size === 'sm',
        }"
      >
        <div class="flex-grow">
          <ClientOnly>
            <time
              >{{ formatDate(event.start) }} {{ formatTime(event.start) }}</time
            >
            - <time>{{ formatTime(event.end) }}</time>
          </ClientOnly>
        </div>
        <div class="hidden md:block">
          <template v-if="event.location_type === 'ONLINE'"> Online </template>
          <template v-else>
            {{ event.location }}
          </template>
        </div>
        <div
          v-if="size !== 'sm' && canModifyEvent"
          class="pl-4 relative"
          id="menu-controls"
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
                    :to="`/event/${event.id}/edit`"
                    class="flex gap-1 w-full items-center text-black dark:text-white text-sm px-2 min-h-[32px]"
                  >
                    Edit Event
                  </nuxt-link>
                </MenuItem>
                <MenuItem>
                  <nuxt-link
                    :to="`/event/create?duplicate=${event.id}`"
                    class="flex gap-1 w-full items-center text-black dark:text-white text-sm px-2 min-h-[32px]"
                  >
                    Duplicate Event
                  </nuxt-link>
                </MenuItem>
                <MenuItem>
                  <button
                    @click="deleteEvent"
                    class="flex gap-1 w-full items-center text-black dark:text-white text-sm px-2 min-h-[32px]"
                  >
                    Delete Event
                  </button>
                </MenuItem>
              </MenuItems>
            </transition>
          </Menu>
        </div>
      </div>
      <div class="block md:hidden text-stone-500 dark:text-stone-400">
        <template v-if="event.location_type === 'ONLINE'"> Online </template>
        <template v-else>
          {{ event.location }}
        </template>
      </div>
      <div
        v-if="event.created_by"
        class="flex text-stone-500 dark:text-stone-400 items-center gap-2"
      >
        <Avatar :value="event.created_by.avatar" size="xs" />
        <span class="text-sm">Created by {{ event.created_by.display_name }}</span>
      </div>
      <h2
        class="font-dumbledor"
        :class="{
          'text-lg lg:text-xl': size !== 'sm',
          'text-base': size === 'sm',
        }"
      >
        {{ event.title }}
      </h2>
      <VueMarkdown
        class="post"
        :class="{
          'text-sm md:text-base': size !== 'sm',
          'text-sm': size === 'sm',
        }"
        :source="event.description"
      />
      <div v-if="event.game_link" class="flex gap-3">
        <span class="text-sm text-stone-500 dark:text-stone-400"
          >Game Link</span
        >
        <a
          v-if="event.game_link"
          :href="event.game_link"
          target="_blank"
          class="text-blue-600 text-sm hover:underline"
          >{{ event.game_link }}</a
        >
      </div>
      <div class="flex flex-col md:flex-row gap-2 items-top justify-between">
        <div
          class="flex-1 flex gap-3 items-center"
          v-if="
            event.storytellers.length > 0 && event.storytellers[0].length > 0
          "
        >
          <span class="text-sm text-stone-500 dark:text-stone-400"
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
          <span class="text-sm text-stone-500 dark:text-stone-400">Script</span>
          <a class="hover:underline" :href="scriptLink(event)" target="">
            {{ event.script }}
          </a>
        </div>
      </div>
      <div class="flex flex-col md:flex-row justify-between gap-2 items-center">
        <div>
          <span class="text-stone-500 dark:text-stone-400">
            <template v-if="event.player_count">
              {{ registeredPlayerCount }}/{{ event.player_count }}
            </template>
            <template v-else>
              {{ registeredPlayerCount }}
            </template>
            players registered
          </span>
          <template v-if="waitlistCount > 0">
            <span class="text-stone-500 dark:text-stone-400"
              >({{ waitlistCount }} waiting)</span
            >
          </template>
        </div>
        <div class="flex gap-2 justify-end">
          <slot name="register" :event="event" />
        </div>
      </div>

      <slot name="footer" :event="event" />
    </div>
    <Tour :steps="tour" v-if="canModifyEvent" tourKey="event-card-controls" />
  </section>
</template>

<script setup lang="ts">
import type { Event } from "~/composables/useCommunities";
import VueMarkdown from "vue-markdown-render";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";

const props = defineProps<{
  event: Event;
  canModifyEvent?: boolean;
  size?: "sm" | "md";
  width?: "full" | "auto";
}>();

const emit = defineEmits(["deleted"]);

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

function deleteEvent() {
  if (confirm("Are you sure you want to delete this event?")) {
    $fetch(
      `/api/event/${props.event.id}`,
      {
        method: "DELETE",
      }
    ).then(() => {
      emit("deleted", props.event.id);
    });
  }
}

const tour = [
  {
    target: "#menu-controls",
    content: "From here, you can edit, duplicate, or delete the event.",
  },
];
</script>
