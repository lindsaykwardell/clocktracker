<template>
  <div class="flex flex-wrap">
    <div
      v-for="game in games"
      class="border border-black relative"
      :class="cardWidth"
    >
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
            ['Trouble Brewing', 'Sects and Violets', 'Bad Moon Rising'].indexOf(
              game.script
            ) === -1,
        }"
      >
        <img
          v-if="game.image_urls[0]"
          :src="fullImageUrl(game.image_urls[0])"
          class="absolute bottom-0 w-full h-full object-cover blur-sm"
          crossorigin="anonymous"
        />
        <div
          class="absolute top-0 left-0 text-white md:text-lg bg-gradient-to-br from-black/75 via-black/50 to-black-0 p-1"
        >
          {{ formatDate(game.date) }}
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
            <img :src="scripts.scriptLogo(game.script)" class="w-2/3" />
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
        <div class="flex-grow flex gap-1">
          <a
            v-if="game.bgg_id"
            target="_blank"
            :href="`https://boardgamegeek.com/play/details/${game.bgg_id}`"
            class="w-12 md:w-8"
          >
            <img src="/img/bgg.png" class="w-8 h-8 aspect-square" />
          </a>
          <div class="font-gothic text-white md:text-lg p-1">
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
        <nuxt-link
          v-if="!readonly"
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
  <div v-if="infiniteScroll">
    <div v-if="!pingedLoadMore" ref="loadMore" />
    <div v-else class="flex justify-center items-center py-6 w-full">
      <Loading />
    </div>
  </div>
</template>

<script setup lang="ts">
import { displayWinIcon } from "~/composables/useGames";
import { useInfiniteScroll } from "@vueuse/core";
const gamesStore = useGames();

const config = useRuntimeConfig();
const scripts = useScripts();

const props = defineProps<{
  games: GameRecord[];
  readonly?: boolean;
  cardWidth?: string;
  onCardClick?: (game: GameRecord) => void;
  infiniteScroll?: (skip: number) => void;
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

const loadMore = ref();
const pingedLoadMore = ref(false);

useInfiniteScroll(
  loadMore,
  () => {
    if (props.infiniteScroll) {
      if (!pingedLoadMore.value) {
        props.infiniteScroll(props.games.length);
        pingedLoadMore.value = true;
        return;
      }
    }
  },
  {
    distance: 30,
  }
);

watchEffect(() => {
  if (props.games.length) pingedLoadMore.value = false;
});
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
</style>
