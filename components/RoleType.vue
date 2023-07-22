<template>
  <div>
    <h3 class="font-dumbledor text-2xl text-center">Role Types</h3>
    <Pie id="alignment" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
import { Pie } from "vue-chartjs";

const props = defineProps<{
  games: (Game & {
    player_characters: (Character & {
      role?: { token_url: string; type: string };
      related_role?: { token_url: string };
    })[];
  })[];
}>();

const roles = computed(() => {
  const val = { townsfolk: 0, outsider: 0, minion: 0, demon: 0, traveler: 0 };

  for (const game of props.games) {
    for (const character of game.player_characters) {
      if (character.role?.type === "TOWNSFOLK") val.townsfolk++;
      if (character.role?.type === "OUTSIDER") val.outsider++;
      if (character.role?.type === "MINION") val.minion++;
      if (character.role?.type === "DEMON") val.demon++;
      if (character.role?.type === "TRAVELER") val.traveler++;
    }
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
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
}));
</script>
