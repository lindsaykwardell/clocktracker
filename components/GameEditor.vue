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
          <input
            type="text"
            list="scripts"
            v-model="game.script"
            class="block w-full border border-stone-500 rounded-md p-2"
            required
          />
          <datalist id="scripts">
            <option v-for="script in baseScripts" :value="script" :key="script">
              {{ script }}
            </option>
          </datalist>
        </label>
        <label class="flex-1">
          <span class="block">Storyteller</span>
          <input
            type="text"
            v-model="game.storyteller"
            class="block w-full border border-stone-500 rounded-md p-2"
            required
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
    </fieldset>
    <fieldset
      class="flex flex-col items-end gap-5 border rounded border-stone-500 p-4 my-3"
    >
      <legend>Player Setup</legend>
      <datalist id="player_characters">
        <option v-for="role in roles" :value="role" :key="role">
          {{ role }}
        </option>
      </datalist>
      <div
        v-for="(character, i) in game.player_characters"
        class="w-full flex flex-wrap md:flex-nowrap gap-5 items-end"
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
        <div v-else class="hidden md:block w-8"></div>
        <label class="flex-grow md:flex-1" :class="{
          'w-full': i === 0,
        }">
          <span class="block">
            <template v-if="i === 0">Initial Character</template>
            <template v-else-if="i + 1 === game.player_characters.length">
              End Character
            </template>
            <template v-else>Additional Character</template>
          </span>
          <input
            type="text"
            list="player_characters"
            v-model="character.name"
            class="block w-full border border-stone-500 rounded-md p-2"
            required
          />
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
          <input
            type="text"
            list="player_characters"
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
            <img :src="file" class="w-64 h-64 object-cover" />
            <button @click.prevent.stop="removeFile(file)">Remove</button>
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
</template>

<script setup lang="ts">
import { v4 as uuid } from "uuid";

const { roles } = useRoles();
const { baseScripts } = useScripts();

const supabase = useSupabaseClient();
const config = useRuntimeConfig();

const props = defineProps<{
  inFlight: boolean;
  game: {
    date: string;
    script: string;
    storyteller: string;
    location_type: "ONLINE" | "IN_PERSON";
    location: string;
    community: string;
    player_count: number | null;
    player_characters: {
      name: string;
      alignment: string;
      showRelated: boolean;
      related: string;
    }[];
    win: boolean;
    notes: string;
    image_urls: string[];
  };
}>();

const emit = defineEmits(["submit"]);

function addCharacter() {
  props.game.player_characters.push({
    name: "",
    alignment: props.game.player_characters[0].alignment,
    related: "",
    showRelated: false,
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
</script>

<style scoped>
input,
select {
  height: 2.5rem;
  @apply  text-lg bg-stone-600;
}

textarea {
  @apply  text-lg bg-stone-600;
}
</style>
