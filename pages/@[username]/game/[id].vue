<template>
  <AuthenticatedTemplate>
    <section
      v-if="game.data.value"
      class="bg-gradient-to-b from-stone-100 to-stone-300 text-black w-full lg:w-4/5 m-auto md:my-4 rounded shadow-lg p-4"
    >
      <div class="flex flex-col-reverse md:flex-row items-center">
        <div class="flex-grow flex flex-col w-full">
          <div class="flex flex-col md:flex-row gap-4 items-center">
            <Avatar
              :value="player.data.value?.avatar || ''"
              class="border-2 shadow-xl"
              :class="{
                'border-blue-600':
                  game.data.value.player_characters[
                    game.data.value.player_characters.length - 1
                  ].alignment === 'GOOD',
                'border-red-600':
                  game.data.value.player_characters[
                    game.data.value.player_characters.length - 1
                  ].alignment === 'EVIL',
              }"
            />
            <div class="flex-grow">
              <h2 class="text-3xl font-dumbledor">
                <a
                  class="hover:underline"
                  :href="`/@${player.data.value?.username}`"
                >
                  {{ player.data.value?.display_name }}
                </a>
              </h2>
              <div class="flex flex-col md:flex-row gap-2">
                <div
                  v-for="(character, i) in game.data.value.player_characters"
                  class="font-dumbledor text-xl font-bold bottom-[20px]"
                  :class="{
                    'text-blue-800': character.alignment === 'GOOD',
                    'text-red-800': character.alignment === 'EVIL',
                  }"
                >
                  {{ character.name }}
                  <template v-if="character.related">
                    ({{ character.related }})
                  </template>
                  <template
                    v-if="i !== game.data.value.player_characters.length - 1"
                  >
                    ➡
                  </template>
                </div>
              </div>
              <time
                :datetime="dayjs(game.data.value.date).toISOString()"
                class="text-sm"
              >
                {{ dayjs(game.data.value.date).format("MMMM D, YYYY") }}
              </time>
            </div>
            <div class="font-dumbledor text-2xl">
              <a
                :href="`https://wiki.bloodontheclocktower.com/${
                  game.data.value?.player_characters[
                    game.data.value.player_characters.length - 1
                  ].name
                }`"
                target="_blank"
                class="hover:underline flex flex-col items-center"
              >
                <div
                  class="token bg-center bg-cover relative rounded-full w-32 h-32 shadow-xl border border-black flex justify-center items-center"
                >
                  <img
                    class="w-24 h-24 object-contain"
                    :src="
                      roles.toImage(
                        game.data.value.player_characters[
                          game.data.value.player_characters.length - 1
                        ].name
                      )
                    "
                    :onerror="`this.src='/img/role/${
                      game.data.value.player_characters[
                        game.data.value.player_characters.length - 1
                      ].alignment === 'GOOD'
                        ? 'good'
                        : 'evil'
                    }.png'; this.onerror=null;`"
                  />
                  <div
                    v-if="
                      game.data.value.player_characters[
                        game.data.value.player_characters.length - 1
                      ].related
                    "
                    class="token bg-center bg-cover absolute bottom-0 right-0 rounded-full w-12 h-12 shadow-xl border border-black flex justify-center items-center"
                  >
                    <img
                      class="w-8 h-8"
                      :src="
                        roles.toImage(
                          game.data.value.player_characters[
                            game.data.value.player_characters.length - 1
                          ].related || ''
                        )
                      "
                    />
                  </div>
                </div>
              </a>
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
            <label
              v-if="game.data.value.community"
              class="flex gap-3 items-center"
            >
              <span>Community</span>
              {{ game.data.value.community }}
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
            class="flex flex-col sm:flex-row gap-5 border rounded border-stone-500 p-4 my-3"
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
        <img
          :src="scriptLogo(game.data.value.script)"
          class="w-48 md:w-64 h-48 md:h-64"
        />
      </div>
      <template
        v-if="game.data.value.notes || game.data.value.image_urls.length"
      >
        <h3 class="font-dumbledor text-2xl">Notes and Images</h3>
        <p v-if="game.data.value.notes" class="bg-stone-100 p-4 shadow-lg my-3">
          {{ game.data.value?.notes }}
        </p>
        <div class="flex flex-col gap-5">
          <div class="flex flex-wrap gap-5">
            <div v-for="file in game.data.value?.image_urls" :key="file">
              <a :href="fullImageUrl(file)" target="_blank">
                <img
                  :src="fullImageUrl(file)"
                  class="w-full sm:w-1/2 md:w-64 md:h-64 object-cover shadow-lg"
                />
              </a>
            </div>
          </div>
        </div>
      </template>
    </section>
  </AuthenticatedTemplate>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
import dayjs from "dayjs";

const { scriptLogo } = useScripts();
const roles = useRoles();
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
  console.error(game.error.value, player.error.value);
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
