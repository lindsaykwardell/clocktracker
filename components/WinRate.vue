<template>
  <div>
    <h3 class="font-piratesbay text-2xl text-center">Win Rate</h3>
    <Bar id="winrate" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { Game } from "composables/useGames";
import { Bar } from "vue-chartjs";

const props = defineProps<{
  games: Game[];
}>();

const chartData = computed(() => ({
  labels: ["Yes", "No"],
  datasets: [
    {
      label: "Good",
      data: [
        props.games.filter((game) => game.alignment === "Good" && game.win)
          .length,
        props.games.filter((game) => game.alignment === "Good" && !game.win)
          .length,
      ],
      backgroundColor: "blue",
    },
    {
      label: "Evil",
      data: [
        props.games.filter((game) => game.alignment === "Evil" && game.win)
          .length,
        props.games.filter((game) => game.alignment === "Evil" && !game.win)
          .length,
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
    },
    y: {
      stacked: true,
    },
  },
}));
</script>
