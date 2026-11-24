<template>
  <!-- Draws a symbol from WinIconSprite (mounted once in app.vue). -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 16 16"
    role="img"
  >
    <title>{{ TITLES[result] }}</title>
    <use v-if="result !== 'none'" :href="`#win-icon-${result}`" />
  </svg>
</template>

<script setup lang="ts">
import type { GameResult } from "~/composables/useGames";

const TITLES: Record<GameResult, string> = {
  win: "Win",
  loss: "Loss",
  good: "Good won",
  evil: "Evil won",
  none: "No result",
};

defineProps<{ result: GameResult }>();
</script>
