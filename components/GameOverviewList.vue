<template>
  <div class="flex flex-wrap">
    <!-- Date, Location, Community, Script, Players, Character, Alignment, Win -->
    <div class="w-full grid grid-cols-12 px-2 text-xl">
      <div class="col-span-3 md:col-span-2 xl:col-span-1">Character</div>
      <div class="hidden md:block md:col-span-2 xl:col-span-1 z-10">Date</div>
      <div class="col-span-7 md:col-span-2 xl:col-span-4 z-10">Script</div>
      <div class="hidden md:block md:col-span-2 z-10">Location</div>
      <div class="hidden md:block md:col-span-2 z-10">Community</div>
      <div class="hidden md:block md:col-span-1 z-10">Players</div>
      <div class="w-8 h-8 md:w-12 md:h-12 col-span-1 z-10">Win/Loss</div>
    </div>
    <div v-for="game in orderedGames" class="w-full border border-black">
      <a
        :href="`/@${username}/game/${game.id}`"
        class="relative w-full cursor-pointer overflow-hidden h-20 md:h-28 bg-cover grid grid-cols-12 bg-center items-center gap-2 p-2 lg:text-lg xl:text-xl"
        :class="{
          'trouble-brewing': game.script === 'Trouble Brewing',
          'sects-and-violets': game.script === 'Sects & Violets',
          'bad-moon-rising': game.script === 'Bad Moon Rising',
          'custom-script':
            ['Trouble Brewing', 'Sects & Violets', 'Bad Moon Rising'].indexOf(
              game.script
            ) === -1,
        }"
      >
        <img
          v-if="game.image_urls[0]"
          :src="fullImageUrl(game.image_urls[0])"
          class="absolute bottom-0 w-full h-full object-cover blur"
        />
        <div class="absolute bottom-0 left-0 z-0 w-full h-full bg-black/50" />
        <div
          class="token bg-center bg-cover relative rounded-full w-16 h-16 md:w-24 md:h-24 shadow-xl border border-black flex justify-center items-center col-span-3 md:col-span-2 xl:col-span-1"
        >
          <img
            class="md:w-20 md:h-20"
            :src="
              roles.toImage(
                game.player_characters[game.player_characters.length - 1].name
              )
            "
            :onerror="`this.src='/img/role/${
              game.player_characters[game.player_characters.length - 1]
                .alignment === 'GOOD'
                ? 'good'
                : 'evil'
            }.png'; this.onerror=null;`"
          />
          <div
            v-if="
              game.player_characters[game.player_characters.length - 1].related
            "
            class="token bg-center bg-cover absolute bottom-0 right-0 rounded-full w-6 h-6 md:w-8 md:h-8 shadow-xl border border-black flex justify-center items-center"
          >
            <img
              class=""
              :src="
                roles.toImage(
                  game.player_characters[game.player_characters.length - 1]
                    .related || ''
                )
              "
            />
          </div>
        </div>
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
          :src="game.win ? '/img/win.png' : '/img/loss.png'"
        />
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
import dayjs from "dayjs";
import naturalOrder from "natural-order";

const roles = useRoles();
const config = useRuntimeConfig();

const props = defineProps<{
  games: (Game & { player_characters: Character[] })[];
  readonly?: boolean;
  username: string;
}>();
const emits = defineEmits(["delete"]);

const orderBy = ref("date");
const orderDirection = ref<"asc" | "desc">("desc");

const orderedGames = computed(() =>
  naturalOrder(props.games).orderBy(orderDirection.value).sort([orderBy.value])
);

function orderGames(column: string) {
  if (orderBy.value === column) {
    orderDirection.value = orderDirection.value === "asc" ? "desc" : "asc";
  } else {
    orderBy.value = column;
    orderDirection.value = "desc";
  }
}

function formatDate(date: Date) {
  return dayjs(date).format("M/D/YYYY");
}

function fullImageUrl(file: string) {
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
</style>
