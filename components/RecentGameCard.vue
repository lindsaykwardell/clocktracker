<template>
  <nuxt-link
    :to="`/@${game.user.username}/game/${game.id}`"
    class="shadow-lg bg-cover bg-center relative"
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
    <div class="z-10 w-full">
      <div class="flex items-center w-full p-2 m-auto gap-3">
        <Avatar
          :value="game.user.avatar || ''"
          class="border-2 shadow-xl flex-shrink"
          size="sm"
        />
        <div class="flex flex-col md:flex-row items-center gap-3 w-full">
          <div class="flex-grow flex flex-col">
            <h3 class="font-dumbledor text-lg">
              {{ game.user.display_name }}
            </h3>
            <div class="text-stone-300 text-sm">
              {{ game.user.username }}
            </div>
          </div>
        </div>
        <Token :character="lastCharacter" size="md" />
        <div>
          <img
            class="w-8 h-8 md:w-12 md:h-12 col-span-auto z-10"
            :src="game.win ? '/img/win.png' : '/img/loss.png'"
          />
        </div>
      </div>
      <div
        class="font-gothic text-white md:text-lg bg-gradient-to-tr from-black/75 via-black/50 to-black-25 p-1 flex justify-between"
      >
        <span>
          {{ game.script }}
        </span>
        <span>
          {{ formatDate(game.date) }}
        </span>
      </div>
    </div>
  </nuxt-link>
</template>

<script setup lang="ts">
import { RecentGameRecord } from "composables/useGames";
import dayjs from "dayjs";
const config = useRuntimeConfig();

const props = defineProps<{
  game: RecentGameRecord;
}>();

const lastCharacter = computed(() => {
  return props.game.player_characters[props.game.player_characters.length - 1];
});

function fullImageUrl(file: string) {
  if (file.startsWith("http")) return file;
  return `${config.public.supabase.url}/storage/v1/object/public/game-attachments/${file}`;
}

function formatDate(date: Date) {
  return dayjs(date).format("M/D/YYYY");
}
</script>

<style scoped>
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
