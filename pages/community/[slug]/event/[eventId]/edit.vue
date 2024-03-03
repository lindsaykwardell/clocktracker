<template>
  <CommunityTemplate moderatorOnly>
    <h2 class="font-dumbledor text-2xl lg:text-3xl my-4 text-center">
      Edit Event
    </h2>
    <EventEditor
      :event="event"
      :inFlight="inFlight"
      :errors="errors"
      @save="saveEvent"
    />
    <h3 class="font-dumbledor text-xl lg:text-2xl my-4 text-center">
      Registered Players
    </h3>
    <div class="flex flex-col md:flex-row gap-4 max-w-[1000px] m-auto">
      <div class="flex-1">
        <h3 class="font-bold">Players</h3>
        <ul>
          <li
            v-for="player in event.player_count
              ? registered_players.slice(0, event.player_count)
              : registered_players"
            class="flex gap-2"
          >
            <button @click="deleteRegisteredPlayer(player.id)">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 512 512"
              >
                <path
                  d="M400 113.3h-80v-20c0-16.2-13.1-29.3-29.3-29.3h-69.5C205.1 64 192 77.1 192 93.3v20h-80V128h21.1l23.6 290.7c0 16.2 13.1 29.3 29.3 29.3h141c16.2 0 29.3-13.1 29.3-29.3L379.6 128H400v-14.7zm-193.4-20c0-8.1 6.6-14.7 14.6-14.7h69.5c8.1 0 14.6 6.6 14.6 14.7v20h-98.7v-20zm135 324.6v.8c0 8.1-6.6 14.7-14.6 14.7H186c-8.1 0-14.6-6.6-14.6-14.7v-.8L147.7 128h217.2l-23.3 289.9z"
                  fill="currentColor"
                />
                <path d="M249 160h14v241h-14z" fill="currentColor" />
                <path d="M320 160h-14.6l-10.7 241h14.6z" fill="currentColor" />
                <path d="M206.5 160H192l10.7 241h14.6z" fill="currentColor" />
              </svg>
            </button>
            <nuxt-link
              v-if="player.user"
              :to="`/@${player.user.username}`"
              class="flex gap-2 items-center hover:underline"
            >
              <Avatar
                :value="player.user.avatar"
                size="xs"
                class="border-stone-800"
              />
              <div>{{ player.name }}</div>
            </nuxt-link>
            <div v-else class="flex gap-2 items-center">
              <Avatar
                value="/img/default.png"
                size="xs"
                class="border-stone-800"
              />
              <div>{{ player.name }}</div>
            </div>
          </li>
        </ul>
      </div>
      <div
        v-if="
          (event.player_count &&
            registered_players.length > event.player_count) ||
          event.waitlists.length > 0
        "
        class="flex-1 flex flex-col gap-2"
      >
        <template
          v-if="
            event.player_count && registered_players.length > event.player_count
          "
        >
          <h3 class="font-bold">Waitlist</h3>
          <ul>
            <li
              v-for="player in registered_players.slice(event.player_count)"
              class="flex gap-2"
            >
              <button @click="deleteRegisteredPlayer(player.id)">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 512 512"
                >
                  <path
                    d="M400 113.3h-80v-20c0-16.2-13.1-29.3-29.3-29.3h-69.5C205.1 64 192 77.1 192 93.3v20h-80V128h21.1l23.6 290.7c0 16.2 13.1 29.3 29.3 29.3h141c16.2 0 29.3-13.1 29.3-29.3L379.6 128H400v-14.7zm-193.4-20c0-8.1 6.6-14.7 14.6-14.7h69.5c8.1 0 14.6 6.6 14.6 14.7v20h-98.7v-20zm135 324.6v.8c0 8.1-6.6 14.7-14.6 14.7H186c-8.1 0-14.6-6.6-14.6-14.7v-.8L147.7 128h217.2l-23.3 289.9z"
                    fill="currentColor"
                  />
                  <path d="M249 160h14v241h-14z" fill="currentColor" />
                  <path
                    d="M320 160h-14.6l-10.7 241h14.6z"
                    fill="currentColor"
                  />
                  <path d="M206.5 160H192l10.7 241h14.6z" fill="currentColor" />
                </svg>
              </button>
              <nuxt-link
                v-if="player.user"
                :to="`/@${player.user.username}`"
                class="flex gap-2 items-center hover:underline"
              >
                <Avatar
                  :value="player.user.avatar"
                  size="xs"
                  class="border-stone-800"
                />
                <div>{{ player.name }}</div>
              </nuxt-link>
              <div v-else class="flex gap-2 items-center">
                <Avatar
                  value="/img/default.png"
                  size="xs"
                  class="border-stone-800"
                />
                <div>{{ player.name }}</div>
              </div>
            </li>
          </ul>
        </template>
        <template v-for="waitlist in waitlists">
          <h3 class="font-bold">{{ waitlist.name }}</h3>
          <ul>
            <li v-for="player in waitlist.users" class="flex gap-2">
              <button @click="deleteWaitlistPlayer(waitlist.id, player.id)">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 512 512"
                >
                  <path
                    d="M400 113.3h-80v-20c0-16.2-13.1-29.3-29.3-29.3h-69.5C205.1 64 192 77.1 192 93.3v20h-80V128h21.1l23.6 290.7c0 16.2 13.1 29.3 29.3 29.3h141c16.2 0 29.3-13.1 29.3-29.3L379.6 128H400v-14.7zm-193.4-20c0-8.1 6.6-14.7 14.6-14.7h69.5c8.1 0 14.6 6.6 14.6 14.7v20h-98.7v-20zm135 324.6v.8c0 8.1-6.6 14.7-14.6 14.7H186c-8.1 0-14.6-6.6-14.6-14.7v-.8L147.7 128h217.2l-23.3 289.9z"
                    fill="currentColor"
                  />
                  <path d="M249 160h14v241h-14z" fill="currentColor" />
                  <path
                    d="M320 160h-14.6l-10.7 241h14.6z"
                    fill="currentColor"
                  />
                  <path d="M206.5 160H192l10.7 241h14.6z" fill="currentColor" />
                </svg>
              </button>
              <nuxt-link
                v-if="player.user"
                :to="`/@${player.user.username}`"
                class="flex gap-2 items-center hover:underline"
              >
                <Avatar
                  :value="player.user.avatar"
                  size="xs"
                  class="border-stone-800"
                />
                <div>{{ player.name }}</div>
              </nuxt-link>
              <div v-else class="flex gap-2 items-center">
                <Avatar
                  value="/img/default.png"
                  size="xs"
                  class="border-stone-800"
                />
                <div>{{ player.name }}</div>
              </div>
            </li>
          </ul>
        </template>
      </div>
    </div>
  </CommunityTemplate>
</template>

<script setup lang="ts">
import dayjs from "dayjs";

const router = useRouter();
const route = useRoute();

const slug = route.params.slug as string;
const eventId = route.params.eventId as string;

definePageMeta({
  middleware: "community-admin",
});

const existingEvent = await $fetch(`/api/community/${slug}/event/${eventId}`);

const event = reactive<{
  title: string;
  start: string;
  end: string;
  location_type: "ONLINE" | "IN_PERSON";
  location: string;
  player_count: number | null;
  description: string;
  image: string | null;
  who_can_register: "ANYONE" | "COMMUNITY_MEMBERS";
  waitlists: {
    id?: number;
    name: string;
    default: boolean;
  }[];
}>({
  title: existingEvent.title,
  description: existingEvent.description,
  start: dayjs(existingEvent.start).format("YYYY-MM-DDTHH:mm"),
  end: dayjs(existingEvent.end).format("YYYY-MM-DDTHH:mm"),
  player_count: existingEvent.player_count,
  location_type: existingEvent.location_type,
  location: existingEvent.location,
  image: existingEvent.image,
  who_can_register: existingEvent.who_can_register,
  waitlists: existingEvent.waitlists.map((w) => ({
    id: w.id,
    name: w.name,
    default: w.default,
  })),
});

const registered_players = ref(existingEvent.registered_players);
const waitlists = ref(existingEvent.waitlists);

const formattedEvent = computed(() => {
  return {
    ...event,
    start: dayjs(event.start).toISOString(),
    end: dayjs(event.end).toISOString(),
  };
});

const inFlight = ref(false);
const errors = ref("");

async function saveEvent() {
  inFlight.value = true;
  errors.value = "";
  try {
    const saved = await $fetch(
      `/api/community/${slug}/event/${existingEvent.id}`,
      {
        method: "PUT",
        body: JSON.stringify(formattedEvent.value),
      }
    );

    if (saved) {
      router.push(`/community/${slug}/event/${saved.id}`);
    }
  } catch (err) {
    errors.value = (err as any).statusMessage;
  }
}

async function deleteRegisteredPlayer(id: number) {
  await $fetch(`/api/community/${slug}/event/${eventId}/registered/${id}`, {
    method: "DELETE",
  });

  registered_players.value = registered_players.value.filter(
    (p) => p.id !== id
  );
}

async function deleteWaitlistPlayer(waitlistId: number, id: number) {
  await $fetch(
    `/api/community/${slug}/event/${eventId}/waitlist/${waitlistId}/registered/${id}`,
    {
      method: "DELETE",
    }
  );

  waitlists.value = waitlists.value.map((w) => {
    if (w.id === waitlistId) {
      w.users = w.users.filter((u) => u.id !== id);
    }
    return w;
  });
}
</script>
