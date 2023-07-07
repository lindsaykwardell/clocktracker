<template>
  <div class="max-h-[500px] overflow-scroll">
    <table class="w-[1000px] md:w-full m-auto my-6">
      <thead class="font-bold font-piratesbay text-left text-xl">
        <tr>
          <th @click="orderGames('date')">
            Date
            <span v-if="orderBy === 'date'">
              {{ orderDirection === "asc" ? "⬆" : "⬇" }}
            </span>
          </th>
          <th @click="orderGames('script')">
            Script
            <span v-if="orderBy === 'script'">
              {{ orderDirection === "asc" ? "⬆" : "⬇" }}
            </span>
          </th>
          <th @click="orderGames('location')">
            Location
            <span v-if="orderBy === 'location'">
              {{ orderDirection === "asc" ? "⬆" : "⬇" }}
            </span>
          </th>
          <th @click="orderGames('player_count')">
            Players
            <span v-if="orderBy === 'player_count'">
              {{ orderDirection === "asc" ? "⬆" : "⬇" }}
            </span>
          </th>
          <th @click="orderGames('initial_character')">
            Initial Character
            <span v-if="orderBy === 'initial_character'">
              {{ orderDirection === "asc" ? "⬆" : "⬇" }}
            </span>
          </th>
          <th @click="orderGames('alignment')">
            End Alignment
            <span v-if="orderBy === 'alignment'">
              {{ orderDirection === "asc" ? "⬆" : "⬇" }}
            </span>
          </th>
          <th @click="orderGames('final3')">
            Final 3?
            <span v-if="orderBy === 'final3'">
              {{ orderDirection === "asc" ? "⬆" : "⬇" }}
            </span>
          </th>
          <th @click="orderGames('win')">
            Win?
            <span v-if="orderBy === 'win'">
              {{ orderDirection === "asc" ? "⬆" : "⬇" }}
            </span>
          </th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="game in orderedGames"
          :class="rowHighlight(game)"
          @click="viewGame(game.id)"
          class="cursor-pointer transition duration-150"
        >
          <td>{{ formatDate(game.date) }}</td>
          <td>{{ game.script }}</td>
          <td>{{ game.location }}</td>
          <td>{{ game.player_count }}</td>
          <td>{{ game.player_characters[0].name }}</td>
          <td>{{ game.player_characters[0].alignment }}</td>
          <td>
            {{ game.final3 === null ? "-" : game.final3 ? "Yes" : "No" }}
          </td>
          <td>{{ game.win ? "Yes" : "No" }}</td>
          <td v-if="!readonly">
            <button @click.stop="emits('delete', game.id)">
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
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
import dayjs from "dayjs";
import naturalOrder from "natural-order";

const router = useRouter();

const props = defineProps<{
  games: (Game & { player_characters: Character[] })[];
  readonly: boolean;
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
  router.push(`/game/${id}`);
}
</script>

<style scoped>
th {
  @apply cursor-pointer select-none;
}
</style>
