<template>
  <div class="flex flex-wrap">
    <!-- Date, Location, Community, Script, Players, Character, Alignment, Win -->
    <div class="w-full grid grid-cols-12 px-2">
      <div class="col-span-3 md:col-span-2 xl:col-span-1">Character</div>
      <div class="hidden md:block md:col-span-2 xl:col-span-1 z-10">Date</div>
      <div class="col-span-6 md:col-span-2 xl:col-span-4 z-10">Script</div>
      <div class="hidden md:block md:col-span-2 z-10">Location</div>
      <div class="hidden md:block md:col-span-2 z-10">Community</div>
      <div class="hidden md:block md:col-span-1 z-10">Players</div>
      <div class="col-span-2 md:col-span-1 z-10 text-right md:text-left">
        Win/Loss
      </div>
    </div>
    <div v-for="game in games" class="w-full border border-black">
      <nuxt-link
        :to="`/@${username}/game/${game.id}`"
        class="relative w-full cursor-pointer overflow-hidden min-h-12 min-md:h-16 bg-cover grid grid-cols-12 bg-center items-center gap-2 p-2"
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
        <div class="absolute bottom-0 left-0 z-0 w-full h-full bg-black/50" />
        <Token :character="gamesStore.getLastCharater(game.id)" size="sm" />
        <div class="hidden md:block md:col-span-2 xl:col-span-1 z-10">
          {{ formatDate(game.date) }}
        </div>
        <div class="col-span-8 md:col-span-2 xl:col-span-4 z-10">
          {{ game.script }}
        </div>
        <div class="hidden md:block md:col-span-2 z-10">
          <template v-if="game.location_type === 'IN_PERSON'">
            {{ game.location || "In Person" }}
          </template>
          <template v-else> Online </template>
        </div>
        <div class="hidden md:block md:col-span-2 z-10">
          {{ game.community }}
        </div>
        <div class="hidden md:block md:col-span-1 z-10">
          {{ game.player_count }}
        </div>
        <img
          class="w-8 h-8 md:w-12 md:h-12 col-span-auto z-10"
          :src="
            game.is_storyteller
              ? game.win
                ? '/img/role/good.png'
                : '/img/role/evil.png'
              : game.win
              ? '/img/win.png'
              : '/img/loss.png'
          "
        />
      </nuxt-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { GameRecord } from "composables/useGames";
import dayjs from "dayjs";

const config = useRuntimeConfig();
const gamesStore = useGames();

defineProps<{
  games: GameRecord[];
  readonly?: boolean;
  username: string;
}>();

function formatDate(date: Date) {
  return dayjs(date).format("M/D/YYYY");
}

function fullImageUrl(file: string) {
  const transformations = "?width=500&height=100";
  if (file.startsWith("http")) return file + transformations;
  return `${config.public.supabase.url}/storage/v1/object/public/game-attachments/${file}${transformations}`;
}
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
</style>
