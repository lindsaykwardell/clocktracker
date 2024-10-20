<template>
  <component :is="template" :slug="event.community?.slug">
    <UserHeader v-if="createdBy" :player="createdBy" />
    <EventCard
      v-if="event"
      :event="event"
      class="m-auto my-6"
      x:canModifyEvent="isModerator"
      @deleted="eventDeleted"
    >
      <template #register>
        <Button
          v-if="shareIsSupported || copyIsSupported"
          class="py-2 px-4"
          font-size="md"
          @click="getShareLink"
          v-tooltip="{
            content: 'Copied!',
            shown: showShareTooltip,
            triggers: [],
          }"
        >
          Share
        </Button>
        <Button
          v-if="isAllowedToRegister"
          :disabled="inFlight"
          @click="initRegister()"
          class="py-2 px-4"
          font-size="md"
          :primary="!alreadyRegistered"
          :outline="alreadyRegistered"
        >
          <template v-if="inFlight"><Spinner /></template>
          <template v-else-if="alreadyRegistered">Unregister</template>
          <template v-else>Register</template>
        </Button>
      </template>
      <template #footer>
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <h3 class="font-bold">Players</h3>
            <ul>
              <li
                v-for="player in event.player_count
                  ? event.registered_players.slice(0, event.player_count)
                  : event.registered_players"
              >
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
                <div
                  v-else-if="player.discord_user_id"
                  class="flex gap-2 items-center"
                >
                  <Avatar
                    value="/img/discord.png"
                    size="xs"
                    class="border-stone-800"
                  />
                  <div>{{ player.name }}</div>
                </div>
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
                event.registered_players.length > event.player_count) ||
              event.waitlists.length > 0
            "
            class="flex-1 flex flex-col gap-2"
          >
            <template
              v-if="
                event.player_count &&
                event.registered_players.length > event.player_count
              "
            >
              <h3 class="font-bold">Waitlist</h3>
              <ul>
                <li
                  v-for="player in event.registered_players.slice(
                    event.player_count
                  )"
                >
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
            <template v-for="waitlist in event.waitlists">
              <h3 class="font-bold">{{ waitlist.name }}</h3>
              <ul>
                <li v-for="player in waitlist.users">
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
              <button
                xv-if="
                  !inFlight &&
                  (event.who_can_register === 'ANYONE' ? true : isMember)
                "
                v-if="!inFlight"
                @click="initRegister(waitlist.id)"
                class="transition duration-150 text-stone-400 hover:text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-4"
              >
                <template v-if="!alreadyRegistered">
                  Register for {{ waitlist.name }}
                </template>
              </button>
            </template>
          </div>
        </div>
      </template>
    </EventCard>
    <Dialog v-model:visible="showRegisterDialog" size="sm">
      <h3 class="font-dumbledor text-xl lg:text-2xl mb-4 text-center">
        Register
      </h3>
      <form
        @submit.prevent="register(attendeeName, registerForWaitlist)"
        class="flex flex-col gap-4 p-6"
      >
        <label class="flex-grow">
          <span class="block">Name</span>
          <input
            v-model="attendeeName"
            class="block w-full border border-stone-500 rounded-md p-2 bg-stone-600 text-white text-lg"
            required
          />
        </label>
        <button
          :disabled="inFlight"
          type="submit"
          id="register-attendee"
          class="w-full bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-4"
        >
          <template v-if="inFlight"><Spinner /></template>
          <template v-else>Register</template>
        </button>
      </form>
    </Dialog>
  </component>
</template>

<script setup lang="ts">
import type { Event } from "~/composables/useCommunities";
import dayjs from "dayjs";
import { useShare, useClipboard } from "@vueuse/core";

type EventView = Event & {
  community: {
    name: string;
  };
};

const route = useRoute();
const router = useRouter();
const eventId = route.params.eventId as string;
const users = useUsers();
const user = useSupabaseUser();
const communities = useCommunities();
const friends = useFriends();

const showRegisterDialog = ref(false);
const attendeeName = ref("");
const inFlight = ref(false);

const event = ref<EventView>(await $fetch<EventView>(`/api/event/${eventId}`));

const shareDetails = ref({
  title: event.value.title,
  text: event.value.description,
  url: "",
});

const copySource = computed(() => shareDetails.value.url);

const { share, isSupported: shareIsSupported } = useShare(shareDetails);
const {
  copy,
  copied,
  isSupported: copyIsSupported,
} = useClipboard({ source: copySource, legacy: true });

let poll: NodeJS.Timeout | null = null;

const createdBy = computed(() => {
  if (event.value.created_by) {
    const createdByFetchStatus = users.getUserById(
      event.value.created_by.user_id
    );

    if (createdByFetchStatus.status === Status.SUCCESS) {
      return createdByFetchStatus.data;
    }
  }

  return null;
});

const isAllowedToRegister = computed(() => {
  if (event.value.who_can_register === "ANYONE") {
    return true;
  }

  if (event.value.community?.slug) {
    return communities.isMember(event.value.community.slug, user.value?.id);
  }

  if (event.value.created_by) {
    // If it's me, I can register
    if (event.value.created_by.user_id === user.value?.id) {
      return true;
    }

    // If the creator of the event is a friend, I can register
    return friends.isFriend(event.value.created_by.username);
  }

  return false;
});

onMounted(() => {
  poll = setInterval(async () => {
    event.value = await $fetch<EventView>(`/api/event/${eventId}`);
  }, 1000 * 60 * 5);

  if (event.value.community) {
    communities.fetchCommunity(event.value.community.slug);
  }

  if (event.value.created_by) {
    users.fetchUser(event.value.created_by.username);
  }
});

onUnmounted(() => {
  clearInterval(poll!);
});

const alreadyRegistered = computed(() => {
  const me = users.getUserById(user.value?.id);

  if (me.status !== Status.SUCCESS) {
    return false;
  }

  return (
    event.value?.registered_players.some(
      (player) => player.user?.user_id === me.data.user_id
    ) ||
    event.value.waitlists.some((waitlist) =>
      waitlist.users.some((player) => player.user?.user_id === me.data.user_id)
    ) ||
    false
  );
});

const registerForWaitlist = ref<number | undefined>(undefined);

function initRegister(waitlistId?: number) {
  const me = users.getUserById(user.value?.id);
  if (me.status !== Status.SUCCESS) {
    registerForWaitlist.value = waitlistId;
    showRegisterDialog.value = true;
  } else {
    register(me.data.display_name, waitlistId);
  }
}

async function register(name: string, waitlistId?: number) {
  inFlight.value = true;
  try {
    if (alreadyRegistered.value) {
      event.value = await $fetch<EventView>(`/api/event/${eventId}/register`, {
        method: "DELETE",
      });
    } else {
      event.value = await $fetch<EventView>(`/api/event/${eventId}/register`, {
        method: "POST",
        body: JSON.stringify({
          name,
          waitlist_id: waitlistId,
        }),
      });

      showRegisterDialog.value = false;
      attendeeName.value = "";
    }
  } catch (e) {
    alert((e as { statusMessage: string }).statusMessage);
  }
  inFlight.value = false;
}

const showShareTooltip = ref(false);

async function getShareLink() {
  try {
    // @ts-ignore
    shareDetails.value.url = await $fetch(`/api/events/${eventId}/share`);

    if (shareIsSupported.value) {
      await share();
    } else if (copyIsSupported.value) {
      await copy();
      if (copied.value) {
        showShareTooltip.value = true;
        setTimeout(() => {
          showShareTooltip.value = false;
        }, 2000);
      }
    }
  } catch (e) {
    // Do nothing
  }
}

function eventDeleted() {
  if (event.value.community?.slug) {
    router.push(`/community/${event.value.community.slug}/events`);
  } else {
    router.push(`/`);
  }
}

const standardTemplate = resolveComponent("StandardTemplate");
const communityTemplate = resolveComponent("CommunityTemplate");

const template = computed(() => {
  if (event.value.community?.slug) {
    return communityTemplate;
  }

  return standardTemplate;
});

useHead({
  title: `${
    event.value.community?.name ?? event.value.created_by?.display_name
  } | ${event.value.title}`,
  meta: [
    {
      hid: "description",
      name: "description",
      content: `${event.value.title}, hosted by ${
        event.value.community?.name ?? event.value.created_by?.display_name
      } on ${dayjs(event.value.start).format("MMMM D, YYYY")} at ${dayjs(
        event.value.start
      ).format("HH:MM a")}.`,
    },
    {
      property: "og:title",
      content: `${
        event.value.community?.name ?? event.value.created_by?.display_name
      } | ${event.value.title}`,
    },
    {
      property: "og:description",
      content: `${event.value.title}, hosted by ${
        event.value.community?.name ?? event.value.created_by?.display_name
      } on ${dayjs(event.value.start).format("MMMM D, YYYY")} at ${dayjs(
        event.value.start
      ).format("HH:MM a")}.`,
    },
    {
      property: "og:image",
      content: event.value.image,
    },
    {
      property: "og:url",
      content: route.fullPath,
    },
    {
      property: "twitter:card",
      content: "summary_large_image",
    },
    {
      property: "twitter:url",
      content: route.fullPath,
    },
    {
      property: "twitter:title",
      content: `${
        event.value.community?.name ?? event.value.created_by?.display_name
      } | ${event.value.title}`,
    },
    {
      property: "twitter:description",
      content: `${event.value.title}, hosted by ${
        event.value.community?.name ?? event.value.created_by?.display_name
      } on ${dayjs(event.value.start).format("MMMM D, YYYY")} at ${dayjs(
        event.value.start
      ).format("HH:MM a")}.`,
    },
    {
      property: "twitter:image",
      content: event.value.image,
    },
  ],
});
</script>
