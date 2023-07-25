<template>
  <AuthenticatedTemplate>
    <section class="max-w-[1000px] w-5/6 py-4 m-auto">
      <template
        v-if="
          recentGames.status === Status.IDLE ||
          recentGames.status === Status.LOADING
        "
      >
        <Loading class="h-screen" />
      </template>
      <template v-else-if="recentGames.status === Status.ERROR">
        <pre class="whitespace-pre-wrap">
        {{ JSON.stringify(recentGames.error, null, 4) }}
      </pre
        >
      </template>
      <template v-else-if="recentGames.status === Status.SUCCESS">
        <RecentGameCard
          :game="game"
          v-for="game in recentGames.data"
          class="w-full flex flex-col md:flex-row my-4"
        />
      </template>
    </section>
  </AuthenticatedTemplate>
</template>

<script setup lang="ts">
import type { FetchStatus } from "composables/useFetchStatus";
import type { RecentGameRecord } from "composables/useGames";
const games = useGames();

const recentGames = ref<FetchStatus<RecentGameRecord[]>>({
  status: Status.IDLE,
});

onMounted(() => {
  games
    .fetchRecent()
    .then((data) => (recentGames.value = { status: Status.SUCCESS, data }))
    .catch((err) => {
      console.error(err);
      recentGames.value = { status: Status.ERROR, error: err };
    });
});
</script>
