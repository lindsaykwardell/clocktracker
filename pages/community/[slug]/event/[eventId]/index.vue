<template>
  <CommunityTemplate v-slot="{ isModerator, isMember }">
    <EventCard v-if="event" :event="event" class="m-auto my-6">
      <template #register>
        <button
          v-if="event.who_can_register === 'ANYONE' ? true : isMember"
          @click="initRegister"
          class="bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-4"
        >
          <template v-if="alreadyRegistered">Unregister</template>
          <template v-else>Register</template>
        </button>
      </template>
      <template #footer>
        <div class="flex gap-4">
          <div class="flex-1">
            <h3 class="font-bold">Players</h3>
            <ul>
              <li
                v-for="player in event.player_count
                  ? event.registered_players.slice(0, event.player_count)
                  : event.registered_players"
                class="hover:underline"
              >
                <nuxt-link
                  v-if="player.user"
                  :to="`/@${player.user.username}`"
                  class="flex gap-2 items-center"
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
              event.player_count &&
              event.registered_players.length > event.player_count
            "
            class="flex-1"
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
                  class="flex gap-2 items-center"
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
        </div>
      </template>
    </EventCard>
    <div class="flex justify-end gap-4 p-4">
      <nuxt-link
        v-if="isModerator"
        :to="`/community/${slug}/event/${eventId}/edit`"
        class="bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-4"
      >
        Edit Event
      </nuxt-link>
      <button
        v-if="isModerator"
        @click="deleteEvent"
        class="bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-4"
      >
        Delete Event
      </button>
    </div>
    <Dialog v-model:visible="showRegisterDialog" size="sm">
      <h3 class="font-dumbledor text-xl lg:text-2xl mb-4 text-center">
        Register
      </h3>
      <form
        @submit.prevent="register(attendeeName)"
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
          type="submit"
          id="register-attendee"
          class="w-full bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-4"
        >
          Register
        </button>
      </form>
    </Dialog>
  </CommunityTemplate>
</template>

<script setup lang="ts">
import { Event } from "~/composables/useCommunities";

const route = useRoute();
const router = useRouter();
const slug = route.params.slug as string;
const eventId = route.params.eventId as string;
const users = useUsers();
const user = useSupabaseUser();

const showRegisterDialog = ref(false);
const attendeeName = ref("");

const event = ref<Event>(
  await $fetch<Event>(`/api/community/${slug}/event/${eventId}`)
);

const alreadyRegistered = computed(() => {
  const me = users.getUserById(user.value?.id);

  if (me.status !== Status.SUCCESS) {
    return false;
  }

  return (
    event.value?.registered_players.some(
      (player) => player.user?.user_id === me.data.user_id
    ) ?? false
  );
});

function initRegister() {
  const me = users.getUserById(user.value?.id);
  if (me.status !== Status.SUCCESS) {
    showRegisterDialog.value = true;
  } else {
    register(me.data.display_name);
  }
}

async function register(name: string) {
  if (alreadyRegistered.value) {
    event.value = await $fetch<Event>(
      `/api/community/${slug}/event/${eventId}/register`,
      {
        method: "DELETE",
      }
    );
  } else {
    event.value = await $fetch<Event>(
      `/api/community/${slug}/event/${eventId}/register`,
      {
        method: "POST",
        body: JSON.stringify({
          name,
        }),
      }
    );

    showRegisterDialog.value = false;
    attendeeName.value = "";
  }
}

function deleteEvent() {
  if (confirm("Are you sure you want to delete this event?")) {
    $fetch(`/api/community/${slug}/event/${eventId}`, {
      method: "DELETE",
    }).then(() => {
      router.push(`/community/${slug}/events`);
    });
  }
}
</script>
