<template>
  <div>
    <h3 class="font-piratesbay text-2xl text-center">Role Types</h3>
    <Pie id="alignment" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
import { Pie } from "vue-chartjs";

const props = defineProps<{
  games: (Game & { player_characters: Character[] })[];
}>();

const { isTownsfolk, isOutsider, isMinion, isDemon, isTraveler } = useRoles();

const roles = computed(() => {
  const val = { townsfolk: 0, outsider: 0, minion: 0, demon: 0, traveler: 0 };

  for (const game of props.games) {
    if (isTownsfolk(game.player_characters[0].name)) val.townsfolk++;
    if (isOutsider(game.player_characters[0].name)) val.outsider++;
    if (isMinion(game.player_characters[0].name)) val.minion++;
    if (isDemon(game.player_characters[0].name)) val.demon++;
    if (isTraveler(game.player_characters[0].name)) val.traveler++;
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
