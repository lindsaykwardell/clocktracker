<template>
  <DashboardTemplate>
    <section class="py-6">
      <h2 class="font-piratesbay text-4xl text-center">Add Game</h2>
      <form class="max-w-[1000px] m-auto py-6" @submit.prevent="submitGame">
        <fieldset
          class="flex flex-col flex-wrap md:flex-row gap-5 border rounded border-stone-500 p-4 my-3"
        >
          <legend>Game Setup</legend>
          <div class="w-full flex flex-col md:flex-row gap-5">
            <label>
              <span class="block">Date</span>
              <input
                type="date"
                v-model="date"
                class="block w-full border border-stone-500 rounded-md p-2"
                required
              />
            </label>
            <label>
              <span class="block">Script</span>
              <input
                type="text"
                list="scripts"
                v-model="script"
                class="block w-full border border-stone-500 rounded-md p-2"
                required
              />
              <datalist id="scripts">
                <option
                  v-for="script in baseScripts"
                  :value="script"
                  :key="script"
                >
                  {{ script }}
                </option>
              </datalist>
            </label>
          </div>
          <label>
            <span class="block">Location Type</span>
            <select
              v-model="locationType"
              class="block w-full border border-stone-500 rounded-md p-2"
            >
              <option value="ONLINE">Online</option>
              <option value="IN_PERSON">In Person</option>
            </select>
          </label>
          <label v-if="locationType === 'IN_PERSON'">
            <span class="block">Location</span>
            <input
              type="text"
              v-model="location"
              class="block w-full border border-stone-500 rounded-md p-2"
            />
          </label>
          <label>
            <span class="block">Community</span>
            <input
              type="text"
              v-model="community"
              class="block w-full border border-stone-500 rounded-md p-2"
            />
          </label>
          <label>
            <span class="block">Players</span>
            <input
              type="number"
              v-model="playerCount"
              class="block w-full border border-stone-500 rounded-md p-2"
              min="5"
              max="20"
            />
          </label>
        </fieldset>
        <fieldset
          class="flex flex-col items-end gap-5 border rounded border-stone-500 p-4 my-3"
        >
          <legend>Player Setup</legend>
          <datalist id="characters">
            <option v-for="role in roles" :value="role" :key="role">
              {{ role }}
            </option>
          </datalist>
          <div
            v-for="(character, i) in characters"
            class="w-full flex flex-col md:flex-row gap-5 items-end"
          >
            <button v-if="i !== 0" @click.prevent.stop="removeCharacter(i)">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 512 512"
              >
                <path
                  d="M400 113.3h-80v-20c0-16.2-13.1-29.3-29.3-29.3h-69.5C205.1 64 192 77.1 192 93.3v20h-80V128h21.1l23.6 290.7c0 16.2 13.1 29.3 29.3 29.3h141c16.2 0 29.3-13.1 29.3-29.3L379.6 128H400v-14.7zm-193.4-20c0-8.1 6.6-14.7 14.6-14.7h69.5c8.1 0 14.6 6.6 14.6 14.7v20h-98.7v-20zm135 324.6v.8c0 8.1-6.6 14.7-14.6 14.7H186c-8.1 0-14.6-6.6-14.6-14.7v-.8L147.7 128h217.2l-23.3 289.9z"
                  fill="currentColor"
                />
                <path d="M249 160h14v241h-14z" fill="currentColor" />
                <path d="M320 160h-14.6l-10.7 241h14.6z" fill="currentColor" />
                <path d="M206.5 160H192l10.7 241h14.6z" fill="currentColor" />
              </svg>
            </button>
            <div v-else class="w-8"></div>
            <label>
              <span class="block">
                <template v-if="i === 0">Initial Character</template>
                <template v-else-if="i + 1 === characters.length">
                  End Character
                </template>
                <template v-else>Additional Character</template>
              </span>
              <input
                type="text"
                list="characters"
                v-model="character.name"
                class="block w-full border border-stone-500 rounded-md p-2"
                required
              />
            </label>
            <label>
              <span class="block">Alignment</span>
              <select
                v-model="character.alignment"
                class="block w-full border border-stone-500 rounded-md p-2"
              >
                <option value="GOOD">Good</option>
                <option value="EVIL">Evil</option>
              </select>
            </label>
            <label
              v-if="character.showRelated === false"
              class="flex-shrink flex items-center gap-2"
            >
              <input type="checkbox" v-model="character.showRelated" />
              <span class="block">Related to...</span>
            </label>
            <label v-else>
              <span class="block"> Related Character </span>
              <input
                type="text"
                list="characters"
                v-model="character.related"
                class="block w-full border border-stone-500 rounded-md p-2"
                required
              />
            </label>
          </div>
          <button @click.prevent.stop="addCharacter">Add Character</button>
        </fieldset>
        <fieldset
          class="flex flex-col md:flex-row gap-5 border rounded border-stone-500 p-4 my-3"
        >
          <legend>Game Results</legend>
          <label>
            <span class="block">Final 3?</span>
            <select
              v-model="final3"
              class="block w-full border border-stone-500 rounded-md p-2"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
          <label>
            <span class="block">Win?</span>
            <select
              v-model="win"
              class="block w-full border border-stone-500 rounded-md p-2"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
        </fieldset>
        <fieldset class="border rounded border-stone-500 p-4 my-3">
          <legend>Notes</legend>
          <textarea
            v-model="notes"
            class="block w-full border border-stone-500 rounded-md p-2"
            rows="5"
          ></textarea>
        </fieldset>
        <fieldset class="border rounded border-stone-500 p-4 my-3">
          <legend>Images</legend>
          <div class="flex flex-col gap-5">
            <button
              type="button"
              @click="uploadFile"
              class="block w-full bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded"
            >
              Select Images
            </button>
            <div class="flex flex-wrap gap-5">
              <div v-for="file in displayFiles" :key="file.name">
                <span class="block">{{ file.name }}</span>
                <img :src="file.url" class="w-64 h-64 object-cover" />
                <button @click="removeFile(file.name)">Remove</button>
              </div>
            </div>
          </div>
        </fieldset>
        <button
          type="submit"
          class="w-full bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-4"
          :disabled="inFlight"
        >
          <template v-if="inFlight">
            <svg
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Saving...
          </template>
          <template v-else>Add Game</template>
        </button>
      </form>
    </section>
  </DashboardTemplate>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { v4 as uuid } from "uuid";

definePageMeta({
  middleware: "auth",
});

useHead({
  title: "Add Game",
});

const router = useRouter();
const { roles } = useRoles();
const { baseScripts } = useScripts();
const supabase = useSupabaseClient();
const inFlight = ref(false);

// Generate bindings for the v-model to connect to for the above inputs
const date = ref("");
const script = ref("");
const locationType = ref<"ONLINE" | "IN_PERSON">("ONLINE");
const location = ref("");
const community = ref("");
const playerCount = ref(null);
const characters = reactive<
  {
    name: string;
    alignment: "GOOD" | "EVIL";
    related: string;
    showRelated: boolean;
  }[]
>([
  {
    name: "",
    alignment: "GOOD",
    related: "",
    showRelated: false,
  },
]);
const final3 = ref("false");
const win = ref("false");
const notes = ref("");
const files = ref<File[]>([]);

function addCharacter() {
  characters.push({
    name: "",
    alignment: characters[0].alignment,
    related: "",
    showRelated: false,
  });
}

function removeCharacter(i: number) {
  characters.splice(i, 1);
}

function uploadFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.accept = "image/jpg, image/jpeg, image/png";
  input.onchange = selectFiles;
  input.click();
}

function selectFiles(event: Event) {
  const uploadedFiles = (event.target as HTMLInputElement).files;
  if (!uploadedFiles) return;

  files.value = Array.from(uploadedFiles);
}

const displayFiles = computed(() =>
  files.value.map((file) => ({
    name: file.name,
    url: URL.createObjectURL(file),
  }))
);

function removeFile(name: string) {
  files.value = files.value.filter((file) => file.name !== name);
}

async function submitGame() {
  inFlight.value = true;

  // Upload images to Supabase
  const urls = [];

  for (const file of files.value) {
    const { data, error } = await supabase.storage
      .from("game-attachments")
      .upload(`${uuid()}`, file);

    if (error) {
      inFlight.value = false;
      throw error;
    }

    urls.push(data?.path);
  }

  const { error } = await useFetch("/api/games", {
    method: "POST",
    body: JSON.stringify({
      date: dayjs(date.value).toISOString(),
      script: script.value,
      location_type: locationType.value,
      location: location.value,
      community: community.value,
      player_count: playerCount.value,
      player_characters: characters.map((character) => ({
        name: character.name,
        alignment: character.alignment,
        related: character.related,
      })),
      final3: final3.value === "true",
      win: win.value === "true",
      notes: notes.value,
      image_urls: urls,
    }),
  });

  if (error.value) {
    inFlight.value = false;
    console.error(error.value);
  } else {
    router.push("/");
  }
}
</script>

<style scoped>
input,
select {
  color: black;
  height: 2.5rem;
}

textarea {
  color: black;
}

label {
  flex: 1 1 0%;
}
</style>
