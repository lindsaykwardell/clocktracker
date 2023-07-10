<template>
  <div class="flex flex-wrap">
    <div v-for="game in orderedGames" class="w-full sm:w-1/2 lg:w-1/3 p-2">
      <button
        @click="viewGame(game.id)"
        class="relative w-full bg-gradient-to-b from-purple-800 hover:from-purple-900 to-stone-900 hover:to-stone-950 flex flex-col items-center cursor-pointer rounded overflow-hidden text-black h-72"
      >
        <img
          v-if="game.image_urls[0]"
          :src="fullImageUrl(game.image_urls[0])"
          class="absolute bottom-0 w-full h-full object-cover blur"
        />
        <div
          class="flex-grow items-center justify-center flex font-julee text-3xl"
        >
          <div
            class="token bg-center bg-cover relative rounded-full w-48 h-48 shadow-xl border-black flex justify-center items-center"
          >
            <img
              class="w-40 h-40"
              :src="roles.toImage(game.player_characters[0].name)"
            />
          </div>
        </div>
        <div
          class="absolute bottom-0 w-full p-1 text-black text-left bg-stone-300"
        >
          {{ formatDate(game.date) }} |
          <span class="font-bold">
            {{ game.script }}
          </span>
        </div>
        <div
          class="absolute bottom-1 right-1 w-20 h-20 text-sm text-black font-julee flex flex-col justify-center items-center"
        >
          <img :src="scriptLogo(game.script)" class="w-full object-contain" />
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
import dayjs from "dayjs";
import naturalOrder from "natural-order";

const router = useRouter();
const { scriptLogo } = useScripts();
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
  return dayjs(date).format("MM/DD/YYYY");
}

function rowHighlight(game: Game & { player_characters: Character[] }) {
  if (game.player_characters[0].alignment === "GOOD") {
    if (game.win) {
      return "bg-blue-400 dark:bg-blue-800 hover:bg-blue-600";
    } else {
      return "bg-blue-200 dark:bg-blue-600 hover:bg-blue-400";
    }
  } else {
    if (game.win) {
      return "bg-red-400 dark:bg-red-800 hover:bg-red-600";
    } else {
      return "bg-red-200 dark:bg-red-600 hover:bg-red-400";
    }
  }
}

function viewGame(id: string) {
  router.push(`/@${props.username}/game/${id}`);
}

function fullImageUrl(file: string) {
  return `${config.public.supabase.url}/storage/v1/object/public/game-attachments/${file}`;
}
</script>

<style scoped>
th {
  @apply cursor-pointer select-none;
}
</style>
