<template>
  <form class="max-w-[1000px] m-auto py-6" @submit.prevent="emit('submit')">
    <fieldset
      class="flex flex-col flex-wrap md:flex-row gap-5 border rounded border-stone-500 p-4 my-3"
    >
      <legend>Game Setup</legend>
      <div class="w-full flex flex-col md:flex-row gap-5">
        <label class="flex-1">
          <span class="block">Date</span>
          <input
            type="date"
            v-model="game.date"
            class="block w-full border border-stone-500 rounded-md p-2"
            required
          />
        </label>
        <label class="flex-1">
          <span class="block">Script</span>
          <div class="flex items-center gap-1">
            <div v-if="game.script" class="flex-grow">{{ game.script }}</div>
            <button
              type="button"
              @click="showScriptDialog = !showScriptDialog"
              class="flex gap-1 bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded justify-center items-center"
              :class="{
                'w-full': !game.script,
                'flex-shrink': game.script,
              }"
            >
              <div class="w-[30px] overflow-hidden">
                <img src="/img/role/investigator.png" />
              </div>
              <template v-if="game.script === ''">Find Script</template>
            </button>
          </div>
          <Dialog v-model:visible="showScriptDialog">
            <template #title>
              <h2 class="text-2xl font-bold font-dumbledor">Find Script</h2>
            </template>
            <section class="p-4">
              <div class="relative">
                <form @submit.prevent="searchScripts">
                  <input
                    v-model="potentialScript"
                    class="block w-full border border-stone-500 rounded-md p-2 text-lg bg-stone-600"
                    placeholder="Search for a player, then press enter"
                  />
                </form>
                <button
                  type="button"
                  @click="searchScripts"
                  class="absolute right-2 -top-3 w-16 h-16"
                >
                  <img src="/img/role/investigator.png" />
                </button>
              </div>
              <ul class="py-2">
                <li
                  v-for="script in scripts"
                  class="px-1 py-2 hover:bg-stone-800"
                >
                  <button
                    type="button"
                    @click="selectScript(script)"
                    class="w-full text-left"
                  >
                    {{ script.name }}
                  </button>
                </li>
                <li
                  class="px-1 py-2 hover:bg-stone-800"
                  v-if="
                    potentialScript &&
                    !scripts.find((script) => script.name === potentialScript)
                  "
                >
                  <button
                    type="button"
                    @click="selectScript({ name: potentialScript, id: null })"
                    class="w-full text-left"
                  >
                    {{ potentialScript }} (Use custom script)
                  </button>
                </li>
              </ul>
            </section>
          </Dialog>
        </label>
        <label class="flex-1">
          <span class="block">Storyteller</span>
          <input
            type="text"
            v-model="game.storyteller"
            class="block w-full border border-stone-500 rounded-md p-2"
          />
        </label>
      </div>
      <label class="flex-1">
        <span class="block">Location Type</span>
        <select
          v-model="game.location_type"
          class="block w-full border border-stone-500 rounded-md p-2"
        >
          <option value="ONLINE">Online</option>
          <option value="IN_PERSON">In Person</option>
        </select>
      </label>
      <label v-if="game.location_type === 'IN_PERSON'" class="flex-1">
        <span class="block">Location</span>
        <input
          type="text"
          v-model="game.location"
          class="block w-full border border-stone-500 rounded-md p-2"
        />
      </label>
      <label class="flex-1">
        <span class="block">Community</span>
        <input
          type="text"
          v-model="game.community"
          class="block w-full border border-stone-500 rounded-md p-2"
        />
      </label>
      <label class="flex-1">
        <span class="block">Players</span>
        <input
          type="number"
          v-model="game.player_count"
          class="block w-full border border-stone-500 rounded-md p-2"
          min="5"
          max="20"
        />
      </label>
      <label class="flex-1">
        <span class="block">Travelers</span>
        <input
          type="number"
          v-model="game.traveler_count"
          class="block w-full border border-stone-500 rounded-md p-2"
          min="0"
        />
      </label>
    </fieldset>
    <fieldset
      class="flex flex-col items-end gap-5 border rounded border-stone-500 p-4 my-3"
    >
      <legend>Player Setup</legend>
      <div
        v-for="(character, i) in game.player_characters"
        class="w-full flex flex-wrap md:flex-nowrap gap-5 items-end"
      >
        <button type="button" v-if="i !== 0" @click="removeCharacter(i)">
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
        <div v-else class="hidden md:block w-8"></div>
        <label
          class="flex-grow md:flex-1"
          :class="{
            'w-full': i === 0,
          }"
        >
          <span class="block">
            <template v-if="i === 0">Initial Character</template>
            <template v-else-if="i + 1 === game.player_characters.length">
              End Character
            </template>
            <template v-else>Additional Character</template>
          </span>
          <select
            v-model="character.name"
            @change="setCharacterDetails(character, $event)"
            class="block w-full border border-stone-500 rounded-md p-2"
            required
          >
            <option value="">Select a Character</option>
            <option v-for="role in orderedRoles" :value="role.name">
              {{ role.name }}
            </option>
          </select>
        </label>
        <label class="w-1/3 md:w-auto flex-shrink">
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
        <label v-else class="flex-1">
          <span class="block"> Related Character </span>
          <select
            v-model="character.related"
            @change="setRelatedRoleDetails(character, $event)"
            class="block w-full border border-stone-500 rounded-md p-2"
          >
            <option value="">Select a Character</option>
            <option v-for="role in orderedRoles" :value="role.name">
              {{ role.name }}
            </option>
          </select>
        </label>
      </div>
      <button type="button" @click="addCharacter">Add Character</button>
    </fieldset>
    <fieldset
      class="flex flex-col md:flex-row gap-5 border rounded border-stone-500 p-4 my-3"
    >
      <legend>Game Results</legend>
      <fieldset class="flex gap-4">
        <label class="flex gap-2 items-center">
          <input
            type="radio"
            v-model="game.win"
            :value="true"
            class="block w-full border border-stone-500 rounded-md p-2"
          />
          <span class="block">Win</span>
        </label>
        <label class="flex gap-2 items-center">
          <input
            type="radio"
            v-model="game.win"
            :value="false"
            class="block w-full border border-stone-500 rounded-md p-2"
          />
          <span class="block">Loss</span>
        </label>
      </fieldset>
    </fieldset>
    <fieldset class="border rounded border-stone-500 p-4 my-3">
      <legend>Notes</legend>
      <textarea
        v-model="game.notes"
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
          <div v-for="file in game.image_urls" :key="file">
            <img crossorigin="anonymous" :src="file" class="w-64 h-64 object-cover" />
            <button type="button" @click="removeFile(file)">Remove</button>
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
        <Spinner />
        Saving...
      </template>
      <template v-else>Save Game</template>
    </button>
  </form>
</template>

<script setup lang="ts">
import type { Role } from "@prisma/client";
import { v4 as uuid } from "uuid";
import naturalOrder from "natural-order";

const roles = ref<Role[]>([]);
const scripts = ref<{ id: number; name: string }[]>([]);

const supabase = useSupabaseClient();
const config = useRuntimeConfig();

const showScriptDialog = ref(false);

const orderedRoles = computed(() =>
  naturalOrder(roles.value).orderBy("asc").sort(["name"])
);

const props = defineProps<{
  inFlight: boolean;
  game: {
    date: string;
    script: string;
    script_id: number | null;
    storyteller: string;
    location_type: "ONLINE" | "IN_PERSON";
    location: string;
    community: string;
    player_count: number | null;
    traveler_count: number | null;
    player_characters: {
      name: string;
      role_id: string | null;
      alignment: string;
      showRelated: boolean;
      related: string;
      related_role_id: string | null;
    }[];
    win: boolean;
    notes: string;
    image_urls: string[];
  };
}>();

const potentialScript = ref("");

const emit = defineEmits(["submit"]);

function addCharacter() {
  props.game.player_characters.push({
    name: "",
    alignment: props.game.player_characters[0].alignment,
    related: "",
    showRelated: false,
    role_id: null,
    related_role_id: null,
  });
}

function removeCharacter(i: number) {
  props.game.player_characters.splice(i, 1);
}

function uploadFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.accept = "image/*";
  input.onchange = selectFiles;
  input.click();
}

async function selectFiles(event: Event) {
  const uploadedFiles = (event.target as HTMLInputElement).files;
  if (!uploadedFiles) return;

  const files = Array.from(uploadedFiles);
  const urls = [];

  for (const file of files) {
    const { data, error } = await supabase.storage
      .from("game-attachments")
      .upload(`${uuid()}`, file);

    if (error) {
      continue;
    }

    urls.push(
      `${config.public.supabase.url}/storage/v1/object/public/game-attachments/${data.path}`
    );
  }

  props.game.image_urls.push(...urls);
}

async function removeFile(name: string) {
  const { error } = await supabase.storage
    .from("game-attachments")
    .remove([name]);

  if (error) {
    throw error;
  }

  props.game.image_urls = props.game.image_urls.filter((file) => file !== name);
}

async function searchScripts() {
  const result = await useFetch(`/api/script?query=${potentialScript.value}`);
  scripts.value = result.data.value ?? [];
}

function selectScript(script: { name: string; id: number | null }) {
  props.game.script = script.name;
  props.game.script_id = script.id;
  showScriptDialog.value = false;
}

watchEffect(async () => {
  roles.value = [];
  if (props.game.script_id) {
    const result = await useFetch(`/api/script/${props.game.script_id}`);
    roles.value = result.data.value?.roles ?? [];
  } else {
    const result = await useFetch("/api/roles");
    roles.value = result.data.value ?? [];
  }
});

function setCharacterDetails(
  character: {
    name: string;
    alignment: string;
    showRelated: boolean;
    related: string;
    role_id: string | null;
    related_role_id: string | null;
  },
  event: Event
) {
  const roleName = (event.target as HTMLSelectElement).value;
  const selectedRole = roles.value.find((role) => role.name === roleName);
  if (selectedRole) {
    character.alignment = selectedRole.initial_alignment;
    character.role_id = selectedRole.id;
  }
}

function setRelatedRoleDetails(
  character: {
    name: string;
    alignment: string;
    showRelated: boolean;
    related: string;
    role_id: string | null;
    related_role_id: string | null;
  },
  event: Event
) {
  const roleName = (event.target as HTMLSelectElement).value;
  const selectedRole = roles.value.find((role) => role.name === roleName);
  if (selectedRole) {
    character.related_role_id = selectedRole.id;
  }
}
</script>

<style scoped>
input,
select {
  height: 2.5rem;
  @apply text-lg bg-stone-600;
}

textarea {
  @apply text-lg bg-stone-600;
}
</style>
