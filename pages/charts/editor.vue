<template>
  <StandardTemplate>
    <template v-if="myGames.status !== Status.SUCCESS">
      <Loading class="h-screen" />
    </template>
    <div v-else class="flex flex-col md:flex-row h-[calc(100vh-50px)]">
      <div class="flex-grow flex justify-center items-center">
        <Chart 
          class="py-12 m-auto" 
          :games="myGames.data" 
          :options="options" 
        />
      </div>
      <div
        class="w-100 md:w-1/2 lg:w-1/3 p-8 border-l dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40"
      >
        <!-- Form elements -->
        <div class="grid grid-cols-[1fr_4fr] md:grid-cols-[1fr_3fr] gap-2 mb-8">
          <label class="col-span-2 grid grid-cols-subgrid items-center">
            Title
            <Input type="text" v-model="options.title" />
          </label>
          <label class="col-span-2 grid grid-cols-subgrid items-center">
            <span class="w-[150px] md:w-auto shrink-0">Chart Type</span>
            <Input mode="select" v-model="options.type">
              <option value="LIST">List</option>
              <option value="BAR">Bar</option>
              <option value="PIE">Pie</option>
              <option value="POLAR_AREA">Polar Area</option>
            </Input>
          </label>
          <label class="col-span-2 grid grid-cols-subgrid items-center">
            <span class="w-[150px] md:w-auto">Data Field</span>
            <Input mode="select" v-model="options.data">
              <option value="ALIGNMENT">Alignment</option>
              <option value="GAME_SIZE">Game Size</option>
              <option value="ROLE">Role</option>
              <option value="SCRIPT">Script</option>
              <option value="WIN">Win</option>
            </Input>
          </label>
          <!-- refactor the below radio buttons into a select dropdown -->
          <label class="col-span-2 grid grid-cols-subgrid items-center">
            <span class="w-[150px] md:w-auto">Pivot Field</span>
            <div>
              <Input mode="select" v-model="options.pivot">
                <option :value="null">Do not pivot</option>
                <option value="ALIGNMENT">Alignment</option>
                <option value="GAME_SIZE">Game Size</option>
                <option value="ROLE">Role</option>
                <option value="SCRIPT">Script</option>
                <option value="WIN">Win</option>
              </Input>
              <!-- <span class="text-xs leading-[1.3]">
                Break the results down by another category (e.g., by Role or Script).
              </span> -->
            </div>
          </label>
          <label class="col-span-2 grid grid-cols-subgrid items-center">
            <span class="w-[150px] md:w-auto">Width</span>
            <Input type="number" v-model="options.width" placeholder="250" />
          </label>
          <label class="col-span-2 grid grid-cols-subgrid items-center">
            <span class="w-[150px] md:w-auto">Height</span>
            <Input type="number" v-model="options.height" placeholder="250" />
          </label>
          <div class="col-span-2 grid grid-cols-subgrid gap-2">
            <div>Filter</div>
            <div class="flex flex-col gap-2">
              <div class="flex flex-col gap-1">
                <Input mode="select" v-model="selectedIncludeTag">
                  <option :value="null">Include Tag</option>
                  <option
                    v-for="tag in myTags.filter(
                      (tag) =>
                        !options.include_tags.includes(tag) &&
                        !options.exclude_tags.includes(tag)
                    )"
                  >
                    {{ tag }}
                  </option>
                </Input>
                <div
                  v-if="options.include_tags.length"
                  class="flex flex-wrap gap-1"
                >
                  <button
                    v-for="(tag, index) in options.include_tags"
                    class="bg-green-500 hover:bg-green-400 dark:bg-green-600 dark:hover:bg-green-700 transition duration-150 pl-2 py-1 rounded flex items-center"
                    @click.prevent="options.include_tags.splice(index, 1)"
                    :title="`Remove ${tag}`"
                  >
                    {{ tag }}
                    <IconUI id="x" size="sm" />
                  </button>
                </div>
              </div>
              <div class="flex flex-col gap-1">
                <Input mode="select" v-model="selectedExcludeTag">
                  <option :value="null">Exclude Tag</option>
                  <option
                    v-for="tag in myTags.filter(
                      (tag) =>
                        !options.include_tags.includes(tag) &&
                        !options.exclude_tags.includes(tag)
                    )"
                  >
                    {{ tag }}
                  </option>
                </Input>
                <div 
                  v-if="options.exclude_tags.length"
                  class="flex flex-wrap gap-1"
                >
                  <button
                    v-for="(tag, index) in options.exclude_tags"
                    class="bg-red-500 hover:bg-red-400 dark:bg-red-600 dark:hover:bg-red-700 transition duration-150 pl-2 py-1 rounded flex items-center"
                    @click.prevent="options.exclude_tags.splice(index, 1)"
                    :title="`Remove ${tag}`"
                  >
                    {{ tag }}
                    <IconUI id="x" size="sm" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Form actions -->
        <div class="col-span-2 flex gap-2 justify-end">
          <nuxt-link
            :to="cancelLink"
            class="px-3 py-2 border rounded dark:border-stone-600 bg-stone-300/50 hover:bg-stone-300 dark:bg-stone-900/50 hover:dark:bg-stone-900"
          >
            Cancel
          </nuxt-link>
          <Button @click="saveChart" primary class="px-3">
            Save
          </Button>
        </div>
        
      </div>
    </div>
  </StandardTemplate>
</template>

<script setup lang="ts">
const games = useGames();
const users = useUsers();
const user = useSupabaseUser();
const router = useRouter();
const route = useRoute();

const chartId = computed(() => {
  return route.query.chart_id as string | undefined;
});
const loadedChart = ref(false);

const isStorytellerFromQuery = computed(() => {
  // only use this for *new* charts
  if (chartId.value) return false;
  return route.query.storyteller_only === "1";
});

const me = computed(() => {
  return users.getUserById(user.value?.id);
});

const myGames = computed(() => {
  if (me.value?.status !== Status.SUCCESS) return me.value;

  return games.getByPlayer(me.value.data.username);
});

const myTags = computed(() => {
  if (me.value?.status === Status.SUCCESS) {
    return games.getTagsByPlayer(me.value.data.username);
  } else {
    return [];
  }
});

const options = reactive<{
  title: string;
  type: string;
  pivot: "ROLE" | "ALIGNMENT" | "SCRIPT" | "GAME_SIZE" | "WIN" | null;
  data: "ROLE" | "ALIGNMENT" | "SCRIPT" | "GAME_SIZE" | "WIN";
  include_tags: string[];
  exclude_tags: string[];
  width: number;
  height: number;
  storyteller_only: boolean;
}>({
  title: "My Games",
  type: "BAR",
  pivot: null,
  data: "WIN",
  include_tags: [],
  exclude_tags: [],
  width: 250,
  height: 250,
  storyteller_only: isStorytellerFromQuery.value
});

const selectedIncludeTag = ref<string | null>(null);
const selectedExcludeTag = ref<string | null>(null);

watchEffect(() => {
  if (selectedIncludeTag.value) {
    options.include_tags.push(selectedIncludeTag.value);
    selectedIncludeTag.value = null;
  }
});

watchEffect(() => {
  if (selectedExcludeTag.value) {
    options.exclude_tags.push(selectedExcludeTag.value);
    selectedExcludeTag.value = null;
  }
});

async function saveChart() {
  if (loadedChart.value) {
    await $fetch(`/api/charts/${chartId.value}`, {
      method: "PUT",
      body: JSON.stringify(options),
    });
  } else {
    await $fetch("/api/charts", {
      method: "POST",
      body: JSON.stringify(options),
    });
  }

  if (me.value.status === Status.SUCCESS) {
    const username = me.value.data.username;
    const view = options.storyteller_only
      ? "stats&storyteller=1"
      : "stats";

    router.push(`/@${username}?view=${view}`);
  } else {
    router.push("/");
  }
}

const cancelLink = computed(() => {
  if (!me.value || me.value.status !== Status.SUCCESS) {
    return "/";
  }

  const username = me.value.data.username;
  const view = options.storyteller_only
      ? "stats&storyteller=1"
      : "stats";

  return `/@${username}?view=${view}`;
});

onMounted(async () => {
  if (chartId.value) {
    const chart = await $fetch(`/api/charts/${chartId.value}`);
    if (!chart) return;

    options.title = chart.title;
    options.type = chart.type;
    options.pivot = chart.pivot;
    options.data = chart.data;
    options.include_tags = chart.include_tags;
    options.exclude_tags = chart.exclude_tags;
    options.width = chart.width;
    options.height = chart.height;
    options.storyteller_only = chart.storyteller_only || false;
    loadedChart.value = true;
  }
});
</script>
