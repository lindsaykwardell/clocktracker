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
          <option value="PRIVATE">Anyone with the event link</option>
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
    <div class="flex gap-4">
      <label class="flex-1">
        <span class="block">Game Link</span>
        <input
          v-model="event.game_link"
          type="text"
          class="block w-full border border-stone-500 rounded-md p-2"
          placeholder="https://online.bloodontheclocktower.com/join/12345"
          pattern="[Hh][Tt][Tt][Pp][Ss]?:\/\/(?:(?:[a-zA-Z\u00a1-\uffff0-9]+-?)*[a-zA-Z\u00a1-\uffff0-9]+)(?:\.(?:[a-zA-Z\u00a1-\uffff0-9]+-?)*[a-zA-Z\u00a1-\uffff0-9]+)*(?:\.(?:[a-zA-Z\u00a1-\uffff]{2,}))(?::\d{2,5})?(?:\/[^\s]*)?"
          title="Please enter a valid URL"
        />
      </label>
    </div>
    <div class="flex gap-4">
      <label class="flex-1">
        <span class="block">Storytellers</span>
        <div class="flex flex-col gap-1">
          <div
            v-for="(_, index) in event.storytellers"
            :key="index"
            class="flex gap-1"
          >
            <input
              v-model="event.storytellers[index]"
              type="text"
              class="block w-full border border-stone-500 rounded-md p-2"
            />
            <button
              type="button"
              @click="event.storytellers.splice(index, 1)"
              class="transition duration-150 text-white font-bold py-2 px-4 rounded"
            >
              Remove
            </button>
          </div>
        </div>
        <button @click="event.storytellers.push('')" type="button">
          Add Storyteller
        </button>
      </label>
      <label class="flex-1">
        <span class="block">Script</span>
        <div class="flex items-center gap-1">
          <div v-if="event.script" class="flex-grow">{{ event.script }}</div>
          <button
            type="button"
            id="select-script"
            @click="showScriptDialog = !showScriptDialog"
            class="flex gap-1 bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-1 px-4 rounded justify-center items-center"
            :class="{
              'w-full': !event.script,
              'flex-shrink': event.script,
            }"
          >
            <div class="w-[30px] overflow-hidden">
              <img src="/img/role/investigator.png" />
            </div>
            <template v-if="event.script === ''">Select Script</template>
          </button>
        </div>
        <SelectScriptDialog
          v-model:visible="showScriptDialog"
          @selectScript="selectScript"
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
    <div>
      <label>
        <span class="block">Waitlists</span>
        <div
          v-if="event.waitlists.length <= 0"
          class="italic text-stone-400 text-sm"
        >
          By default, users will be automatically added to a waitlist if the
          event is full. You can customize this behavior by adding waitlists.
        </div>
        <div
          v-for="(waitlist, index) in event.waitlists"
          :key="index"
          class="flex items-center"
        >
          <label class="flex items-center">
            Default
            <input
              type="checkbox"
              v-model="waitlist.default"
              @click="ensureOneDefaultWaitlist(index)"
              class="m-2"
            />
          </label>
          <input
            v-model="waitlist.name"
            type="text"
            class="block flex-grow border border-stone-500 rounded-md p-2"
          />
          <button
            type="button"
            @click.stop.prevent="event.waitlists.splice(index, 1)"
            class="block transition duration-150 text-white font-bold py-2 px-4 rounded"
          >
            Remove
          </button>
        </div>
        <button
          type="button"
          @click="event.waitlists.push({ name: '', default: false })"
          class="transition duration-150 text-white font-bold py-2 px-4 rounded"
        >
          Add Waitlist
        </button>
      </label>
    </div>
    <div>
      <span class="block">Image</span>
      <img
        v-if="event.image"
        :src="event.image"
        class="m-auto w-full md:w-[600px] object-cover h-[250px]"
      />
      <Button
        type="button"
        @click="uploadFile"
        tertiary
        class="w-full mt-2"
        font-size="md"
      >
        Upload Image
      </Button>
      <Button
        v-if="event.image"
        type="button"
        @click="removeFile"
        tertiary
        class="w-full mt-2"
        font-size="sm"
      >
        Remove Image
      </Button>
    </div>
    <Button type="submit" id="save-game" :disabled="inFlight" primary>
      <template v-if="inFlight">
        <Spinner />
        Saving...
      </template>
      <template v-else>Save Event</template>
    </Button>
    <template v-if="errors">
      <div class="text-red-500 text-center">{{ errors }}</div>
    </template>
  </form>
</template>

<script setup lang="ts">
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";

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
    who_can_register: "ANYONE" | "PRIVATE" | "COMMUNITY_MEMBERS";
    storytellers: string[];
    script: string;
    script_id: number | null;
    game_link: string | null;
    waitlists: {
      id?: number;
      name: string;
      default: boolean;
    }[];
  };
  inFlight: boolean;
  errors: string;
}>();

const emit = defineEmits(["save"]);

const user = useSupabaseUser();
const users = useUsers();
const games = useGames();
const showScriptDialog = ref(false);

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

function removeFile() {
  props.event.image = null;
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

watchEffect(() => {
  // This is possible because of how the input works.
  // @ts-ignore
  if (props.event.player_count === "") {
    props.event.player_count = null;
  }
});

function ensureOneDefaultWaitlist(index: number) {
  props.event.waitlists.forEach((waitlist, i) => {
    if (i !== index) {
      waitlist.default = false;
    }
  });
}

watchEffect(() => {
  if (props.event.start && props.event.end) {
    const start = dayjs(props.event.start);
    const end = dayjs(props.event.end);
    if (start > end) {
      props.event.end = props.event.start;
    }
  }
});

watchEffect(() => {
  console.log(props.event.storytellers);
  if (props.event.storytellers?.length === 0) {
    props.event.storytellers.push("");
  }
});

function selectScript(script: { name: string; id: number | null }) {
  props.event.script = script.name;
  props.event.script_id = script.id;
  showScriptDialog.value = false;
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
