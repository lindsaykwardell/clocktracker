<template>
  <CommunityTemplate moderatorOnly>
    <h2 class="font-dumbledor text-2xl lg:text-3xl mb-4 text-center">
      Edit Event
    </h2>
    <EventEditor
      :event="event"
      :inFlight="inFlight"
      :errors="errors"
      @save="saveEvent"
    />
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
  player_count?: number;
  description: string;
  image?: string;
}>({
  title: existingEvent.title,
  description: existingEvent.description,
  start: dayjs(existingEvent.start).format("YYYY-MM-DDTHH:mm"),
  end: dayjs(existingEvent.end).format("YYYY-MM-DDTHH:mm"),
  player_count: existingEvent.player_count,
  location_type: existingEvent.location_type,
  location: existingEvent.location,
  image: existingEvent.image,
});

const formattedEvent = computed(() => {
  return {
    ...event,
    start: dayjs(event.start).toISOString(),
    end: dayjs(event.end).toISOString(),
  };
});

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
</script>

<style scoped>
input,
select {
  height: 2.5rem;
  @apply text-black;
}
</style>
