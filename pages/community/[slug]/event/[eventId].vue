<template>
  <CommunityTemplate v-slot="{ community }">
    <EventCard :event="event" class="m-auto my-6" />
  </CommunityTemplate>
</template>

<script setup lang="ts">
import { Event } from "~/composables/useCommunities";

const route = useRoute();
const slug = route.params.slug as string;
const eventId = route.params.eventId as string;

console.log(eventId);

const event = await $fetch<Event>(`/api/community/${slug}/event/${eventId}`);
</script>
