<template>
  <AuthenticatedTemplate>
    <section
      v-if="game.status === Status.SUCCESS && player.status === Status.SUCCESS"
      class="bg-gradient-to-b from-stone-100 to-stone-300 text-black w-full lg:w-4/5 m-auto md:my-4 rounded shadow-lg p-4"
    >
      <div class="flex flex-col-reverse md:flex-row items-center">
        <div class="flex-grow flex flex-col w-full">
          <div class="flex flex-col md:flex-row gap-4 items-center">
            <Avatar
              :value="player.data.avatar || ''"
              class="border-2 shadow-xl"
              :class="{
                'border-blue-600': last_character?.alignment === 'GOOD',
                'border-red-600': last_character?.alignment === 'EVIL',
              }"
            />
            <div class="flex-grow">
              <h2 class="text-3xl font-dumbledor">
                <nuxt-link
                  class="hover:underline"
                  :to="`/@${player.data.username}`"
                >
                  {{ player.data.display_name }}
                </nuxt-link>
              </h2>
              <div class="flex flex-col md:flex-row gap-2">
                <div
                  v-for="(character, i) in game.data.player_characters"
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
                  <template v-if="i !== game.data.player_characters.length - 1">
                    ➡
                  </template>
                </div>
              </div>
              <time
                :datetime="dayjs(game.data.date).toISOString()"
                class="text-sm"
              >
                {{ dayjs(game.data.date).format("MMMM D, YYYY") }}
              </time>
            </div>
            <div class="font-dumbledor text-2xl">
              <a
                :href="`https://wiki.bloodontheclocktower.com/${last_character?.name}`"
                target="_blank"
                class="hover:underline flex flex-col items-center"
              >
                <Token :character="last_character" size="md" />
              </a>
            </div>
          </div>
          <div class="flex flex-col md:flex-row gap-4 mt-4">
            <label class="flex gap-3 items-center">
              <span>Script</span>
              <a class="hover:underline" :href="scriptLink(game.data.script)">
                {{ game.data.script }}
              </a>
            </label>
            <label v-if="game.data.storyteller" class="flex gap-3 items-center">
              <span>Storyteller</span>
              {{ game.data.storyteller }}
            </label>
            <label
              v-if="game.data.player_count"
              class="flex gap-3 items-center"
            >
              <span>Players</span>
              {{ game.data.player_count }}
            </label>
            <label
              v-if="game.data.traveler_count"
              class="flex gap-3 items-center"
            >
              <span>Travelers</span>
              {{ game.data.traveler_count }}
            </label>
          </div>
          <div class="flex flex-col md:flex-row gap-4 mt-4 justify-start">
            <label v-if="game.data.community" class="flex gap-3 items-center">
              <span>Community</span>
              {{ game.data.community }}
            </label>
            <label class="flex gap-3 items-center">
              <span>Location</span>
              {{
                game.data.location_type === "IN_PERSON" ? "In Person" : "Online"
              }}
              {{ game.data.location ? ` (${game.data.location})` : "" }}
            </label>
          </div>
          <fieldset
            class="flex flex-col sm:flex-row gap-5 border rounded border-stone-500 p-4 my-3"
          >
            <legend>Game Results</legend>
            <label>
              <span class="block">Win?</span>
              {{ game.data?.win ? "Yes" : "No" }}
            </label>
          </fieldset>
        </div>
        <img
          :src="scriptLogo(game.data.script)"
          class="w-48 md:w-64 h-48 md:h-64"
        />
      </div>
      <template v-if="game.data.notes || game.data.image_urls.length">
        <h3 class="font-dumbledor text-2xl">Notes and Images</h3>
        <p
          v-if="game.data.notes"
          class="bg-stone-100 p-4 shadow-lg my-3 whitespace-pre-wrap"
        >
          {{ game.data.notes }}
        </p>
        <div class="flex flex-col gap-5">
          <div class="flex flex-wrap gap-5">
            <div v-for="file in game.data.image_urls" :key="file">
              <a
                :href="fullImageUrl(file)"
                target="_blank"
                class="w-full sm:w-1/2 md:w-64 md:h-64"
              >
                <img
                  :src="fullImageUrl(file)"
                  class="w-full sm:w-1/2 md:w-64 md:h-64 object-cover shadow-lg"
                />
              </a>
            </div>
          </div>
        </div>
      </template>
      <div
        v-if="player.data.user_id === user?.id"
        class="pt-4 flex justify-between md:justify-end gap-4"
      >
        <nuxt-link
          class="bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded inline-flex items-center justify-center gap-1 flex-1 md:flex-initial"
          :to="`/@${route.params.username}/game/${route.params.id}/edit`"
          ><svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 32 32"
          >
            <path
              fill="currentColor"
              d="M2 26h28v2H2zM25.4 9c.8-.8.8-2 0-2.8l-3.6-3.6c-.8-.8-2-.8-2.8 0l-15 15V24h6.4l15-15zm-5-5L24 7.6l-3 3L17.4 7l3-3zM6 22v-3.6l10-10l3.6 3.6l-10 10H6z"
            />
          </svg>
          Edit
        </nuxt-link>
        <button
          @click="deleteGame"
          class="bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded inline-flex items-center justify-center gap-1 flex-1 md:flex-initial"
          :href="`/@${route.params.username}/game/${route.params.id}/edit`"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 512 512"
          >
            <path
              d="M400 113.3h-80v-20c0-16.2-13.1-29.3-29.3-29.3h-69.5C205.1 64 192 77.1 192 93.3v20h-80V128h21.1l23.6 290.7c0 16.2 13.1 29.3 29.3 29.3h141c16.2 0 29.3-13.1 29.3-29.3L379.6 128H400v-14.7zm-193.4-20c0-8.1 6.6-14.7 14.6-14.7h69.5c8.1 0 14.6 6.6 14.6 14.7v20h-98.7v-20zm135 324.6v.8c0 8.1-6.6 14.7-14.6 14.7H186c-8.1 0-14.6-6.6-14.6-14.7v-.8L147.7 128h217.2l-23.3 289.9z"
              fill="currentColor"
            />
            <path d="M249 160h14v241h-14z" fill="currentColor" />
            <path d="M320 160h-14.6l-10.7 241h14.6z" fill="currentColor" />
            <path d="M206.5 160H192l10.7 241h14.6z" fill="currentColor" />
          </svg>
          Delete
        </button>
      </div>
    </section>
    <template v-else>
      <Loading class="h-screen" />
    </template>
  </AuthenticatedTemplate>
</template>

<script setup lang="ts">
import dayjs from "dayjs";

const { scriptLogo } = useScripts();
const config = useRuntimeConfig();
const router = useRouter();
const route = useRoute();
const user = useSupabaseUser();
const users = useUsers();
const games = useGames();

const game = computed(() => games.getGame(route.params.id as string));
const player = computed(() => users.getUser(route.params.username as string));

watchEffect(() => {
  if (
    game.value.status === Status.ERROR ||
    player.value.status === Status.ERROR
  ) {
    router.push("/404");
  }
});

if (
  player.value.status === Status.SUCCESS &&
  game.value.status === Status.SUCCESS
) {
  useHead({
    title: `${player.value.data.username} | ${game.value.data.script}`,
    meta: [
      {
        hid: "description",
        name: "description",
        content: `Game of ${game.value.data.script} played by ${
          player.value.data.username
        } on ${dayjs(game.value.data.date).format("MMMM D, YYYY")}.`,
      },
      {
        property: "og:title",
        content: `${player.value.data.username} | ${game.value.data.script}`,
      },
      {
        property: "og:description",
        content: `Game of ${game.value.data.script} played by ${
          player.value.data.username
        } on ${dayjs(game.value.data.date).format("MMMM D, YYYY")}.`,
      },
      {
        property: "og:image",
        content: scriptLogo(game.value.data.script as string),
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
        content: `${player.value.data.username} | ${game.value.data.script}`,
      },
      {
        property: "twitter:description",
        content: `Game of ${game.value.data.script} played by ${
          player.value.data.username
        } on ${dayjs(game.value.data.date).format("MMMM D, YYYY")}.`,
      },
      {
        property: "twitter:image",
        content: scriptLogo(game.value.data.script as string),
      },
    ],
  });
}

const last_character = computed(() => {
  if (game.value.status === Status.SUCCESS) {
    return game.value.data.player_characters[
      game.value.data.player_characters.length - 1
    ];
  }
});

function fullImageUrl(file: string) {
  if (file.startsWith("http")) return file;
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

async function deleteGame() {
  if (confirm("Are you sure you want to delete this game?")) {
    const result = await fetch(`/api/games/${route.params.id}`, {
      method: "delete",
    }).then((res) => res.json());

    router.push(`/@${route.params.username}`);
  }
}

onMounted(() => {
  users.fetchUser(route.params.username as string);
  games.fetchGame(route.params.id as string);
});
</script>

<style scoped>
label span {
  @apply text-sm text-stone-500;
}
</style>
