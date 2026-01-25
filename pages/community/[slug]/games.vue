<template>
  <CommunityTemplate v-slot="{ isMember }">
    <UserGamesView
      :games="communityGames(isMember)"
      :player="null"
      :showCommunityCard="true"
    />
  </CommunityTemplate>
</template>

<script setup lang="ts">
const games = useGames();
const route = useRoute();
const slug = route.params.slug as string;

const metadata = await $fetch(`/api/community/${slug}/minimal`);
const communityGames = (isMember: boolean) =>
  games.getByCommunity(slug, { includePrivate: isMember });

onMounted(() => {
  games.fetchCommunityGames(slug);
});

useHead({
  title: () => `Games - ${metadata.name}`,
});

</script>
