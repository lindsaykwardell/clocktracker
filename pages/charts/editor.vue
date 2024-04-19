<template>
  <StandardTemplate>
    <template v-if="myGames.status !== Status.SUCCESS">
      <Loading class="h-screen" />
    </template>
    <div v-else class="flex flex-col h-screen">
      <div class="flex-grow flex justify-center items-center">
        <Chart class="py-6 m-auto" :games="myGames.data" :options="options" />
      </div>
      <div class="p-6 m-6 bg-stone-950 flex flex-col gap-2">
        <div class="flex gap-2">
          <label class="flex items-center gap-1 flex-grow">
            Title
            <input
              type="text"
              class="flex-grow block border border-stone-500 rounded-md p-2"
              v-model="options.title"
            />
          </label>
        </div>
        <div class="flex flex-col md:flex-row gap-2 w-full">
          <label class="flex-1 flex items-center gap-1">
            <span class="w-[150px] md:w-auto">Chart Type</span>
            <select
              class="block border w-full border-stone-500 rounded-md p-2"
              v-model="options.type"
            >
              <option value="LIST">List</option>
              <option value="BAR">Bar</option>
              <option value="PIE">Pie</option>
              <option value="POLAR_AREA">Polar Area</option>
            </select>
          </label>
          <label class="flex-1 flex items-center gap-1">
            <span class="w-[150px] md:w-auto">Data Field</span>
            <select
              class="block border w-full border-stone-500 rounded-md p-2"
              v-model="options.data"
            >
              <option value="ALIGNMENT">Alignment</option>
              <option value="GAME_SIZE">Game Size</option>
              <option value="ROLE">Role</option>
              <option value="SCRIPT">Script</option>
              <option value="WIN">Win</option>
            </select>
          </label>
          <!-- refactor the below radio buttons into a select dropdown -->
          <label class="flex-1 flex items-center gap-1">
            <span class="w-[150px] md:w-auto">Pivot Field</span>
            <select
              class="block border w-full border-stone-500 rounded-md p-2"
              v-model="options.pivot"
            >
              <option :value="null">Do not pivot</option>
              <option value="ALIGNMENT">Alignment</option>
              <option value="GAME_SIZE">Game Size</option>
              <option value="ROLE">Role</option>
              <option value="SCRIPT">Script</option>
              <option value="WIN">Win</option>
            </select>
          </label>
          <label class="flex-1 flex items-center gap-1">
            <span class="w-[150px] md:w-auto">Width</span>
            <input
              type="number"
              class="block border w-full border-stone-500 rounded-md p-2"
              v-model="options.width"
              placeholder="250"
            />
          </label>
          <label class="flex-1 flex items-center gap-1">
            <span class="w-[150px] md:w-auto">Height</span>
            <input
              type="number"
              class="block border w-full border-stone-500 rounded-md p-2"
              v-model="options.height"
              placeholder="250"
            />
          </label>
        </div>
        <div class="flex flex-col md:flex-row gap-2 justify-between">
          <div class="flex-1 flex gap-1">
            <select v-model="selectedIncludeTag" class="rounded p-1 w-[120px]">
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
            </select>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="(tag, index) in options.include_tags"
                class="bg-blue-600 hover:bg-blue-700 transition duration-150 px-2 py-1 rounded flex items-center gap-2"
                @click.prevent="options.include_tags.splice(index, 1)"
              >
                {{ tag }}
              </button>
            </div>
          </div>
          <div class="flex-1 flex gap-1">
            <select v-model="selectedExcludeTag" class="rounded p-1 w-[120px]">
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
            </select>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="(tag, index) in options.exclude_tags"
                class="bg-red-600 hover:bg-red-700 transition duration-150 px-2 py-1 rounded flex items-center gap-2"
                @click.prevent="options.exclude_tags.splice(index, 1)"
              >
                {{ tag }}
              </button>
            </div>
          </div>
        </div>
        <Button @click="saveChart" primary class="px-3 md:w-[300px] md:m-auto">
          Save
        </Button>
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
}>({
  title: "My Games",
  type: "BAR",
  pivot: null,
  data: "WIN",
  include_tags: [],
  exclude_tags: [],
  width: 300,
  height: 300,
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
    router.push(`/@${me.value.data.username}?view=charts`);
  } else {
    router.push("/");
  }
}

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
    loadedChart.value = true;
  }
});
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
