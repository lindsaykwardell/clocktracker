<template>
  <div>
    <h3 class="font-dumbledor text-2xl text-center">Win Rate</h3>
    <Bar id="winrate-by-role" :data="chartData" :options="chartOptions" />
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
      label: "Townsfolk",
      data: [
        props.games.filter(
          (game) =>
            game.player_characters[game.player_characters.length - 1].role
              ?.type === "TOWNSFOLK" && game.win
        ).length,
        props.games.filter(
          (game) =>
            game.player_characters[game.player_characters.length - 1].role
              ?.type === "TOWNSFOLK" && !game.win
        ).length,
      ],
      backgroundColor: "blue",
    },
    {
      label: "Outsider",
      data: [
        props.games.filter(
          (game) =>
            game.player_characters[game.player_characters.length - 1].role
              ?.type === "OUTSIDER" && game.win
        ).length,
        props.games.filter(
          (game) =>
            game.player_characters[game.player_characters.length - 1].role
              ?.type === "OUTSIDER" && !game.win
        ).length,
      ],
      backgroundColor: "lightblue",
    },
    {
      label: "Minion",
      data: [
        props.games.filter(
          (game) =>
            game.player_characters[game.player_characters.length - 1].role
              ?.type === "MINION" && game.win
        ).length,
        props.games.filter(
          (game) =>
            game.player_characters[game.player_characters.length - 1].role
              ?.type === "MINION" && !game.win
        ).length,
      ],
      backgroundColor: "pink",
    },
    {
      label: "Demon",
      data: [
        props.games.filter(
          (game) =>
            game.player_characters[game.player_characters.length - 1].role
              ?.type === "DEMON" && game.win
        ).length,
        props.games.filter(
          (game) =>
            game.player_characters[game.player_characters.length - 1].role
              ?.type === "DEMON" && !game.win
        ).length,
      ],
      backgroundColor: "red",
    },
    {
      label: "Traveler",
      data: [
        props.games.filter(
          (game) =>
            game.player_characters[game.player_characters.length - 1].role
              ?.type === "TRAVELER" && game.win
        ).length,
        props.games.filter(
          (game) =>
            game.player_characters[game.player_characters.length - 1].role
              ?.type === "TRAVELER" && !game.win
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
