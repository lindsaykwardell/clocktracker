<template>
  <AuthenticatedTemplate>
    <section class="py-6">
      <h2 class="font-dumbledor text-4xl text-center">Edit Game</h2>
      <GameEditor :game="game" @submit="submitGame" :inFlight="inFlight" />
    </section>
  </AuthenticatedTemplate>
</template>

<script setup lang="ts">
import type { Game, Character } from "@prisma/client";
import dayjs from "dayjs";
import { v4 as uuid } from "uuid";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const savedGame = await useFetch<
  Game & { player_characters: (Character & { role?: { token_url: string } })[] }
>(`/api/games/${route.params.id}`);
const user = useSupabaseUser();
const router = useRouter();
const inFlight = ref(false);

if (savedGame.error.value) {
  router.push("/404");
}

if (savedGame.data.value?.user_id !== user.value?.id) {
  router.push("/403");
}

useHead({
  title: "Edit Game",
});

const game = reactive<{
  date: string;
  script: string;
  script_id: number | null;
  storyteller: string;
  location_type: "ONLINE" | "IN_PERSON";
  location: string;
  community: string;
  player_count: number | null;
  traveler_count: number | null;
  player_characters: {
    name: string;
    alignment: string;
    showRelated: boolean;
    related: string;
    role_id: string | null;
    related_role_id: string | null;
  }[];
  win: boolean;
  notes: string;
  image_urls: string[];
}>({
  date: dayjs(savedGame.data.value?.date).format("YYYY-MM-DD"),
  script: savedGame.data.value?.script || "",
  script_id: savedGame.data.value?.script_id || null,
  storyteller: savedGame.data.value?.storyteller || "",
  location_type: savedGame.data.value?.location_type || "ONLINE",
  location: savedGame.data.value?.location || "",
  community: savedGame.data.value?.community || "",
  player_count: savedGame.data.value?.player_count || null,
  traveler_count: savedGame.data.value?.traveler_count || null,
  player_characters: savedGame.data.value?.player_characters.map(
    (character) => ({
      name: character.name,
      alignment: character.alignment,
      related: character.related || "",
      showRelated: !!character.related,
      role_id: character.role_id,
      related_role_id: character.related_role_id,
    })
  ) || [
    {
      name: "",
      alignment: "GOOD",
      related: "",
      showRelated: false,
      role_id: null,
      related_role_id: null,
    },
  ],
  win: savedGame.data.value?.win ? true : false,
  notes: savedGame.data.value?.notes || "",
  image_urls: savedGame.data.value?.image_urls || [],
});

const formattedGame = computed(() => ({
  ...game,
  date: dayjs(game.date).toISOString(),
  player_count: game.player_count || null,
  player_characters: game.player_characters.map((character) => ({
    name: character.name,
    alignment: character.alignment,
    related: character.related,
    role_id: character.role_id,
    related_role_id: character.related_role_id,
  })),
}));

async function submitGame() {
  inFlight.value = true;

  const result: Response = await fetch(
    `/api/games/${savedGame.data.value?.id}`,
    {
      method: "PUT",
      body: JSON.stringify(formattedGame.value),
    }
  );

  if (!result.ok) {
    inFlight.value = false;
    console.error(result.statusText);
  } else {
    router.push("/");
  }
}
</script>
