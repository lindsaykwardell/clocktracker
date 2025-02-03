<template>
  <component :is="template" moderatorOnly :slug="slug">
    <template v-if="!slug || community_id">
      <h2 class="font-sorts text-2xl lg:text-3xl my-4 text-center">
        Create Event
      </h2>
      <EventEditor
        :event="event"
        :inFlight="inFlight"
        :errors="errors"
        @save="createEvent"
      />
    </template>
  </component>
</template>

<script setup lang="ts">
import dayjs from "dayjs";

const router = useRouter();
const route = useRoute();
const communities = useCommunities();

definePageMeta({
  middleware: "community-admin",
});

const start = dayjs().add(1, "hour").format("YYYY-MM-DDTHH:mm");
const end = dayjs().add(2.5, "hour").format("YYYY-MM-DDTHH:mm");

let slug = route.query.slug as string | undefined;

const community_id = computed(() => {
  const community = communities.getCommunity(slug || "");

  if (community.status === Status.SUCCESS) {
    return community.data.id;
  } else {
    return null;
  }
});

const event = reactive<{
  community_id: number | null;
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
  game_link: string | null;
  waitlists: {
    name: string;
    default: boolean;
  }[];
}>({
  community_id: community_id.value,
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
  game_link: null,
  waitlists: [],
});

if (route.query.duplicate) {
  try {
    const previousEvent = await $fetch(`/api/event/${route.query.duplicate}`);

    event.community_id = previousEvent.community_id;
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
    event.game_link = previousEvent.game_link;
    event.waitlists = previousEvent.waitlists.map((w) => ({
      name: w.name,
      default: w.default,
    }));
    event.start = dayjs(previousEvent.start).format("YYYY-MM-DDTHH:mm");
    event.end = dayjs(previousEvent.end).format("YYYY-MM-DDTHH:mm");
  } catch {
    // ignore
  }
}

const standardTemplate = resolveComponent("StandardTemplate");
const communityTemplate = resolveComponent("CommunityTemplate");

const template = computed(() => {
  if (event.community_id) {
    return communityTemplate;
  }

  return standardTemplate;
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
    const saved = await $fetch(`/api/event`, {
      method: "POST",
      body: JSON.stringify(formattedEvent.value),
    });

    if (saved) {
      router.push(`/event/${saved.id}`);
    }
  } catch (err) {
    errors.value = (err as any).statusMessage;
  }
}

watch(community_id, () => {
  event.community_id = community_id.value;
});

onMounted(() => {
  if (slug && !community_id.value) {
    communities.fetchCommunity(slug);
  }
});
</script>
