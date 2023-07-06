<template>
  <div>
    <h3 class="font-piratesbay text-2xl text-center">Win Rate by Role</h3>
    <Bar id="winrate-by-role" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import type { game } from "@prisma/client";
import { Bar } from "vue-chartjs";

const { isTownsfolk, isOutsider, isMinion, isDemon, isTraveler } = useRoles();

const props = defineProps<{
  games: game[];
}>();

const chartData = computed(() => ({
  labels: ["Yes", "No"],
  datasets: [
    {
      label: "Townsfolk",
      data: [
        props.games.filter(
          (game) => isTownsfolk(game.initial_character) && game.win
        ).length,
        props.games.filter(
          (game) => isTownsfolk(game.initial_character) && !game.win
        ).length,
      ],
      backgroundColor: "blue",
    },
    {
      label: "Outsider",
      data: [
        props.games.filter(
          (game) => isOutsider(game.initial_character) && game.win
        ).length,
        props.games.filter(
          (game) => isOutsider(game.initial_character) && !game.win
        ).length,
      ],
      backgroundColor: "lightblue",
    },
    {
      label: "Minion",
      data: [
        props.games.filter(
          (game) => isMinion(game.initial_character) && game.win
        ).length,
        props.games.filter(
          (game) => isMinion(game.initial_character) && !game.win
        ).length,
      ],
      backgroundColor: "pink",
    },
    {
      label: "Demon",
      data: [
        props.games.filter(
          (game) => isDemon(game.initial_character) && game.win
        ).length,
        props.games.filter(
          (game) => isDemon(game.initial_character) && !game.win
        ).length,
      ],
      backgroundColor: "red",
    },
    {
      label: "Traveler",
      data: [
        props.games.filter(
          (game) => isTraveler(game.initial_character) && game.win
        ).length,
        props.games.filter(
          (game) => isTraveler(game.initial_character) && !game.win
        ).length,
      ],
      backgroundColor: "purple",
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
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
