<template>
  <DashboardTemplate>
    <section
      v-if="game.data.value"
      class="bg-gradient-to-b from-stone-100 to-stone-300 text-black w-4/5 m-auto my-4 rounded shadow-lg p-4"
    >
      <div class="flex flex-col-reverse md:flex-row">
        <div class="flex-grow flex flex-col">
          <div class="flex flex-col md:flex-row gap-4">
            <Avatar
              :value="player.data.value?.avatar || ''"
              class="border-2 shadow-xl"
              :class="{
                'border-blue-600':
                  game.data.value.player_characters[0].alignment === 'GOOD',
                'border-red-600':
                  game.data.value.player_characters[0].alignment === 'EVIL',
              }"
            />
            <div>
              <h2 class="text-3xl font-piratesbay">
                <a
                  class="hover:underline"
                  :href="`/@${player.data.value?.username}`"
                >
                  {{ player.data.value?.username }}
                </a>
              </h2>
              <div
                class="font-julee text-2xl"
                :class="{
                  'text-blue-600':
                    game.data.value.player_characters[0].alignment === 'GOOD',
                  'text-red-600':
                    game.data.value.player_characters[0].alignment === 'EVIL',
                }"
              >
                <a
                  :href="`https://wiki.bloodontheclocktower.com/${game.data.value?.player_characters[0].name}`"
                  target="_blank"
                  class="hover:underline"
                  >{{ game.data.value?.player_characters[0].name }}</a
                >
              </div>
              <time
                :datetime="dayjs(game.data.value.date).toISOString()"
                class="text-sm"
              >
                {{ dayjs(game.data.value.date).format("MMMM D, YYYY") }}
              </time>
            </div>
          </div>
          <div class="flex flex-col md:flex-row gap-4 mt-4">
            <label class="flex gap-3 items-center">
              <span>Script</span>
              <a
                class="hover:underline"
                :href="scriptLink(game.data.value.script)"
              >
                {{ game.data.value.script }}
              </a>
            </label>
            <label class="flex gap-3 items-center">
              <span>Players</span>
              {{ game.data.value.player_count }}
            </label>
            <label class="flex gap-3 items-center">
              <span>Location</span>
              {{
                game.data.value.location_type === "IN_PERSON"
                  ? "In Person"
                  : "Online"
              }}
              {{
                game.data.value.location ? ` (${game.data.value.location})` : ""
              }}
            </label>
          </div>
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
        </div>
        <img :src="scriptLogo(game.data.value.script)" class="w-64 h-64" />
      </div>
      <h3 class="font-piratesbay text-2xl">Notes and Images</h3>
      <p>
        {{ game.data.value?.notes }}
      </p>
      <div class="flex flex-col gap-5">
        <div class="flex flex-wrap gap-5">
          <div v-for="file in game.data.value?.image_urls" :key="file">
            <a :href="fullImageUrl(file)" target="_blank"
              ><img :src="fullImageUrl(file)" class="w-64 h-64 object-cover"
            /></a>
          </div>
        </div>
      </div>
    </section>
  </DashboardTemplate>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
import dayjs from "dayjs";

const { scriptLogo } = useScripts();
const config = useRuntimeConfig();
const router = useRouter();
const route = useRoute();

const game = await useFetch<Game & { player_characters: Character[] }>(
  `/api/games/${route.params.id}`
);
const player = await useFetch(`/api/user/${route.params.username}`);

if (
  game.error.value?.statusCode === 404 ||
  player.error.value?.statusCode === 404
) {
  router.push("/404");
}

useHead({
  title: `${player.data.value?.username} | ${game.data.value?.script}`,
  meta: [
    {
      hid: "description",
      name: "description",
      content: `Game of ${game.data.value?.script} played by ${
        player.data.value?.username
      } on ${dayjs(game.data.value?.date).format("MMMM D, YYYY")}.`,
    },
    {
      property: "og:title",
      content: `${player.data.value?.username} | ${game.data.value?.script}`,
    },
    {
      property: "og:description",
      content: `Game of ${game.data.value?.script} played by ${
        player.data.value?.username
      } on ${dayjs(game.data.value?.date).format("MMMM D, YYYY")}.`,
    },
    {
      property: "og:image",
      content: scriptLogo(game.data.value?.script as string),
    },
    {
      property: "og:url",
      content: route.fullPath,
    },
    {
      property: "twitter:card",
      content: "summary_large_image",
    },
    {
      property: "twitter:url",
      content: route.fullPath,
    },
    {
      property: "twitter:title",
      content: `${player.data.value?.username} | ${game.data.value?.script}`,
    },
    {
      property: "twitter:description",
      content: `Game of ${game.data.value?.script} played by ${
        player.data.value?.username
      } on ${dayjs(game.data.value?.date).format("MMMM D, YYYY")}.`,
    },
    {
      property: "twitter:image",
      content: scriptLogo(game.data.value?.script as string),
    },
  ],
});

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
  @apply text-sm text-stone-500;
}
</style>
