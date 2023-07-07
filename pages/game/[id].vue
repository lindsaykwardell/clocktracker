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
            <a
              :href="scriptLink(game.data.value?.script as string)"
              target="_blank"
              class="hover:underline"
            >
              {{ game.data.value?.script }}
            </a>
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
            <a
              :href="`https://wiki.bloodontheclocktower.com/${game.data.value?.player_characters[0].name}`"
              target="_blank"
              class="hover:underline"
              >{{ game.data.value?.player_characters[0].name }}</a
            >
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
        <fieldset class="border rounded border-stone-500 p-4 my-3">
          <legend>Images</legend>
          <div class="flex flex-col gap-5">
            <div class="flex flex-wrap gap-5">
              <div v-for="file in game.data.value?.image_urls" :key="file">
                <a :href="fullImageUrl(file)" target="_blank"
                  ><img
                    :src="fullImageUrl(file)"
                    class="w-64 h-64 object-cover"
                /></a>
              </div>
            </div>
          </div>
        </fieldset>
      </section>
    </div>
  </DashboardTemplate>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
import dayjs from "dayjs";

const config = useRuntimeConfig();
const router = useRouter();
const route = useRoute();

const game = await useFetch<Game & { player_characters: Character[] }>(
  `/api/games/${route.params.id}`
);

if (game.error.value?.statusCode === 404) {
  router.push("/404");
}

function fullImageUrl(file: string) {
  return `${config.public.supabase.url}/storage/v1/object/public/game-attachments/${file}`;
}

function scriptLink(script: string) {
  if (script === "Trouble Brewing")
    return "https://wiki.bloodontheclocktower.com/Trouble_Brewing";
  if (script === "Bad Moon Rising")
    return "https://wiki.bloodontheclocktower.com/Bad_Moon_Rising";
  if (script === "Sects & Violets")
    return "https://wiki.bloodontheclocktower.com/Sects_%26_Violets";
  else {
    return `https://botc-scripts.azurewebsites.net/?search=${script.replace(
      / /g,
      "+"
    )}&script_type=&include=&exclude=&edition=&author=`;
  }
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
