<template>
  <div class="flex flex-wrap">
    <div
      v-for="game in games"
      class="w-1/2 lg:w-1/3 xl:w-1/4 border border-black"
    >
      <nuxt-link
        :to="`/@${username}/game/${game.id}`"
        class="relative w-full bg-gradient-to-b from-purple-800 hover:from-purple-900 to-stone-900 hover:to-stone-950 flex flex-col items-center cursor-pointer rounded overflow-hidden text-black h-48 md:h-72 bg-cover bg-center"
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
          <Token :character="game.last_character" size="lg" />
        </div>
        <div class="absolute w-full top-0 left-0" />
        <img
          class="absolute top-2 right-2 w-8 h-8 md:w-12 md:h-12"
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
        <div class="absolute bottom-0 left-0 w-full">
          <div
            class="font-gothic text-white md:text-lg bg-gradient-to-tr from-black/75 via-black/50 to-black-25 p-1"
          >
            {{ game.script }}
          </div>
        </div>
      </nuxt-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
import dayjs from "dayjs";

const config = useRuntimeConfig();

defineProps<{
  games: (Game & {
    player_characters: (Character & {
      role?: { token_url: string; type: string };
      related_role?: { token_url: string };
    })[];
    last_character: Character;
  })[];
  readonly?: boolean;
  username: string;
}>();

function formatDate(date: Date) {
  return dayjs(date).format("MM/DD/YYYY");
}

function fullImageUrl(file: string) {
  if (file.startsWith("http")) return file;
  return `${config.public.supabase.url}/storage/v1/object/public/game-attachments/${file}`;
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

.custom-script-name {
  -webkit-text-stroke-width: 1px;
  -webkit-text-stroke-color: white;
}
</style>
