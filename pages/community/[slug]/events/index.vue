<template>
  <CommunityTemplate v-slot="{ community, isModerator }">
    <Calendar size="lg" :events="events" @viewChanged="fetchEvents" />
    <div v-if="isModerator" class="flex justify-end p-4">
      <nuxt-link
        :to="`/community/${community.data.slug}/events/create`"
        class="bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-4"
      >
        Create Event
      </nuxt-link>
    </div>
  </CommunityTemplate>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import type { Event } from "~/composables/useCommunities";

const route = useRoute();
const slug = route.params.slug as string;

const events = ref<Event[]>([]);

async function fetchEvents({ year, month }: { year: number; month: number }) {
  events.value = await $fetch<Event[]>(
    `/api/community/${slug}/events/calendar/${year}/${month}`
  );
}
</script>
