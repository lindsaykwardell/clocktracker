<template>
  <AuthenticatedTemplate>
    <template v-if="myGames.status !== Status.SUCCESS">
      <Loading class="h-screen" />
    </template>
    <template v-else>
      <div class="flex gap-2">
        <select v-model="options.type">
          <!-- List, Bar, Pie, Line-->
          <option value="list">List</option>
          <option value="bar">Bar</option>
          <option value="pie">Pie</option>
          <option value="polar">Polar Area</option>
        </select>
        <label>
          <input
            v-model="options.pivot"
            :value="null"
            type="radio"
            name="pivot"
          />
          Do Not Split
        </label>
        <label>
          <input
            v-model="options.pivot"
            value="role"
            type="radio"
            name="pivot"
          />
          Split By Role
        </label>
        <label>
          <input
            v-model="options.pivot"
            value="alignment"
            type="radio"
            name="pivot"
          />
          Split By Alignment
        </label>
        <label>
          <input
            v-model="options.pivot"
            value="script"
            type="radio"
            name="pivot"
          />
          Split By Script
        </label>
        <label>
          <input
            v-model="options.pivot"
            value="game_size"
            type="radio"
            name="pivot"
          />
          Split By Game Size
        </label>
        <label>
          <input
            v-model="options.pivot"
            value="win"
            type="radio"
            name="pivot"
          />
          Split By Win
        </label>
        <label>
          Data Field
          <select v-model="options.data_field">
            <option value="win">Win</option>
            <option value="role">Role</option>
            <option value="alignment">Alignment</option>
            <option value="script">Script</option>
            <option value="game_size">Game Size</option>
          </select>
        </label>
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

const myGames = computed(() => {
  const me = users.getUserById(user.value?.id);

  if (me.status !== Status.SUCCESS) return me;

  return games.getByPlayer(me.data.username);
});

const options = reactive<{
  type: string;
  pivot: "role" | "alignment" | "script" | "game_size" | "win" | null;
  data_field: "role" | "alignment" | "script" | "game_size" | "win";
}>({
  type: "bar",
  pivot: null,
  data_field: "win",
});
</script>

<style scoped>
input,
select {
  @apply text-black;
}
</style>
