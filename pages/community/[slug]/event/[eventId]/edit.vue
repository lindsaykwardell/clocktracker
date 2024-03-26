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
            <EventPlayerPopover
              :options="registeredOptions(player)"
            />
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
              <EventPlayerPopover
                :options="registeredOptions(player)"
              />
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
              <EventPlayerPopover
                :options="waitlistOptions(player, waitlist)"
              />

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
  who_can_register: "ANYONE" | "PRIVATE" | "COMMUNITY_MEMBERS";
  storytellers: string[];
  script: string;
  script_id: number | null;
  game_link: string | null;
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
  storytellers: existingEvent.storytellers,
  script: existingEvent.script,
  script_id: existingEvent.script_id,
  game_link: existingEvent.game_link,
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

function registeredOptions(player: any) {
  return [
    ...event.waitlists.map((waitlist) => ({
      label: `Move to ${waitlist.name}`,
      action: () => moveRegisteredPlayer(player.id, "registered", waitlist.id!),
    })),
    {
      label: "Remove Player",
      action: () => deleteRegisteredPlayer(player.id),
    },
  ];
}

function waitlistOptions(player: any, waitlist: any) {
  return [
    {
      label: "Move to Registered",
      action: () => moveRegisteredPlayer(player.id, waitlist.id!, "registered"),
    },
    ...event.waitlists
      .filter((w) => w.id !== waitlist.id)
      .map((w) => ({
        label: `Move to ${w.name}`,
        action: () => moveRegisteredPlayer(player.id, waitlist.id, w.id!),
      })),
    {
      label: "Remove Player",
      action: () => deleteWaitlistPlayer(waitlist.id, player.id),
    },
  ];
}

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
  if (confirm("Are you sure you want to remove this player?")) {
    await $fetch(`/api/community/${slug}/event/${eventId}/registered/${id}`, {
      method: "DELETE",
    });

    registered_players.value = registered_players.value.filter(
      (p) => p.id !== id
    );
  }
}

async function deleteWaitlistPlayer(waitlistId: number, id: number) {
  if (confirm("Are you sure you want to remove this player?")) {
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
}

async function moveRegisteredPlayer(
  player_id: number,
  from: "registered" | number,
  to: "registered" | number
) {
  const updatedEvent = await $fetch(
    `/api/community/${slug}/event/${eventId}/registered`,
    {
      method: "PUT",
      body: JSON.stringify({ player_id, from, to }),
    }
  );

  registered_players.value = updatedEvent.registered_players;
  waitlists.value = updatedEvent.waitlists;
}
</script>
