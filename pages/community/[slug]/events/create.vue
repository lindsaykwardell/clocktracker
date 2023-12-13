<template>
  <CommunityTemplate moderatorOnly>
    <h2 class="font-dumbledor text-2xl lg:text-3xl mb-4 text-center">
      Create Event
    </h2>
    <EventEditor
      :event="event"
      :inFlight="inFlight"
      :errors="errors"
      @save="createEvent"
    />
  </CommunityTemplate>
</template>

<script setup lang="ts">
import dayjs from "dayjs";

const router = useRouter();
const route = useRoute();

const slug = route.params.slug as string;

definePageMeta({
  middleware: "community-admin",
});

const start = dayjs().format("YYYY-MM-DDTHH:mm");
const end = dayjs().add(1.5, "hour").format("YYYY-MM-DDTHH:mm");

const event = reactive<{
  title: string;
  start: string;
  end: string;
  location_type: "ONLINE" | "IN_PERSON";
  location: string;
  player_count: number | null;
  description: string;
  image: string | null;
}>({
  title: "",
  description: "",
  start,
  end,
  player_count: null,
  location_type: "ONLINE",
  location: "",
  image: null,
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

async function createEvent() {
  inFlight.value = true;
  errors.value = "";
  try {
    const saved = await $fetch(`/api/community/${slug}/event`, {
      method: "POST",
      body: JSON.stringify(formattedEvent.value),
    });

    if (saved) {
      router.push(`/community/${slug}/event/${saved.id}`);
    }
  } catch (err) {
    errors.value = (err as any).statusMessage;
  }
}
</script>
