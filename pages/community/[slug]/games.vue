<template>
  <CommunityTemplate>
    <UserGamesView :games="communityGames" :player="null" />
  </CommunityTemplate>
</template>

<script setup lang="ts">
const games = useGames();
const route = useRoute();
const slug = route.params.slug as string;

const communityGames = computed(() => games.getByCommunity(slug));

onMounted(() => {
  games.fetchCommunityGames(slug);
});
</script>
