<template>
  <div>
    <h3 class="font-dumbledor text-2xl text-center">Top Characters</h3>
    <ul>
      <li v-for="(character, i) in characters" :key="character.name">
        {{ i + 1 }}.
        <a
          :href="`https://wiki.bloodontheclocktower.com/${character.name}`"
          target="_blank"
          class="hover:underline"
          >{{ character.name }}</a
        >
        ({{ character.count }})
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
const props = defineProps<{
  games: (Game & {
    player_characters: (Character & {
      role?: { token_url: string; type: string };
      related_role?: { token_url: string };
    })[];
  })[];
}>();

// Return the top five characters
const characters = computed(() => {
  const allPlayedCharacters = props.games
    .flatMap((game) => game.player_characters)
    .filter((character) => character.name && character.name !== "Storyteller");

  const characterCounts = allPlayedCharacters.reduce((acc, character) => {
    if (acc[character.name]) {
      acc[character.name]++;
    } else {
      acc[character.name] = 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const sortedCharacters = Object.entries(characterCounts).sort(
    (a, b) => b[1] - a[1]
  );

  return sortedCharacters.slice(0, 5).map((character) => ({
    name: character[0],
    count: character[1],
  }));
});
</script>
