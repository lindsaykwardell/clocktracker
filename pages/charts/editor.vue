<template>
  <AuthenticatedTemplate>
    <template v-if="myGames.status !== Status.SUCCESS">
      <Loading class="h-screen" />
    </template>
    <template v-else>
      <div class="flex gap-2">
        <label>
          Chart Type
          <select v-model="options.type">
            <option value="list">List</option>
            <option value="bar">Bar</option>
            <option value="pie">Pie</option>
            <option value="polar">Polar Area</option>
          </select>
        </label>
        <label>
          Data Field
          <select v-model="options.data_field">
            <option value="alignment">Alignment</option>
            <option value="game_size">Game Size</option>
            <option value="role">Role</option>
            <option value="script">Script</option>
            <option value="win">Win</option>
          </select>
        </label>
        <!-- refactor the below radio buttons into a select dropdown -->
        <label>
          Pivot
          <select v-model="options.pivot">
            <option :value="null">Do not pivot</option>
            <option value="alignment">Alignment</option>
            <option value="game_size">Game Size</option>
            <option value="role">Role</option>
            <option value="script">Script</option>
            <option value="win">Win</option>
          </select>
        </label>
        <select v-model="selectedIncludeTag" class="">
          <option :value="null">Include Tag</option>
          <option
            v-for="tag in myTags.filter(
              (tag) =>
                !options.includeTags.includes(tag) &&
                !options.excludeTags.includes(tag)
            )"
          >
            {{ tag }}
          </option>
        </select>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(tag, index) in options.includeTags"
            class="bg-blue-600 hover:bg-blue-700 transition duration-150 px-2 py-1 rounded flex items-center gap-2"
            @click.prevent="options.includeTags.splice(index, 1)"
          >
            {{ tag }}
          </button>
        </div>
        <select v-model="selectedExcludeTag" class="">
          <option :value="null">Exclude Tag</option>
          <option
            v-for="tag in myTags.filter(
              (tag) =>
                !options.includeTags.includes(tag) &&
                !options.excludeTags.includes(tag)
            )"
          >
            {{ tag }}
          </option>
        </select>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(tag, index) in options.excludeTags"
            class="bg-red-600 hover:bg-red-700 transition duration-150 px-2 py-1 rounded flex items-center gap-2"
            @click.prevent="options.excludeTags.splice(index, 1)"
          >
            {{ tag }}
          </button>
        </div>
      </div>
      <Chart
        class="w-[500px] h-[500px] flex justify-center py-6 m-auto"
        :games="myGames.data"
        :options="options"
      />
    </template>
  </AuthenticatedTemplate>
</template>

<script setup lang="ts">
const games = useGames();
const users = useUsers();
const user = useSupabaseUser();

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
  type: string;
  pivot: "role" | "alignment" | "script" | "game_size" | "win" | null;
  data_field: "role" | "alignment" | "script" | "game_size" | "win";
  includeTags: string[];
  excludeTags: string[];
}>({
  type: "bar",
  pivot: null,
  data_field: "win",
  includeTags: [],
  excludeTags: [],
});

const selectedIncludeTag = ref<string | null>(null);
const selectedExcludeTag = ref<string | null>(null);

watchEffect(() => {
  if (selectedIncludeTag.value) {
    options.includeTags.push(selectedIncludeTag.value);
    selectedIncludeTag.value = null;
  }
});

watchEffect(() => {
  if (selectedExcludeTag.value) {
    options.excludeTags.push(selectedExcludeTag.value);
    selectedExcludeTag.value = null;
  }
});
</script>

<style scoped>
input,
select {
  @apply text-black;
}
</style>
