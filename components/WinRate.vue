<template>
  <div>
    <h3 class="font-dumbledor text-2xl text-center">Win Rate</h3>
    <Bar id="winrate" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
import { Bar } from "vue-chartjs";

const props = defineProps<{
  games: (Game & {
    player_characters: (Character & {
      role?: { token_url: string; type: string };
      related_role?: { token_url: string };
    })[];
  })[];
}>();

const chartData = computed(() => ({
  labels: ["Yes", "No"],
  datasets: [
    {
      label: "Good",
      data: [
        props.games.filter(
          (game) =>
            game.player_characters[game.player_characters.length - 1]
              .alignment === "GOOD" && game.win
        ).length,
        props.games.filter(
          (game) =>
            game.player_characters[game.player_characters.length - 1]
              .alignment === "GOOD" && !game.win
        ).length,
      ],
      backgroundColor: "blue",
    },
    {
      label: "Evil",
      data: [
        props.games.filter(
          (game) =>
            game.player_characters[game.player_characters.length - 1]
              .alignment === "EVIL" && game.win
        ).length,
        props.games.filter(
          (game) =>
            game.player_characters[game.player_characters.length - 1]
              .alignment === "EVIL" && !game.win
        ).length,
      ],
      backgroundColor: "red",
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
