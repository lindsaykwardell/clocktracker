<template>
  <CommunityTemplate v-slot="{ isModerator }">
    <EventCard :event="event" class="m-auto my-6" />
    <div class="flex justify-end gap-4 p-4">
      <nuxt-link
        v-if="isModerator"
        :to="`/community/${slug}/event/${eventId}/edit`"
        class="bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-4"
      >
        Edit Event
      </nuxt-link>
      <button
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

const event = await $fetch<Event>(`/api/community/${slug}/event/${eventId}`);

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
