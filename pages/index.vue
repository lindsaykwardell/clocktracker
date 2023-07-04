<template>
  <template v-if="games?.length">
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
          <tr v-for="game in stats" :class="rowHighlight(game)">
            <td>{{ game.date }}</td>
            <td>{{ game.script }}</td>
            <td>{{ game.location }}</td>
            <td>{{ game.playerCount }}</td>
            <td>{{ game.initialCharacter }}</td>
            <td>{{ game.alignment }}</td>
            <td>
              {{ game.final3 === null ? "-" : game.final3 ? "Yes" : "No" }}
            </td>
            <td>{{ game.win ? "Yes" : "No" }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div
      class="flex flex-col md:flex-row flex-wrap items-center space-around gap-4 justify-center"
    >
      <Alignment class="w-full md:w-1/4" :games="games" />
      <WinRate class="w-full md:w-1/4" :games="games" />
    </div>
  </template>
  <template v-else>
    <p class="text-center text-2xl">No games yet!</p>
    <nuxt-link
      to="/add-game"
      class="bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded text-center text-2xl m-auto block w-[300px] my-8"
    >
      Add Your First Game
    </nuxt-link>
  </template>
</template>

<script setup lang="ts">
import { Game } from "composables/useGames";

const { games } = useGames();

const stats = computed(() => [...games.value].reverse());

function rowHighlight(game: Game) {
  if (game.alignment === "Good") {
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
