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
    player_characters: (Character & { role?: { token_url: string } })[];
  })[];
}>();

const { isTownsfolk, isOutsider, isMinion, isDemon, isTraveler } = useRoles();

const roles = computed(() => {
  const val = { townsfolk: 0, outsider: 0, minion: 0, demon: 0, traveler: 0 };

  for (const game of props.games) {
    for (const character of game.player_characters) {
      if (isTownsfolk(character.name)) val.townsfolk++;
      if (isOutsider(character.name)) val.outsider++;
      if (isMinion(character.name)) val.minion++;
      if (isDemon(character.name)) val.demon++;
      if (isTraveler(character.name)) val.traveler++;
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
