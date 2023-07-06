<template>
  <div class="w-full max-h-[500px] overflow-scroll">
    <table class="w-[1000px] md:w-11/12 m-auto my-6">
      <thead class="font-bold font-piratesbay text-left text-xl">
        <tr>
          <th>Date</th>
          <th>Script</th>
          <th>Location</th>
          <th>Player Count</th>
          <th>Initial Character</th>
          <th>End Alignment</th>
          <th>Final 3?</th>
          <th>Win?</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="game in games" :class="rowHighlight(game)">
          <td>{{ formatDate(game.date) }}</td>
          <td>{{ game.script }}</td>
          <td>{{ game.location }}</td>
          <td>{{ game.playerCount }}</td>
          <td>{{ game.initial_character }}</td>
          <td>{{ game.alignment }}</td>
          <td>
            {{ game.final3 === null ? "-" : game.final3 ? "Yes" : "No" }}
          </td>
          <td>{{ game.win ? "Yes" : "No" }}</td>
          <td>
            <button @click="emits('delete', game.id)">
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
// import the type "game" from prisma client
import type { game } from "@prisma/client";
import dayjs from "dayjs";

defineProps<{
  games: game[];
}>();

const emits = defineEmits(["delete"]);

function formatDate(date: Date) {
  return dayjs(date).format("MM/DD/YYYY");
}

function rowHighlight(game: game) {
  if (game.alignment === "GOOD") {
    if (game.win) {
      return "bg-blue-400 dark:bg-blue-800";
    } else {
      return "bg-blue-200 dark:bg-blue-600";
    }
  } else {
    if (game.win) {
      return "bg-red-400 dark:bg-red-800";
    } else {
      return "bg-red-200 dark:bg-red-600";
    }
  }
}
</script>
