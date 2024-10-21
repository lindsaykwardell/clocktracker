<template>
  <CommunityTemplate v-slot="{ community, isModerator }">
    <Calendar size="lg" :events="events" @viewChanged="fetchEvents">
      <div v-if="isModerator" class="flex justify-end p-4">
        <Button
          component="nuxt-link"
          :to="`/event/create?slug=${slug}`"
          class="py-2 px-4"
          primary
        >
          Create Event
        </Button>
      </div>
    </Calendar>
  </CommunityTemplate>
</template>

<script setup lang="ts">
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
