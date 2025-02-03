<template>
  <Dialog v-model:visible="showScriptDialog">
    <template #title>
      <div class="flex">
        <h2 class="text-2xl font-bold font-sorts flex-grow">Select Script</h2>
        <button
          v-if="scriptSelected"
          @click.prevent="clearSelectedScript"
          class="text-stone-400"
        >
          Clear selection
        </button>
      </div>
    </template>
    <section class="p-4 flex flex-col gap-2">
      <div class="flex justify-around gap-8 pb-4">
        <button
          class="flex-1 w-1 hover:bg-stone-800 rounded-lg hover:shadow-xl"
          @click.prevent="emit('selectScript', troubleBrewing!)"
        >
          <img src="/img/trouble_brewing.png" alt="Trouble Brewing" />
        </button>
        <button
          class="flex-1 w-1 hover:bg-stone-800 rounded-lg hover:shadow-xl"
          @click.prevent="emit('selectScript', badMoonRising!)"
        >
          <img src="/img/bad_moon_rising.png" alt="Bad Moon Rising" />
        </button>
        <button
          class="flex-1 w-1 hover:bg-stone-800 rounded-lg hover:shadow-xl"
          @click.prevent="emit('selectScript', sectsAndViolets!)"
        >
          <img src="/img/sects_and_violets.png" alt="Sects and Violets" />
        </button>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="script in recentScripts"
          @click="emit('selectScript', script)"
          class="bg-stone-600 hover:bg-stone-700 transition duration-150 px-2 py-1 rounded flex items-center gap-2"
        >
          {{ script.name }}
          <template v-if="script.version">
            &nbsp;v{{ script.version }}
          </template>
        </button>
      </div>
      <div class="relative">
        <input
          v-model="potentialScript"
          class="block w-full border border-stone-500 rounded-md p-2 text-lg bg-stone-600"
          placeholder="Search for a script"
        />
        <button
          type="button"
          @click="searchScripts"
          class="absolute right-2 -top-3 w-16 h-16"
        >
          <img src="/img/role/investigator.png" />
        </button>
      </div>
      <ul class="py-2">
        <li v-for="script in scripts" class="px-1 py-2 hover:bg-stone-800">
          <button
            type="button"
            @click="emit('selectScript', script)"
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
            @click="emit('selectScript', { name: potentialScript, id: null })"
            class="w-full text-left"
          >
            {{ potentialScript }} (Use custom script)
          </button>
        </li>
      </ul>
      <button
        type="button"
        class="text-stone-400 italic underline"
        @click="handleUploadScript"
      >
        Upload a script
      </button>
    </section>
  </Dialog>
</template>

<script setup lang="ts">
import { watchDebounced } from "@vueuse/core";

const games = useGames();
const { uploadScript } = useScripts();
const featureFlags = useFeatureFlags();

const props = defineProps<{
  visible: boolean;
  scriptSelected: boolean;
}>();

const emit = defineEmits(["selectScript", "update:visible"]);

const showScriptDialog = computed({
  get: () => props.visible,
  set: (value: boolean) => emit("update:visible", value),
});

const potentialScript = ref("");
const scripts = ref<{ id: number; name: string }[]>([]);
const baseScripts = ref<{ id: number; name: string }[]>([]);

const recentScripts = computed(() =>
  games.getRecentScripts.filter(
    (s) => !baseScripts.value.some((b) => b.id === s.id)
  )
);

const baseScriptData = await $fetch(
  "/api/script?author=The Pandemonium Institute"
);
baseScripts.value = baseScriptData ?? [];

const troubleBrewing = computed(() =>
  baseScripts.value.find((script) => script.name === "Trouble Brewing")
);
const sectsAndViolets = computed(() =>
  baseScripts.value.find((script) => script.name === "Sects and Violets")
);
const badMoonRising = computed(() =>
  baseScripts.value.find((script) => script.name === "Bad Moon Rising")
);

async function searchScripts() {
  if (potentialScript.value === "") {
    scripts.value = [];
    return;
  }

  const result = await useFetch(`/api/script?query=${potentialScript.value}`);
  scripts.value = result.data.value ?? [];
}

watchDebounced(potentialScript, searchScripts, { debounce: 500 });

async function handleUploadScript() {
  const script = (await uploadScript()) as Promise<{
    id: number;
    name: string;
  }>;

  if (script) {
    emit("selectScript", script);
  }
}

function clearSelectedScript() {
  emit("selectScript", { name: "", id: null });
}
</script>
