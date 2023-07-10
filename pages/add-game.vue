<template>
  <DashboardTemplate>
    <section class="py-6">
      <h2 class="font-piratesbay text-4xl text-center">Add Game</h2>
      <form class="max-w-[1000px] m-auto py-6" @submit.prevent="submitGame">
        <fieldset
          class="flex flex-col md:flex-row gap-5 border rounded border-stone-500 p-4 my-3"
        >
          <legend>Game Setup</legend>
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
          <label>
            <span class="block">Location</span>
            <input
              type="text"
              v-model="location"
              class="block w-full border border-stone-500 rounded-md p-2"
            />
          </label>
          <label>
            <span class="block">Players</span>
            <input
              type="number"
              v-model="playerCount"
              class="block w-full border border-stone-500 rounded-md p-2"
              required
              min="5"
              max="20"
            />
          </label>
        </fieldset>
        <fieldset
          class="flex flex-col md:flex-row gap-5 border rounded border-stone-500 p-4 my-3"
        >
          <legend>Player Setup</legend>
          <label>
            <span class="block">Initial Character</span>
            <input
              type="text"
              list="characters"
              v-model="initialCharacter"
              class="block w-full border border-stone-500 rounded-md p-2"
              required
            />
            <datalist id="characters">
              <option v-for="role in roles" :value="role" :key="role">
                {{ role }}
              </option>
            </datalist>
          </label>
          <label>
            <span class="block">Alignment</span>
            <select
              v-model="alignment"
              class="block w-full border border-stone-500 rounded-md p-2"
            >
              <option value="GOOD">Good</option>
              <option value="EVIL">Evil</option>
            </select>
          </label>
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
const playerCount = ref(0);
const initialCharacter = ref("");
const alignment = ref<"GOOD" | "EVIL">("GOOD");
const final3 = ref("false");
const win = ref("false");
const notes = ref("");
const files = ref<File[]>([]);

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
      player_count: playerCount.value,
      player_characters: [
        {
          name: initialCharacter.value,
          alignment: alignment.value,
        },
      ],
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
