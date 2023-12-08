<template>
  <CommunityTemplate moderatorOnly>
    <h2 class="font-dumbledor text-2xl lg:text-3xl mb-4">Create Event</h2>
    <form
      class="max-w-[1000px] m-auto py-6 flex flex-col gap-4"
      @submit.prevent="createEvent"
    >
      <label>
        <span class="block">Title</span>
        <input
          v-model="event.title"
          class="block w-full border border-stone-500 rounded-md p-2"
          required
        />
      </label>
      <div class="flex gap-4">
        <label class="flex-1">
          <span class="block">Start Date</span>
          <input
            v-model="event.start"
            type="datetime-local"
            class="block w-full border border-stone-500 rounded-md p-2"
            required
          />
        </label>
        <label class="flex-1">
          <span class="block">End Date</span>
          <input
            v-model="event.end"
            type="datetime-local"
            class="block w-full border border-stone-500 rounded-md p-2"
            required
          />
        </label>
        <label class="flex-1">
          <span class="block">Location Type</span>
          <select
            v-model="event.location_type"
            class="block w-full border border-stone-500 rounded-md p-2"
          >
            <option value="ONLINE">Online</option>
            <option value="IN_PERSON">In Person</option>
          </select>
        </label>
        <label v-if="event.location_type === 'IN_PERSON'" class="flex-1">
          <span class="block">Location</span>
          <input
            type="text"
            v-model="event.location"
            class="block w-full border border-stone-500 rounded-md p-2"
            list="locations"
          />
          <datalist id="locations">
            <option v-for="location in myLocations" :value="location"></option>
          </datalist>
        </label>
        <label class="flex-1">
          <span class="block">Player Count</span>
          <input
            v-model="event.player_count"
            type="number"
            max="20"
            min="5"
            class="block w-full border border-stone-500 rounded-md p-2"
          />
        </label>
      </div>
      <label>
        <span class="block">Description</span>
        <textarea
          v-model="event.description"
          class="block w-full border border-stone-500 rounded-md p-2 text-black"
          rows="5"
        ></textarea>
      </label>
      <button
        type="submit"
        id="save-game"
        class="w-full bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-4"
        :disabled="inFlight"
      >
        <template v-if="inFlight">
          <Spinner />
          Saving...
        </template>
        <template v-else>Create New Event</template>
      </button>
      <template v-if="errors">
        <div class="text-red-500 text-center">{{ errors }}</div>
      </template>
    </form>
  </CommunityTemplate>
</template>

<script setup lang="ts">
import dayjs from "dayjs";

const user = useSupabaseUser();
const router = useRouter();
const route = useRoute();
const users = useUsers();
const games = useGames();

const slug = route.params.slug as string;

const me = computed(() => users.getUserById(user.value?.id));

definePageMeta({
  middleware: "community-admin",
});

const start = dayjs().format("YYYY-MM-DDTHH:mm");
const end = dayjs().add(1.5, "hour").format("YYYY-MM-DDTHH:mm");

const event = reactive({
  title: "",
  description: "",
  start,
  end,
  player_count: undefined,
  location_type: "ONLINE",
  location: "",
});

const formattedEvent = computed(() => {
  return {
    ...event,
    start: dayjs(event.start).toISOString(),
    end: dayjs(event.end).toISOString(),
  };
});

const myLocations = computed(() => {
  if (me.value.status === Status.SUCCESS) {
    return games.getLocationsByPlayer(me.value.data.username);
  }
  return [];
});

const inFlight = ref(false);
const errors = ref("");

async function createEvent() {
  inFlight.value = true;
  errors.value = "";
  try {
    const saved = await $fetch(`/api/community/${slug}/events/new`, {
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

<style scoped>
input,
select {
  height: 2.5rem;
  @apply text-black;
}
</style>
