<template>
  <form
    class="max-w-[1000px] m-auto py-6 flex flex-col gap-4"
    @submit.prevent="emit('save', event)"
  >
    <div class="flex gap-4">
      <label class="flex-grow">
        <span class="block">Title</span>
        <input
          v-model="event.title"
          class="block w-full border border-stone-500 rounded-md p-2"
          required
        />
      </label>
      <label>
        <span class="block">Who Can Register</span>
        <select
          v-model="event.who_can_register"
          class="block w-full border border-stone-500 rounded-md p-2"
        >
          <option value="COMMUNITY_MEMBERS">Community Members</option>
          <option value="ANYONE">Anyone</option>
        </select>
      </label>
    </div>
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
    <label>
      <span class="block">Image</span>
      <img
        v-if="event.image"
        :src="event.image"
        class="m-auto w-full md:w-[600px] object-cover h-[250px]"
      />
      <button
        type="button"
        @click="uploadFile"
        class="block w-full transition duration-150 text-white font-bold py-2 px-4 rounded"
      >
        Upload Image
      </button>
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
      <template v-else>Save Event</template>
    </button>
    <template v-if="errors">
      <div class="text-red-500 text-center">{{ errors }}</div>
    </template>
  </form>
</template>

<script setup lang="ts">
import { v4 as uuid } from "uuid";

const props = defineProps<{
  event: {
    title: string;
    start: string;
    end: string;
    location_type: "ONLINE" | "IN_PERSON";
    location: string;
    player_count: number | null;
    description: string;
    image: string | null;
    who_can_register: "ANYONE" | "COMMUNITY_MEMBERS";
  };
  inFlight: boolean;
  errors: string;
}>();

const emit = defineEmits(["save"]);

const user = useSupabaseUser();
const users = useUsers();
const games = useGames();

const me = computed(() => users.getUserById(user.value?.id));

const myLocations = computed(() => {
  if (me.value.status === Status.SUCCESS) {
    return games.getLocationsByPlayer(me.value.data.username);
  }
  return [];
});

function uploadFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/jpg, image/jpeg, image/png";
  input.onchange = selectFiles;
  input.click();
}

async function selectFiles(e: Event) {
  const supabase = useSupabaseClient();
  const config = useRuntimeConfig();
  const uploadedFiles = (e.target as HTMLInputElement).files;
  if (!uploadedFiles) return;

  const file = Array.from(uploadedFiles)[0];

  const { data, error } = await supabase.storage
    .from("events")
    .upload(`${uuid()}`, file);

  if (error) {
    throw error;
  }

  props.event.image = `${config.public.supabase.url}/storage/v1/object/public/events/${data.path}`;
}
</script>

<style scoped>
input,
select {
  height: 2.5rem;
  @apply text-lg bg-stone-600 text-white;

  &:disabled {
    @apply bg-stone-700;
  }
}

textarea {
  @apply text-lg bg-stone-600 text-white;
}
</style>
