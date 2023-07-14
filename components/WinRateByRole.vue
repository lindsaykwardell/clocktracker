<template>
  <div>
    <h3 class="font-dumbledor text-2xl text-center">Win Rate</h3>
    <Bar id="winrate-by-role" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
import { Bar } from "vue-chartjs";

const { isTownsfolk, isOutsider, isMinion, isDemon, isTraveler } = useRoles();

const props = defineProps<{
  games: (Game & { player_characters: Character[] })[];
}>();

const chartData = computed(() => ({
  labels: ["Yes", "No"],
  datasets: [
    {
      label: "Townsfolk",
      data: [
        props.games.filter(
          (game) => isTownsfolk(game.player_characters[0].name) && game.win
        ).length,
        props.games.filter(
          (game) => isTownsfolk(game.player_characters[0].name) && !game.win
        ).length,
      ],
      backgroundColor: "blue",
    },
    {
      label: "Outsider",
      data: [
        props.games.filter(
          (game) => isOutsider(game.player_characters[0].name) && game.win
        ).length,
        props.games.filter(
          (game) => isOutsider(game.player_characters[0].name) && !game.win
        ).length,
      ],
      backgroundColor: "lightblue",
    },
    {
      label: "Minion",
      data: [
        props.games.filter(
          (game) => isMinion(game.player_characters[0].name) && game.win
        ).length,
        props.games.filter(
          (game) => isMinion(game.player_characters[0].name) && !game.win
        ).length,
      ],
      backgroundColor: "pink",
    },
    {
      label: "Demon",
      data: [
        props.games.filter(
          (game) => isDemon(game.player_characters[0].name) && game.win
        ).length,
        props.games.filter(
          (game) => isDemon(game.player_characters[0].name) && !game.win
        ).length,
      ],
      backgroundColor: "red",
    },
    {
      label: "Traveler",
      data: [
        props.games.filter(
          (game) => isTraveler(game.player_characters[0].name) && game.win
        ).length,
        props.games.filter(
          (game) => isTraveler(game.player_characters[0].name) && !game.win
        ).length,
      ],
      backgroundColor: "purple",
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      stacked: true,
      ticks: {
        min: 0,
        stepSize: 1,
        max: 4,
      },
    },
    y: {
      stacked: true,
      ticks: {
        min: 0,
        stepSize: 1,
        max: 4,
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
  },
}));
</script>
