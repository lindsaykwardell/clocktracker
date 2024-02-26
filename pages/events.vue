<template>
  <StandardTemplate>
    <template v-if="events.length">
      <section class="flex flex-col gap-2 items-center">
        <h1 class="text-3xl font-bold mb-8 font-dumbledor py-4">
          My Upcoming Events
        </h1>
        <div class="w-full md:w-[600px] flex flex-col gap-4">
          <nuxt-link
            v-for="event in events"
            :to="`/community/${event.community.slug}/event/${event.id}`"
            class="w-full md:w-[600px]"
          >
            <EventCard :event="event" />
          </nuxt-link>
        </div>
      </section>
    </template>
  </StandardTemplate>
</template>

<script setup lang="ts">
import type { Event } from "~/composables/useCommunities";

const events = await $fetch<(Event & { community: { slug: string } })[]>(
  "/api/events"
);
</script>
