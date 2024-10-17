<template>
  <StandardTemplate>
    <section class="py-6">
      <h2 class="font-dumbledor text-4xl text-center">Edit Game</h2>
      <ClientOnly>
        <GameEditor :game="game" @submit="submitGame" :inFlight="inFlight" />
      </ClientOnly>
    </section>
  </StandardTemplate>
</template>

<script setup lang="ts">
import { WinStatus_V2 } from "~/composables/useGames";

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
  community_name: string;
  community_id: number | null;
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
      type: string;
    };
    related_role?: { token_url: string };
  }[];
  demon_bluffs: {
    name: string;
    role_id: string | null;
    role?: {
      token_url: string;
      type: string;
    };
  }[];
  fabled: {
    name: string;
    role_id: string | null;
    role?: {
      token_url: string;
      type: string;
    };
  }[];
  win_v2: WinStatus_V2;
  notes: string;
  image_urls: string[];
  grimoire: {
    id: number;
    tokens: {
      id: number;
      alignment: "GOOD" | "EVIL" | "NEUTRAL" | undefined;
      order: number;
      is_dead: boolean;
      used_ghost_vote: boolean;
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
      reminders: { reminder: string; token_url: string }[];
    }[];
  }[];
  ignore_for_stats: boolean;
  tags: string[];
  privacy: string;
}>({
  date: savedGame.data.value?.date.toString().slice(0, 10) || "",
  script: savedGame.data.value?.script || "",
  script_id: savedGame.data.value?.script_id || null,
  storyteller: savedGame.data.value?.storyteller || "",
  co_storytellers: savedGame.data.value?.co_storytellers || [],
  is_storyteller: savedGame.data.value?.is_storyteller || false,
  location_type: savedGame.data.value?.location_type || "ONLINE",
  location: savedGame.data.value?.location || "",
  community_name: savedGame.data.value?.community_name || "",
  community_id: savedGame.data.value?.community_id || null,
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
  demon_bluffs:
    savedGame.data.value?.demon_bluffs.map((demon_bluff) => ({
      name: demon_bluff.name,
      role_id: demon_bluff.role_id,
      role: demon_bluff.role || {
        token_url: "/1x1.png",
        type: "",
      },
    })) || [],
  fabled:
    savedGame.data.value?.fabled.map((fabled) => ({
      name: fabled.name,
      role_id: fabled.role_id,
      role: fabled.role || {
        token_url: "/1x1.png",
        type: "",
      },
    })) || [],
  win_v2: savedGame.data.value?.win_v2 || WinStatus_V2.NOT_RECORDED,
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
          used_ghost_vote: token.used_ghost_vote,
          role_id: token.role_id,
          role: token.role,
          related_role_id: token.related_role_id,
          related_role:
            token.related_role ||
            (token.role ? { token_url: "/1x1.png" } : undefined),
          player_name: token.player_name,
          player_id: token.player_id,
          reminders: token.reminders.map((reminder) => ({
            reminder: reminder.reminder,
            token_url: reminder.token_url,
          })),
        })),
      }))
    : [
        {
          id: 0,
          tokens: [],
        },
      ],
  ignore_for_stats: savedGame.data.value?.ignore_for_stats || false,
  tags: savedGame.data.value?.tags || [],
  privacy: savedGame.data.value?.privacy || "PUBLIC",
});

const formattedGame = computed(() => ({
  ...game,
  player_count: game.player_count || null,
  player_characters: game.player_characters.map((character) => ({
    name: character.name,
    alignment: character.alignment,
    related: character.related,
    role_id: character.role_id,
    related_role_id: character.related_role_id,
  })),
  demon_bluffs: game.demon_bluffs.map((demon_bluff) => ({
    name: demon_bluff.name,
    role_id: demon_bluff.role_id,
  })),
  fabled: game.fabled.map((fabled) => ({
    name: fabled.name,
    role_id: fabled.role_id,
  })),
}));

async function submitGame() {
  inFlight.value = true;

  try {
    const response = await $fetch(`/api/games/${savedGame.data.value?.id}`, {
      method: "PUT",
      body: JSON.stringify(formattedGame.value),
    });

    router.push(`/game/${savedGame.data.value?.id}?updated=true`);
  } catch (err: any) {
    inFlight.value = false;
    alert(err.statusMessage);
  }
}
</script>
