<template>
  <section
    class="ct-card ct-card--event grid"
    :class="{
      'max-w-[600px]': display !== 'large',
      'text-sm': display === 'small',
      'lg:w-full xl:w-3/4 lg:max-w-none lg:grid-cols-[minmax(400px,_1fr)_minmax(360px,_1fr)]': display === 'detail',
    }"
  >
    <div 
      :class="{
        'lg:border-r lg:border-stone-300 dark:lg:border-stone-700/50 flex flex-col max-w-[600px]': display === 'detail',
      }"
    >
      <img
        v-if="event.image && display !== 'small'"
        :src="event.image"
        class="w-full object-cover h-[150px] md:h-[250px] m-auto"
      />

      <div class="flex-grow flex flex-col gap-4 p-4">
        <div 
          class="flex flex-col "
          :class="{
            'gap-1': display !== 'small',
            'gap-2': display === 'small',
          }"
        >
          <div
            class="flex items-start"
            :class="{
              'flex-row gap-4': display !== 'small',
              'flex-col gap-1': display === 'small',
            }"
          >
            <!-- Date & Title -->
            <div class="flex-grow">
              <div class="text-primary dark:text-dark-primary font-semibold flex gap-1 flex-wrap">
                <ClientOnly>
                  <span>
                    <time>{{ formatDate(event.start) }} {{ formatTime(event.start) }} - </time>
                  </span>
                  <span>
                    <time>{{ formatTime(event.end) }}</time>
                  </span>
                </ClientOnly>
              </div>
              <h2
                class="font-sorts text-balance"
                :class="{
                  'text-xl lg:text-2xl': display !== 'small',
                  'text-lg/6': display === 'small',
                }"
              >
                <template v-if="display !== 'detail'">
                  <nuxt-link :to="`/event/${event.id}`" class="overlay-link">
                    {{ event.title }}
                  </nuxt-link>
                </template>
                <template v-else>
                  {{ event.title }}
                </template>
              </h2>
            </div>

            <!-- Tags and actions -->
            <div class="flex gap-2 items-center">
              <template v-if="event.location_type === 'ONLINE'">
                <Badge
                  :size="display === 'small' ? 'sm' : 'md'"
                  color="digital"
                >
                  Online
                </Badge>
              </template>
              <template v-else>
                <Badge
                  :size="display === 'small' ? 'sm' : 'md'"
                  color="primary"
                >
                  In person
                </Badge>
              </template>
              <div
                v-if="display !== 'small' && canModifyEvent"
                class="relative"
                id="menu-controls"
              >
                <Menu>
                  <MenuButton>
                    <IconUI id="dots" :rounded="true" shadow />
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
                      class="ct-contextual-links"
                    >
                      <MenuItem>
                        <ButtonSubmenu
                          component="nuxt-link"
                          :to="`/event/${event.id}/edit`"
                          icon="edit"
                        >
                          Edit Event
                        </ButtonSubmenu>
                      </MenuItem>
                      <MenuItem>
                        <ButtonSubmenu
                          component="nuxt-link"
                          :to="`/event/create?duplicate=${event.id}${
                            event.community?.slug
                              ? `&slug=${event.community?.slug}`
                              : ''
                          }`"
                          icon="copy"
                        >
                          Duplicate Event
                        </ButtonSubmenu>
                      </MenuItem>
                      <MenuItem>
                        <ButtonSubmenu
                          @click="deleteEvent"
                          icon="trash"
                        >
                          Delete Event
                        </ButtonSubmenu>
                      </MenuItem>
                    </MenuItems>
                  </transition>
                </Menu>
              </div>
            </div>
          </div>

          <!-- Author -->
          <div 
            v-if="display !== 'small'"
            class="ct-card__subline flex items-center gap-1"
            >
            <div
              v-if="event.created_by"
              class="flex items-center gap-2"
            >
              <Avatar :value="event.created_by.avatar" size="xxs" background />
              <span>Created by {{ event.created_by.display_name }}</span>
            </div>
          </div>
        </div>
        
        <template v-if="event.description">
          <VueMarkdown
            class="post max-w-[80ch] text-stone-700 dark:text-stone-400"
            :class="{
              'text-sm md:text-base': display !== 'small',
              'text-sm': display === 'small',
            }"
            :source="event.description"
          />
        </template>
        
        <div v-if="$slots.register" class="flex-grow flex items-end">
          <div class="flex gap-2">
            <slot name="register" :event="event" />
          </div>
        </div>
      </div>
    </div>

    <div>
      <div 
        class="flex flex-col gap-4 px-4 pb-4"
        :class="{
          'xl:pl-6 pt-4': display === 'detail',
        }"
      >
        <hr 
          class="border-stone-300 dark:border-stone-700/50 w-full "
          :class="{
            'lg:hidden': display === 'detail',
          }"
        />

        <!-- Metadata -->
        <div 
          class="grid"
          :class="{
            'grid-cols-2 gap-2': display !== 'small',
            'gap-1': display === 'small',
          }"
        >
          <div v-if="event.location_type !== 'ONLINE'" class="card-metadata">
            <span class="card-label">
              Location
            </span>
            {{ event.location }}
          </div>
          <div v-if="event.game_link" class="card-metadata">
            <span class="card-label">
              Game Link
            </span>
            <Button
              component="a"
              :href="event.game_link"
              color="primary"
              variant="link"
            >
              Go to game <span class="sr-only">{{ event.title }}</span>
            </Button>
          </div>
          <div
            class="card-metadata"
            v-if="
              event.storytellers.length > 0 && event.storytellers[0].length > 0
            "
          >
            <span class="card-label"
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
          <div class="card-metadata" v-if="event.script">
            <span class="card-label">
              Script
            </span>
            <Button
              component="a"
              :href="scriptLink(event)" 
              target=""
              color="primary"
              variant="link"
            >
              {{ event.script }}
            </Button>
          </div>
          <div class="card-metadata">
            <span v-if="display === 'detail'" class="card-label">
              Status
            </span>
            <div>
              <template v-if="event.player_count">
                {{ registeredPlayerCount }}/{{ event.player_count }}
              </template>
              <template v-else>
                {{ registeredPlayerCount }}
              </template>
              players registered
              <template v-if="waitlistCount > 0">
                <span class="text-stone-500 dark:text-stone-400">
                  ({{ waitlistCount }} waiting)
                </span>
              </template>
            </div>
            
          </div>
        </div>

        <slot name="footer" :event="event" />
        
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Event } from "~/composables/useCommunities";
import VueMarkdown from "vue-markdown-render";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import { chartColors } from "~/composables/useChartColors";

const props = defineProps<{
  event: Event;
  canModifyEvent?: boolean;
  display?: "small" | "large" | "detail" ;
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
    $fetch(`/api/event/${props.event.id}`, {
      method: "DELETE",
    }).then(() => {
      emit("deleted", props.event.id);
    });
  }
}

</script>

<style scoped>
  .card-metadata {
    @apply flex flex-col gap-1 items-start;
  }

  .card-label {
    @apply text-xs text-stone-500 dark:text-stone-400 uppercase;
  }
</style>
