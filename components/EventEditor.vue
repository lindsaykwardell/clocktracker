<template>
  <form
    class="max-w-[1000px] m-auto py-6 flex flex-col gap-4"
    @submit.prevent="emit('save', event)"
  >
    <div class="flex gap-4">
      <label class="flex-grow">
        <span class="block">Title</span>
        <Input v-model="event.title" required />
      </label>
      <label>
        <span class="flex gap-2 items-top"
          >Who Can Register
          <span
            v-tooltip="{
              content:
                '<div class=\'w-[250px]\'>If \'Anyone with the event link\' is chosen, the event will not appear anywhere on the site.</div>',
              html: true,
            }"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              class="w-4 h-4"
            >
              <path
                fill="currentColor"
                d="M11 17h2v-6h-2zm1-8q.425 0 .713-.288T13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9m0 13q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"
              />
            </svg>
          </span>
        </span>
        <Input mode="select" v-model="event.who_can_register">
          <option value="COMMUNITY_MEMBERS">
            <template v-if="event.community_id"> Community Members </template>
            <template v-else>Friends only</template>
          </option>
          <option value="PRIVATE">Anyone with the event link</option>
          <option value="ANYONE">Anyone</option>
        </Input>
      </label>
    </div>
    <div class="flex gap-4">
      <label class="flex-1">
        <span class="block">Start Date</span>
        <Input v-model="event.start" type="datetime-local" required />
      </label>
      <label class="flex-1">
        <span class="block">End Date</span>
        <Input v-model="event.end" type="datetime-local" required />
      </label>
      <label class="flex-1">
        <span class="block">Location Type</span>
        <Input mode="select" v-model="event.location_type">
          <option value="ONLINE">Online</option>
          <option value="IN_PERSON">In Person</option>
        </Input>
      </label>
      <label v-if="event.location_type === 'IN_PERSON'" class="flex-1">
        <span class="block">Location</span>
        <Input type="text" v-model="event.location" list="locations" />
        <datalist id="locations">
          <option v-for="location in myLocations" :value="location"></option>
        </datalist>
      </label>
      <label class="flex-1">
        <span class="block">Player Count</span>
        <Input v-model="event.player_count" type="number" max="20" min="5" />
      </label>
    </div>
    <div class="flex gap-4">
      <label class="flex-1">
        <span class="block">Game Link</span>
        <Input
          v-model="event.game_link"
          type="text"
          placeholder="https://online.bloodontheclocktower.com/join/12345"
          pattern="[Hh][Tt][Tt][Pp][Ss]?:\/\/(?:(?:[a-zA-Z\u00a1-\uffff0-9]+-?)*[a-zA-Z\u00a1-\uffff0-9]+)(?:\.(?:[a-zA-Z\u00a1-\uffff0-9]+-?)*[a-zA-Z\u00a1-\uffff0-9]+)*(?:\.(?:[a-zA-Z\u00a1-\uffff]{2,}))(?::\d{2,5})?(?:\/[^\s]*)?"
          title="Please enter a valid URL"
        />
      </label>
    </div>
    <div class="flex gap-4">
      <label class="flex-1 flex flex-col gap-2">
        <span class="block">Storytellers</span>
        <div class="flex flex-col gap-1">
          <div
            v-for="(_, index) in event.storytellers"
            :key="index"
            class="flex gap-1"
          >
            <Input v-model="event.storytellers[index]" type="text" />
            <Button
              type="button"
              @click="event.storytellers.splice(index, 1)"
              color="negative"
              icon="x-lg"
              display="icon-only"
              :title="`Remove ${event.storytellers[index]} as storyteller`"
            >
              Remove
            </Button>
          </div>
        </div>
        <div>
          <Button @click="event.storytellers.push('')" type="button" size="small" icon="person-plus">
            Add Storyteller
          </Button>
        </div>
      </label>
      <label class="flex-1">
        <span class="block">Script</span>
        <div class="flex items-center gap-1">
          <div v-if="event.script" class="flex-grow">{{ event.script }}</div>
          <!-- @todo Update button -->
          <Button
            type="button"
            id="select-script"
            @click="showScriptDialog = !showScriptDialog"
            :class="{
              'w-full': !event.script,
              'flex-shrink': event.script,
            }"
            font-size="md"
          >
            <div class="w-[30px] overflow-hidden">
              <img src="/img/role/investigator.png" />
            </div>
            <template v-if="event.script === ''">Select Script</template>
          </Button>
        </div>
        <SelectScriptDialog
          v-model:visible="showScriptDialog"
          @selectScript="selectScript"
        />
      </label>
    </div>
    <label>
      <span class="block">Description</span>
      <Input mode="textarea" v-model="event.description" rows="5" />
    </label>
    <div>
      <label class="flex flex-col gap-2">
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
          class="flex items-center gap-1"
        >
          <label class="flex items-center gap-1">
            Default
            <input
              type="checkbox"
              v-model="waitlist.default"
              @click="ensureOneDefaultWaitlist(index)"
            />
          </label>
          <div class="flex-grow flex gap-1">
            <Input v-model="waitlist.name" type="text" />
            <Button
              type="button"
              @click.stop.prevent="event.waitlists.splice(index, 1)"
              icon="x-lg"
              display="icon-only"
              color="negative"
              class="flex-grow"
              :title="`Remove ${waitlist.name}`"
            >
              Remove
            </Button>
          </div>
        </div>
        <div>
          <Button
            type="button"
            @click="event.waitlists.push({ name: '', default: false })"
            icon="plus-lg"
            size="small"
          >
            Add Waitlist
          </Button>
        </div>
      </label>
    </div>
    <div>
      <span class="block">Image</span>
      <img
        v-if="event.image"
        :src="event.image"
        class="m-auto w-full md:w-[600px] object-cover h-[250px] mb-4"
      />
      <Button
        type="button"
        @click="uploadFile"
        icon="upload"
        size="small"
      >
        Upload Image
      </Button>
      <Button
        v-if="event.image"
        type="button"
        @click="removeFile"
        color="negative"
        icon="x"
        size="small"
      >
        Remove Image
      </Button>
    </div>
    <div class="flex flex-col items-center">
      <Button type="submit" id="save-game" :disabled="inFlight" color="primary" wide>
        <template v-if="inFlight">
          <Spinner />
          Saving...
        </template>
        <template v-else>Save Event</template>
      </Button>
    </div>
    <template v-if="errors">
      <div class="text-red-500 text-center">{{ errors }}</div>
    </template>
  </form>
</template>

<script setup lang="ts">
import dayjs from "dayjs";

const props = defineProps<{
  event: {
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
  const uploadedFiles = (e.target as HTMLInputElement).files;
  if (!uploadedFiles) return;

  const file = Array.from(uploadedFiles)[0];

  const formData = new FormData();
  formData.append("file", file);

  const data = await $fetch(`/api/storage/events`, {
    method: "POST",
    body: formData,
  });

  props.event.image = data[0];
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
