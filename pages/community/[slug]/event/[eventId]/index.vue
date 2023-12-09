<template>
  <CommunityTemplate v-slot="{ isModerator, isMember }">
    <EventCard v-if="event" :event="event" class="m-auto my-6">
      <button
        v-if="isMember"
        @click="register"
        class="bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-4"
      >
        <template v-if="alreadyRegistered">Unregister</template>
        <template v-else>Register</template>
      </button>
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

const event = ref<Event | null>(null);

event.value = await $fetch<Event>(`/api/community/${slug}/event/${eventId}`);

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

async function register() {
  const me = users.getUserById(user.value?.id);
  let name = "";

  if (me.status !== Status.SUCCESS) {
    return;
  }

  if (alreadyRegistered.value) {
    event.value = await $fetch<Event>(
      `/api/community/${slug}/event/${eventId}/register`,
      {
        method: "DELETE",
      }
    );
  } else {
    const name = me.data.display_name;

    event.value = await $fetch<Event>(
      `/api/community/${slug}/event/${eventId}/register`,
      {
        method: "POST",
        body: JSON.stringify({
          name,
        }),
      }
    );
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
