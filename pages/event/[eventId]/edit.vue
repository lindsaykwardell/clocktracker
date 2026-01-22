<template>
  <component :is="template" moderatorOnly :slug="existingEvent.community?.slug">
    <div class="px-4 md:px-8">
      <h2 class="font-sorts text-2xl lg:text-3xl my-4 text-center">Edit Event</h2>
      <EventEditor
        :event="event"
        :inFlight="inFlight"
        :errors="errors"
        @save="saveEvent"
      />
      <h3 class="font-sorts text-xl lg:text-2xl my-4 text-center">
        Registered Players
      </h3>
      <ClientOnly>
        <div class="flex flex-col md:flex-row gap-8 max-w-[1000px] m-auto pb-4 lg:pb-8">
          <div class="flex-1 space-y-2">
            <h3 class="font-bold">Players</h3>
            <ul class="flex flex-col divide-y divide-stone-300 dark:divide-stone-700/40">
              <li
                v-for="player in event.player_count
                  ? registered_players.slice(0, event.player_count)
                  : registered_players"
                class="flex justify-between gap-2 py-1"
              >
                <nuxt-link
                  v-if="player.user"
                  :to="`/@${player.user.username}`"
                  class="flex gap-2 items-center hover:underline"
                  v-tooltip="'Registered on ' + formatDate(player.created_at)"
                >
                  <Avatar
                    :value="player.user.avatar"
                    size="xs"
                    class="border-stone-800"
                  />
                  <div>{{ player.name }}</div>
                </nuxt-link>
                <div
                  v-else
                  class="flex gap-2 items-center"
                  v-tooltip="'Registered on ' + formatDate(player.created_at)"
                >
                  <Avatar
                    value="/img/default.png"
                    size="xs"
                    class="border-stone-800"
                  />
                  <div>{{ player.name }}</div>
                </div>
                <EventPlayerPopover :options="registeredOptions(player)" />
              </li>
            </ul>
            <EventTaggedUserInput
              :slug="existingEvent.community?.slug"
              :alreadyRegisteredUserIds="alreadyRegisteredUserIds"
              @add-player="registerPlayer"
            />
          </div>
          <div
            v-if="
              (event.player_count &&
                registered_players.length > event.player_count) ||
              event.waitlists.length > 0
            "
            class="flex-1 flex flex-col gap-4"
          >
            <template
              v-if="
                event.player_count &&
                registered_players.length > event.player_count
              "
            >
              <div class="space-y-2">
                <h3 class="font-bold">Waitlist</h3>
                <ul class="flex flex-col divide-y divide-stone-300 dark:divide-stone-700/40">
                  <li
                    v-for="player in registered_players.slice(event.player_count)"
                    class="flex justify-between gap-2 py-1"
                  >
                    <nuxt-link
                      v-if="player.user"
                      :to="`/@${player.user.username}`"
                      class="flex gap-2 items-center hover:underline"
                      v-tooltip="'Registered on ' + formatDate(player.created_at)"
                    >
                      <Avatar
                        :value="player.user.avatar"
                        size="xs"
                        class="border-stone-800"
                      />
                      <div>{{ player.name }}</div>
                    </nuxt-link>
                    <div
                      v-else
                      class="flex gap-2 items-center"
                      v-tooltip="'Registered on ' + formatDate(player.created_at)"
                    >
                      <Avatar
                        value="/img/default.png"
                        size="xs"
                        class="border-stone-800"
                      />
                      <div>{{ player.name }}</div>
                    </div>
                    <EventPlayerPopover :options="registeredOptions(player)" />
                  </li>
                </ul>
              </div>
            </template>
            <template v-for="waitlist in waitlists">
              <div class="space-y-2">
                <h3 class="font-bold">{{ waitlist.name }}</h3>
                <ul class="flex flex-col divide-y divide-stone-300 dark:divide-stone-700/40">
                  <li 
                    v-for="player in waitlist.users" 
                    class="flex justify-between gap-2 py-1"
                  >
                    <nuxt-link
                      v-if="player.user"
                      v-tooltip="'Registered on ' + formatDate(player.created_at)"
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
                    <div
                      v-else
                      class="flex gap-2 items-center"
                      v-tooltip="'Registered on ' + formatDate(player.created_at)"
                    >
                      <Avatar
                        value="/img/default.png"
                        size="xs"
                        class="border-stone-800"
                      />
                      <div>{{ player.name }}</div>
                    </div>
                    <EventPlayerPopover
                      :options="waitlistOptions(player, waitlist)"
                    />
                  </li>
                </ul>
                <EventTaggedUserInput
                  :slug="existingEvent.community?.slug"
                  :alreadyRegisteredUserIds="alreadyRegisteredUserIds"
                  :waitlistId="waitlist.id"
                  @add-player="registerPlayer"
                />
              </div>
            </template>
          </div>
        </div>
      </ClientOnly>
    </div>
  </component>
</template>

<script setup lang="ts">
import dayjs from "dayjs";

const router = useRouter();
const route = useRoute();
const communities = useCommunities();

const eventId = route.params.eventId as string;

definePageMeta({
  middleware: "community-admin",
});

const existingEvent = await $fetch(`/api/event/${eventId}`);

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
  community_id: number | null;
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
  script: existingEvent.script ?? "",
  script_id: existingEvent.script_id,
  game_link: existingEvent.game_link,
  waitlists: existingEvent.waitlists.map((w) => ({
    id: w.id,
    name: w.name,
    default: w.default,
  })),
  community_id: existingEvent.community_id,
});

const registered_players = ref(existingEvent.registered_players);
const waitlists = ref(existingEvent.waitlists);
const alreadyRegisteredUserIds = computed(
  () =>
    [
      ...registered_players.value.map((p) => p.user?.user_id),
      ...waitlists.value.flatMap((w) => w.users.map((u) => u.user?.user_id)),
    ].filter(Boolean) as string[]
);

async function registerPlayer({
  user,
  waitlistId,
}: {
  user: { user_id: string; display_name: string };
  waitlistId?: number;
}) {
  const response = await $fetch(`/api/event/${eventId}/add_player`, {
    method: "POST",
    body: JSON.stringify({
      name: user.display_name,
      user_id: user.user_id,
      waitlist_id: waitlistId,
    }),
  });

  registered_players.value = response.registered_players;
  waitlists.value = response.waitlists;

  setTimeout(() => {
    // scroll to bottom
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }, 1);
}

const formattedEvent = computed(() => {
  return {
    ...event,
    start: dayjs(event.start).toISOString(),
    end: dayjs(event.end).toISOString(),
  };
});

function formatDate(date: string) {
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

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
    const saved = await $fetch(`/api/event/${existingEvent.id}`, {
      method: "PUT",
      body: JSON.stringify(formattedEvent.value),
    });

    if (saved) {
      router.push(`/event/${saved.id}`);
    }
  } catch (err) {
    errors.value = (err as any).statusMessage;
  }
}

async function deleteRegisteredPlayer(id: number) {
  if (confirm("Are you sure you want to remove this player?")) {
    await $fetch(`/api/event/${eventId}/registered/${id}`, {
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
      `/api/event/${eventId}/waitlist/${waitlistId}/registered/${id}`,
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
  const updatedEvent = await $fetch(`/api/event/${eventId}/registered`, {
    method: "PUT",
    body: JSON.stringify({ player_id, from, to }),
  });

  registered_players.value = updatedEvent.registered_players;
  waitlists.value = updatedEvent.waitlists;
}

const standardTemplate = resolveComponent("StandardTemplate");
const communityTemplate = resolveComponent("CommunityTemplate");

const template = computed(() => {
  if (event.community_id) {
    return communityTemplate;
  }

  return standardTemplate;
});

onMounted(() => {
  if (existingEvent.community?.slug) {
    communities.fetchCommunity(existingEvent.community.slug);
  }
});
</script>
