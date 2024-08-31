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

watchEffect(() => console.log(communityGames.value));

onMounted(() => {
  games.fetchCommunityGames(slug);
});
</script>
