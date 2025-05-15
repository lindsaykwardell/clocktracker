<template>
  <StandardTemplate>
    <section class="py-6">
      <h2 class="font-sorts text-4xl text-center">Edit Multiple Games</h2>
      <ClientOnly>
        <GameEditor
          :game="game"
          @submit="submitGame"
          :inFlight="inFlight"
          editingMultipleGames
        />
      </ClientOnly>
    </section>
  </StandardTemplate>
  <ImportGamesDialog
    v-model:visible="importGamesDialogVisible"
    @done="doneImporting"
  />
</template>

<script setup lang="ts">
import { WinStatus_V2 } from "~/composables/useGames";

definePageMeta({
  middleware: "auth",
});

useHead({
  title: "Add Game",
});

const router = useRouter();
const inFlight = ref(false);
const selectMultipleGames = useSelectMultipleGames();

const importGamesDialogVisible = ref(false);

function doneImporting() {
  router.push("/");
}

const game = reactive<{
  date: string;
  script: string;
  script_id: number | null;
  bgg_id: number | null;
  ls_game_id: number | null;
  storyteller: string;
  co_storytellers: string[];
  is_storyteller: boolean | undefined;
  location_type: "ONLINE" | "IN_PERSON" | undefined;
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
      name: string;
      type: string;
      initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
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
  win_v2: WinStatus_V2 | undefined;
  notes: string;
  image_urls: string[];
  grimoire: {
    tokens: {
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
      reminders: { reminder: string; token_url: string }[];
    }[];
  }[];
  ignore_for_stats: boolean;
  tags: string[];
  privacy: string;
}>({
  date: "",
  script: "",
  script_id: null,
  bgg_id: null,
  ls_game_id: null,
  storyteller: "",
  co_storytellers: [],
  is_storyteller: undefined,
  location_type: undefined,
  location: "",
  community_name: "",
  community_id: null,
  player_count: null,
  traveler_count: null,
  player_characters: [],
  demon_bluffs: [],
  fabled: [],
  win_v2: undefined,
  notes: "",
  image_urls: [],
  grimoire: [
    {
      tokens: [],
    },
  ],
  ignore_for_stats: false,
  tags: [],
  privacy: "",
});

const formattedGame = computed(() => ({
  game_ids: selectMultipleGames.selectedGames,
  script: game.script,
  script_id: game.script_id,
  storyteller: game.storyteller,
  co_storytellers: game.co_storytellers,
  is_storyteller: game.is_storyteller,
  location_type: game.location_type,
  location: game.location,
  community_name: game.community_name,
  community_id: game.community_id,
  player_count: game.player_count,
  traveler_count: game.traveler_count,
  win_v2: game.win_v2,
  tags: game.tags,
  privacy: game.privacy,
}));

async function submitGame() {
  const privacyNotice = (() => {
    if (game.privacy === "PUBLIC") {
      return `, and these games will be publicly visible to anyone who visits the site.`;
    } else if (game.privacy === "PRIVATE") {
      return `, and these games will be visible to your friends and anyone you share the link with.`;
    } else {
      return ", and these games will be visible to your friends.";
    }
  })();
  if (
    confirm(
      `Are you sure you are ready to save these games? Any tagged players will be notified${privacyNotice}`
    )
  ) {
    inFlight.value = true;

    try {
      await $fetch("/api/games", {
        method: "PUT",
        body: JSON.stringify(formattedGame.value),
      });
      inFlight.value = false;
      router.back();
    } catch (error) {
      inFlight.value = false;
      console.error(error);
    }
  }
}

onMounted(() => {
  if (selectMultipleGames.selectedGames.length === 0) {
    router.push("/");
  } else if (selectMultipleGames.selectedGames.length === 1) {
    router.push(`/game/${selectMultipleGames.selectedGames[0]}/edit`);
  }
});
</script>

<style scoped>
input,
select {
  color: black;
  height: 2.5rem;
}

textarea {
  color: black;
}

label {
  flex: 1 1 0%;
}
</style>
