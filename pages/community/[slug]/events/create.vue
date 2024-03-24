<template>
  <CommunityTemplate moderatorOnly>
    <h2 class="font-dumbledor text-2xl lg:text-3xl my-4 text-center">
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

const start = dayjs().add(1, "hour").format("YYYY-MM-DDTHH:mm");
const end = dayjs().add(2.5, "hour").format("YYYY-MM-DDTHH:mm");

const event = reactive<{
  title: string;
  start: string;
  end: string;
  location_type: "ONLINE" | "IN_PERSON";
  location: string;
  player_count: number | null;
  description: string;
  image: string | null;
  who_can_register: "ANYONE" | "PRIVATE" | "COMMUNITY_MEMBERS";
  storytellers: string[];
  script: string;
  script_id: number | null;
  waitlists: {
    name: string;
    default: boolean;
  }[];
}>({
  title: "",
  description: "",
  start,
  end,
  player_count: null,
  location_type: "ONLINE",
  location: "",
  image: null,
  who_can_register: "COMMUNITY_MEMBERS",
  storytellers: [],
  script: "",
  script_id: null,
  waitlists: [],
});

if (route.query.duplicate) {
  try {
    const previousEvent = await $fetch(
      `/api/community/${slug}/event/${route.query.duplicate}`
    );

    event.title = previousEvent.title;
    event.description = previousEvent.description;
    event.player_count = previousEvent.player_count;
    event.location_type = previousEvent.location_type;
    event.location = previousEvent.location;
    event.image = previousEvent.image;
    event.who_can_register = previousEvent.who_can_register;
    event.storytellers = previousEvent.storytellers;
    event.script = previousEvent.script;
    event.script_id = previousEvent.script_id;
    event.waitlists = previousEvent.waitlists.map((w) => ({
      name: w.name,
      default: w.default,
    }));
  } catch {
    // ignore
  }
}

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
