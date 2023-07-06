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
