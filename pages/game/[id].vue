<template>
  <DashboardTemplate>
    <div class="flex flex-col items-center justify-center">
      <h1 class="text-4xl font-bold font-piratesbay">View Game</h1>
      <p class="text-2xl">{{ game.data.value?.script }}</p>
    </div>
  </DashboardTemplate>
</template>

<script setup lang="ts">
import type { game } from '@prisma/client';

const router = useRouter();
const route = useRoute();

const game = await useFetch<game>(`/api/games/${route.params.id}`);
</script>
