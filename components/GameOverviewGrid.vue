<template>
  <div class="flex flex-wrap">
    <div
      v-for="game in games"
      class="border border-black transition duration-150"
      :class="
        cardWidth +
        (selectMultipleGames.selectedGames.includes(game.id)
          ? ' bg-primary'
          : '')
      "
    >
      <div
        class="relative transition duration-150"
        :class="{
          'scale-90': selectMultipleGames.enabled,
        }"
      >
        <button
          v-if="selectMultipleGames.enabled"
          class="absolute top-0 left-0 w-full h-full z-50 cursor-pointer"
          @click="selectMultipleGames.toggleGame(game.id)"
        ></button>
        <component
          :is="componentIs"
          @click="handleCardClick(game)"
          :to="`/game/${game.id}`"
          class="w-full bg-stone-900 flex flex-col items-center cursor-pointer rounded overflow-hidden text-black h-48 md:h-72 bg-cover bg-center"
          :class="{
            'trouble-brewing': game.script === 'Trouble Brewing',
            'sects-and-violets': game.script === 'Sects and Violets',
            'bad-moon-rising': game.script === 'Bad Moon Rising',
            'custom-script':
              [
                'Trouble Brewing',
                'Sects and Violets',
                'Bad Moon Rising',
              ].indexOf(game.script) === -1,
          }"
        >
          <img
            v-if="game.image_urls[0]"
            :src="fullImageUrl(game.image_urls[0])"
            class="absolute bottom-0 w-full h-full object-cover blur-sm"
            crossorigin="anonymous"
          />
          <div
            class="absolute top-0 left-0 text-white md:text-lg bg-gradient-to-br from-black/75 via-black/50 to-black-0 p-1 flex gap-1 items-center"
          >
            <div v-if="isFavorite(game)" class="text-primary">
              <Star class="w-6" />
            </div>
            <div>{{ formatDate(game.date) }}</div>
          </div>
          <div class="absolute top-8 left-1 z-10">
            <Avatar
              v-if="game.community"
              :value="game.community.icon"
              size="sm"
              class="flex-shrink bg-stone-300 dark:bg-stone-950"
            />
          </div>
          <div
            class="flex-grow items-center justify-center flex font-dumbledor text-3xl"
          >
            <Token
              v-if="
                gamesStore.getLastCharater(game.id).name ||
                gamesStore.getLastCharater(game.id).alignment !== 'NEUTRAL'
              "
              :character="gamesStore.getLastCharater(game.id)"
              size="lg"
            />
            <div v-else class="bg-black/25 flex justify-center">
              <img
                :src="
                  game.associated_script?.logo ??
                  scripts.scriptLogo(game.script)
                "
                class="w-2/3"
              />
            </div>
          </div>
          <div class="absolute w-full top-0 left-0" />
          <img
            class="absolute top-2 right-2 w-8 h-8 md:w-12 md:h-12"
            :src="displayWinIcon(game)"
          />
        </component>
        <div
          class="absolute bottom-0 left-0 w-full flex justify-between bg-gradient-to-tr from-black/75 via-black/25 to-black/75"
        >
          <div
            class="absolute -top-12 left-0 p-1 flex gap-2 items-center bg-gradient-to-r from-black/75 via-black/50 to-black-0 h-12"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 256 256"
              class="text-yellow-400"
            >
              <path
                fill="currentColor"
                d="M64.12 147.8a4 4 0 0 1-4 4.2H16a8 8 0 0 1-7.8-6.17a8.35 8.35 0 0 1 1.62-6.93A67.8 67.8 0 0 1 37 117.51a40 40 0 1 1 66.46-35.8a3.94 3.94 0 0 1-2.27 4.18A64.08 64.08 0 0 0 64 144c0 1.28 0 2.54.12 3.8m182-8.91A67.76 67.76 0 0 0 219 117.51a40 40 0 1 0-66.46-35.8a3.94 3.94 0 0 0 2.27 4.18A64.08 64.08 0 0 1 192 144c0 1.28 0 2.54-.12 3.8a4 4 0 0 0 4 4.2H240a8 8 0 0 0 7.8-6.17a8.33 8.33 0 0 0-1.63-6.94Zm-89 43.18a48 48 0 1 0-58.37 0A72.13 72.13 0 0 0 65.07 212A8 8 0 0 0 72 224h112a8 8 0 0 0 6.93-12a72.15 72.15 0 0 0-33.74-29.93Z"
              />
            </svg>
            <div class="text-white font-bold flex items-center gap-2">
              {{ game.player_count }}
              <template v-if="game.traveler_count">
                (+{{ game.traveler_count }})
              </template>
              <div
                v-for="(player, index) in taggedPlayers(game)"
                class="tagged-players"
                :style="`--i: ${index}`"
              >
                <Avatar size="xs" :value="player?.avatar" />
              </div>
            </div>
          </div>
          <div class="flex-grow flex gap-1">
            <a
              v-if="game.bgg_id"
              target="_blank"
              :href="`https://boardgamegeek.com/play/details/${game.bgg_id}`"
              class="w-12 md:w-8"
            >
              <img src="/img/bgg.png" class="w-8 h-8 aspect-square" />
            </a>
            <div
              class="font-gothic text-white md:text-lg p-1 flex gap-1 items-center"
            >
              <div>
                {{ game.script }}
                <template
                  v-if="
                    game.associated_script && !scripts.isBaseScript(game.script)
                  "
                >
                  v{{ game.associated_script.version }}
                </template>
              </div>
            </div>
          </div>
          <nuxt-link
            v-if="isMyGame(game)"
            class="text-white font-bold px-4 rounded inline-flex items-center justify-center gap-1 flex-1 md:flex-initial"
            :to="`/game/${game.id}/edit`"
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
          </nuxt-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { displayWinIcon } from "~/composables/useGames";
const gamesStore = useGames();
const users = useUsers();
const me = useMe();

const config = useRuntimeConfig();
const scripts = useScripts();
const selectMultipleGames = useSelectMultipleGames();

const props = defineProps<{
  games: GameRecord[];
  cardWidth?: string;
  onCardClick?: (game: GameRecord) => void;
}>();

const componentIs = computed(() => {
  if (!props.games.length) return "div";
  return props.onCardClick ? "button" : defineNuxtLink({});
});

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(navigator.language, {
    timeZone: "UTC",
  }).format(new Date(date));
}

function fullImageUrl(file: string) {
  if (file.startsWith("http")) return file;
  return `${config.public.supabase.url}/storage/v1/object/public/game-attachments/${file}`;
}

const cardWidth = computed(() => props.cardWidth || "w-1/2 lg:w-1/3 xl:w-1/4");

function handleCardClick(game: GameRecord) {
  if (props.onCardClick) props.onCardClick(game);
}

function isFavorite(game: GameRecord) {
  const user = users.getUserById(game.user_id);

  if (user.status !== Status.SUCCESS) return false;

  return user.data.favorites.some((f) => f.game_id === game.id);
}

function isMyGame(game: GameRecord) {
  if (me.value.status !== Status.SUCCESS) return false;

  return me.value?.data.user_id === game.user_id;
}

const taggedPlayers = computed(
  () => (game: GameRecord) =>
    game.grimoire
      .flatMap((g) => g.tokens.filter((t) => t.player_id))
      .map((t) => t.player)
      .filter(
        (p, i, a) => p && a.findIndex((p2) => p2?.username === p.username) === i
      )
);
</script>

<style scoped>
th {
  @apply cursor-pointer select-none;
}

.trouble-brewing {
  background-image: url("/img/trouble-brewing-bg.webp");
}

.sects-and-violets {
  background-image: url("/img/sects-and-violets-bg.webp");
}

.bad-moon-rising {
  background-image: url("/img/bad-moon-rising-bg.webp");
}

.custom-script {
  background-image: url("/img/custom-script-bg.webp");
}

.custom-script-name {
  -webkit-text-stroke-width: 1px;
  -webkit-text-stroke-color: white;
}

.tagged-players {
  @apply relative;
  left: calc(var(--i) * -1.75rem);
}
</style>
