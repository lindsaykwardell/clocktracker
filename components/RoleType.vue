<template>
  <div>
    <h3 class="font-piratesbay text-2xl text-center">Role Types</h3>
    <Pie id="alignment" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import type { game } from "@prisma/client";
import { Pie } from "vue-chartjs";

const props = defineProps<{
  games: game[];
}>();

const { isTownsfolk, isOutsider, isMinion, isDemon, isTraveler } = useRoles();

const roles = computed(() => {
  const val = { townsfolk: 0, outsider: 0, minion: 0, demon: 0, traveler: 0 };

  for (const game of props.games) {
    if (isTownsfolk(game.initial_character)) val.townsfolk++;
    if (isOutsider(game.initial_character)) val.outsider++;
    if (isMinion(game.initial_character)) val.minion++;
    if (isDemon(game.initial_character)) val.demon++;
    if (isTraveler(game.initial_character)) val.traveler++;
  }

  return val;
});

const chartData = computed(() => ({
  labels: ["Townsfolk", "Outsider", "Minion", "Demon", "Traveler"],
  datasets: [
    {
      data: [
        roles.value.townsfolk,
        roles.value.outsider,
        roles.value.minion,
        roles.value.demon,
        roles.value.traveler,
      ],
      hoverOffset: 4,
      backgroundColor: ["blue", "lightblue", "pink", "red", "purple"],
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
