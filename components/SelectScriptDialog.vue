<template>
  <Dialog v-model:visible="showScriptDialog">
    <template #title>
      <div class="flex gap-4">
        <h2 class="text-2xl font-bold font-sorts">Select Script</h2>
        <Button
          v-if="scriptSelected"
          @click.prevent="clearSelectedScript"
          color="negative"
          size="small"
          
        >
          Clear current script
        </Button>
      </div>
    </template>
    <section class="flex justify-center mx-4 border-b border-stone-700">
      <Listbox v-model="mode" class="w-56">
        <div class="relative">
          <ListboxButton
            class="relative w-full border-x border-t border-stone-700 rounded-t-lg cursor-pointer pr-10 focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
          >
            <span
              v-if="mode === 'classic'"
              :class="[
                'relative select-none py-2 px-2 flex justify-between items-center',
              ]"
            >
              <div>
                <img
                  src="/img/botc_head.webp"
                  alt="Demon Head"
                  class="w-10 h-10 flex-shrink"
                />
              </div>
              <div :class="['block truncate flex-grow text-right']">
                Classic Scripts
              </div>
            </span>
            <span
              v-if="mode === 'living'"
              :class="[
                'relative select-none py-2 px-2 flex justify-between items-center',
              ]"
            >
              <div>
                <img
                  src="/img/living-scripts.webp"
                  alt="Living Scripts"
                  class="w-10 h-10 flex-shrink"
                />
              </div>
              <div :class="['block truncate flex-grow text-right']">
                Living Scripts
              </div>
            </span>
            <span
              class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
            >
              <IconUI id="chevron-down" size="sm" />
            </span>
          </ListboxButton>

          <transition
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <ListboxOptions
              class="absolute z-10 border-x border-b border-stone-700 rounded-b-lg max-h-60 w-full overflow-auto bg-stone-950 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
              @click.stop.prevent
            >
              <ListboxOption
                v-slot="{ active, selected }"
                value="classic"
                as="template"
              >
                <li
                  :class="[
                    active ? 'bg-stone-800 text-stone-100' : 'text-stone-300',
                    'relative cursor-pointer select-none py-2 px-2 flex justify-between items-center',
                  ]"
                >
                  <div>
                    <img
                      src="/img/botc_head.webp"
                      alt="Demon Head"
                      class="w-10 h-10 flex-shrink"
                    />
                  </div>
                  <div
                    :class="[
                      selected ? 'font-medium' : 'font-normal',
                      'block truncate flex-grow text-right',
                    ]"
                  >
                    Classic Scripts
                  </div>
                </li>
              </ListboxOption>
              <ListboxOption
                v-slot="{ active, selected }"
                value="living"
                as="template"
              >
                <li
                  :class="[
                    active ? 'bg-stone-800 text-stone-100' : 'text-stone-300',
                    'relative cursor-pointer select-none py-2 px-2 flex justify-between items-center',
                  ]"
                >
                  <div>
                    <img
                      src="/img/living-scripts.webp"
                      alt="Living Scripts"
                      class="w-10 h-10 flex-shrink"
                    />
                  </div>
                  <div
                    :class="[
                      selected ? 'font-medium' : 'font-normal',
                      'block truncate flex-grow text-right',
                    ]"
                  >
                    Living Scripts
                  </div>
                </li>
              </ListboxOption>
            </ListboxOptions>
          </transition>
        </div>
      </Listbox>
    </section>
    <section class="p-4 flex flex-col gap-2 min-h-40">
      <template v-if="mode === 'classic'">
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
          <Button
            v-for="script in recentScripts"
            @click="emit('selectScript', script)"
            size="small"
            color="neutral-on-dark"
          >
            {{ script.name }}
            <span v-if="script.version" class="text-xs">
              v{{ script.version }}
            </span>
          </Button>
        </div>
      </template>
      <div class="relative">
        <input
          v-model="input"
          class="block w-full border border-stone-500 rounded-md p-2 text-lg bg-stone-600"
          placeholder="Search for a script"
        />
        <!-- @todo use Button? -->
        <button
          type="button"
          @click="searchScripts"
          class="absolute right-2 -top-3 w-16 h-16"
        >
          <img v-if="mode === 'classic'" src="/img/ui/investigator.webp" />
          <img v-else src="/img/living-scripts.webp" />
        </button>
      </div>
      <ul v-if="mode === 'classic' && scripts.length > 0" class="py-2">
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
            mode === 'classic' &&
            input &&
            !scripts.find((script) => script.name === input)
          "
        >
          <button
            type="button"
            @click="emit('selectScript', { name: input, id: null })"
            class="w-full text-left"
          >
            {{ input }} (Use custom script)
          </button>
        </li>
      </ul>
      <div v-if="mode === 'classic'" class="mx-auto">or</div>
      <Button
        v-if="mode === 'classic'"
        type="button"
        @click="handleUploadScript"
        size="small"
        icon="upload"
        color="neutral-on-dark"
        class="mx-auto"
      >
        Upload a script
      </Button>
      <template v-if="mode === 'living' && isLoading">
        <div class="flex justify-center items-center">
          <Loading />
        </div>
      </template>
      <template v-if="mode === 'living' && lsCampaign">
        <div class="flex gap-4">
          <div class="flex-grow">
            <h3 class="text-xl font-bold font-sorts">
              {{ lsCampaign.title }}
            </h3>
            <h4 class="font-bold">By {{ lsCampaign.author }}</h4>
          </div>
          <div>
            <!-- @todo fix background color -->
            <Input mode="select" v-model="selectedLSGame">
              <option v-for="game in selectableGames" :value="game">
                Game {{ game.game_number }}
              </option>
            </Input>
          </div>
        </div>
        <div v-if="selectedLSGame" class="mt-4">
          <h4 class="font-bold">Game {{ selectedLSGame.game_number }}</h4>
          <p>{{ selectedLSGame.notes }}</p>
          <Button
            type="button"
            @click="
              emit('selectLSGame', {
                game_id: selectedLSGame.id,
                game_number: selectedLSGame.game_number,
                script_id: selectedLSGame.script_id,
                name: lsCampaign.title,
                notes: selectedLSGame.notes,
                date: selectedLSGame.submitted,
              })
            "
            class="m-auto"
          >
            Select this game
          </Button>
        </div>
      </template>
    </section>
  </Dialog>
</template>

<script setup lang="ts">
import { watchDebounced } from "@vueuse/core";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/vue";
import type { LSCampaign, LSGame, Script } from "@prisma/client";

type LoadedLSCampaign = LSCampaign & { games: (LSGame & { script: Script })[] };

const games = useGames();
const { uploadScript } = useScripts();
const featureFlags = useFeatureFlags();

const props = defineProps<{
  visible: boolean;
  scriptSelected: boolean;
}>();

const emit = defineEmits(["selectScript", "selectLSGame", "update:visible"]);

const mode = ref<"classic" | "living">("classic");
const showScriptDialog = computed({
  get: () => props.visible,
  set: (value: boolean) => emit("update:visible", value),
});

const input = ref("");
const scripts = ref<{ id: number; name: string }[]>([]);
const baseScripts = ref<{ id: number; name: string }[]>([]);
const lsCampaign = ref<LoadedLSCampaign | null>(null);
const selectedLSGame = ref<LSGame | null>(null);
const isLoading = ref(false);

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

const selectableGames = computed(
  () =>
    lsCampaign.value?.games.toSorted((a, b) => a.game_number - b.game_number) ??
    []
);

async function searchScripts() {
  if (mode.value === "living") {
    return;
  }

  if (input.value === "") {
    scripts.value = [];
    return;
  }

  const result = await $fetch(`/api/script?query=${input.value}`);
  scripts.value = result ?? [];
}

async function searchLSCampaign() {
  if (mode.value === "classic") {
    return;
  }

  if (input.value === "") {
    lsCampaign.value = null;
    return;
  }

  isLoading.value = true;
  const result = await $fetch(`/api/living_scripts/${input.value}`);
  if (result) {
    lsCampaign.value = result as any as LoadedLSCampaign;
  }
  isLoading.value = false;
}

watchDebounced(input, searchScripts, { debounce: 500 });
watchDebounced(input, searchLSCampaign, { debounce: 500 });

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
