<template>
  <DashboardTemplate>
    <div class="flex flex-col items-center justify-center">
      <h1 class="text-4xl font-bold font-piratesbay">View Game</h1>
      <section class="w-[1000px] m-auto py-6">
        <fieldset
          class="flex flex-col md:flex-row gap-5 border rounded border-stone-500 p-4 my-3"
        >
          <legend>Game Setup</legend>
          <label>
            <span class="block">Date</span>
            {{ dayjs(game.data.value?.date).format("MM/DD/YYYY") }}
          </label>
          <label>
            <span class="block">Script</span>
            {{ game.data.value?.script }}
          </label>
          <label>
            <span class="block">Location Type</span>
            {{
              game.data.value?.location_type === "ONLINE"
                ? "Online"
                : "In Person"
            }}
          </label>
          <label>
            <span class="block">Location</span>
            {{ game.data.value?.location }}
          </label>
          <label>
            <span class="block">Players</span>
            {{ game.data.value?.player_count }}
          </label>
        </fieldset>
        <fieldset
          class="flex flex-col md:flex-row gap-5 border rounded border-stone-500 p-4 my-3"
        >
          <legend>Player Setup</legend>
          <label>
            <span class="block">Initial Character</span>
            {{ game.data.value?.player_characters[0].name }}
          </label>
          <label>
            <span class="block">Alignment</span>
            {{
              game.data.value?.player_characters[0].alignment === "GOOD"
                ? "Good"
                : "Evil"
            }}
          </label>
        </fieldset>
        <fieldset
          class="flex flex-col md:flex-row gap-5 border rounded border-stone-500 p-4 my-3"
        >
          <legend>Game Results</legend>
          <label>
            <span class="block">Final 3?</span>
            {{ game.data.value?.final3 ? "Yes" : "No" }}
          </label>
          <label>
            <span class="block">Win?</span>
            {{ game.data.value?.win ? "Yes" : "No" }}
          </label>
        </fieldset>
        <fieldset class="border rounded border-stone-500 p-4 my-3">
          <legend>Notes</legend>
          <p>
            {{ game.data.value?.notes }}
          </p>
        </fieldset>
      </section>
    </div>
  </DashboardTemplate>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
import dayjs from "dayjs";

const router = useRouter();
const route = useRoute();

const game = await useFetch<Game & { player_characters: Character[] }>(
  `/api/games/${route.params.id}`
);

if (game.error.value?.statusCode === 404) {
  router.push("/404");
}
</script>

<style scoped>
label {
  flex: 1 1 0%;
}

label span {
  @apply text-sm text-stone-400;
}
</style>
