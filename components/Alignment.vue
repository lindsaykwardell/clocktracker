<template>
  <div>
    <h3 class="font-piratesbay text-2xl text-center">Alignment</h3>
    <Pie id="alignment" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
import { Pie } from "vue-chartjs";

const props = defineProps<{
  games: (Game & { player_characters: Character[] })[];
}>();

const alignment = computed(() => {
  const val = { good: 0, evil: 0 };

  for (const game of props.games) {
    if (game.player_characters[0].alignment === "GOOD") {
      val.good++;
    } else {
      val.evil++;
    }
  }

  return val;
});

const chartData = computed(() => ({
  labels: ["Good", "Evil"],
  datasets: [
    {
      data: [alignment.value.good, alignment.value.evil],
      hoverOffset: 4,
      backgroundColor: ["blue", "red"],
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
  },
}));
</script>
