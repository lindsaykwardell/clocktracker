<template>
  <AuthenticatedTemplate>
    <section class="py-6">
      <h2 class="font-dumbledor text-4xl text-center">Edit Game</h2>
      <GameEditor :game="game" @submit="submitGame" :inFlight="inFlight" />
    </section>
  </AuthenticatedTemplate>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { GameRecord } from "~/composables/useGames";
import { PrivacySetting } from "@prisma/client";

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const savedGame = await useFetch<GameRecord>(`/api/games/${route.params.id}`);
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
  co_storytellers: string[];
  is_storyteller: boolean;
  location_type: "ONLINE" | "IN_PERSON";
  location: string;
  community: string;
  player_count: number | null;
  traveler_count: number | null;
  player_characters: {
    name: string;
    role_id: string | null;
    alignment: "GOOD" | "EVIL" | "NEUTRAL" | undefined;
    showRelated: boolean;
    related: string;
    related_role_id: string | null;
    role?: {
      token_url: string;
      initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
    };
    related_role?: { token_url: string };
  }[];
  win: boolean;
  notes: string;
  image_urls: string[];
  grimoire: {
    id: number;
    tokens: {
      id: number;
      alignment: "GOOD" | "EVIL" | "NEUTRAL" | undefined;
      order: number;
      is_dead: boolean;
      role_id: string | null;
      role?: {
        token_url: string;
        type: string;
        initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
      };
      related_role_id: string | null;
      related_role?: { token_url: string };
      player_name: string;
      player_id?: string | null;
    }[];
  }[];
  is_grimoire_protected: boolean;
  ignore_for_stats: boolean;
  tags: string[];
  privacy: PrivacySetting;
}>({
  date: dayjs(savedGame.data.value?.date).format("YYYY-MM-DD"),
  script: savedGame.data.value?.script || "",
  script_id: savedGame.data.value?.script_id || null,
  storyteller: savedGame.data.value?.storyteller || "",
  co_storytellers: savedGame.data.value?.co_storytellers || [],
  is_storyteller: savedGame.data.value?.is_storyteller || false,
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
      role: character.role,
      related_role: character.related_role || {
        token_url: "/1x1.png",
      },
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
  grimoire: savedGame.data.value?.grimoire.length
    ? savedGame.data.value?.grimoire.map((grim) => ({
        id: grim.id,
        tokens: grim.tokens?.map((token) => ({
          id: token.id,
          alignment: token.alignment,
          order: token.order,
          is_dead: token.is_dead,
          role_id: token.role_id,
          role: token.role,
          related_role_id: token.related_role_id,
          related_role:
            token.related_role ||
            (token.role ? { token_url: "/1x1.png" } : undefined),
          player_name: token.player_name,
          player_id: token.player_id,
        })),
      }))
    : [
        {
          id: 0,
          tokens: [],
        },
      ],
  is_grimoire_protected: savedGame.data.value?.is_grimoire_protected || false,
  ignore_for_stats: savedGame.data.value?.ignore_for_stats || false,
  tags: savedGame.data.value?.tags || [],
  privacy: savedGame.data.value?.privacy || PrivacySetting.PUBLIC,
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

  try {
    const response = await $fetch(`/api/games/${savedGame.data.value?.id}`, {
      method: "PUT",
      body: JSON.stringify(formattedGame.value),
    });

    router.push(`/game/${savedGame.data.value?.id}`);
  } catch (err) {
    inFlight.value = false;
    console.error(err);
  }
}
</script>
