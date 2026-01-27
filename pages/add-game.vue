<template>
  <StandardTemplate>
    <section class="py-6">
      <h2 class="font-sorts text-4xl text-center">Add Game</h2>
      <p class="text-center italic text-stone-400 pt-6 text-sm">
        Adding more than one game?
        <!-- @todo apply link version of Button? -->
        <button
          @click="initImportGames"
          class="underline italic dark:hover:text-white hover:text-black"
        >
          Import multiple games
        </button>
      </p>
      <ClientOnly>
        <GameEditor :game="game" @submit="submitGame" :inFlight="inFlight" />
        <div class="text-center">
          <Button
            @click="resetGame"
            type="button"
            id="reset-game"
            color="caution"
            wide
            :disabled="inFlight"
          >
            Reset Game
          </Button>
        </div>
      </ClientOnly>
    </section>
  </StandardTemplate>
  <ImportGamesDialog
    v-model:visible="importGamesDialogVisible"
    @done="doneImporting"
  />
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { WinStatus_V2 } from "~/composables/useGames";

definePageMeta({
  middleware: "auth",
});

useHead({
  title: "Add Game",
});

const router = useRouter();
const route = useRoute();
const rolesStore = useRoles();
const inFlight = ref(false);
const userSettings = await useFetch("/api/settings");

const importGamesDialogVisible = ref(false);

function initImportGames() {
  importGamesDialogVisible.value = true;
}

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
  date: dayjs().format("YYYY-MM-DD"),
  script: "",
  script_id: null,
  bgg_id: null,
  ls_game_id: null,
  storyteller: "",
  co_storytellers: [],
  is_storyteller: false,
  location_type: "ONLINE",
  location: "",
  community_name: "",
  community_id: null,
  player_count: null,
  traveler_count: null,
  player_characters: [
    {
      name: "",
      alignment: "NEUTRAL",
      related: "",
      showRelated: false,
      role_id: null,
      related_role_id: null,
      role: {
        token_url: "/1x1.png",
        name: "",
        type: "",
        initial_alignment: "NEUTRAL",
      },
      related_role: {
        token_url: "/1x1.png",
      },
    },
  ],
  demon_bluffs: [
    // {
    //   name: "",
    //   role_id: null,
    //   role: {
    //     token_url: "/1x1.png",
    //     type: "",
    //   },
    // },
  ],
  fabled: [
    // {
    //   name: "",
    //   role_id: null,
    //   role: {
    //     token_url: "/1x1.png",
    //   },
    // },
  ],
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
  privacy: userSettings.data?.value?.privacy || "PUBLIC",
});

watch(game, () => {
  localStorage.setItem("draftGame", JSON.stringify(game));
});

onMounted(async () => {
  const importedGameId = route.query.imported_game as string;

  if (importedGameId) {
    // Clear any draft game to prevent conflicts with imported data
    localStorage.removeItem("draftGame");

    try {
      // Fetch roles first so we can populate role objects
      await rolesStore.fetchRoles();

      const { data, error } = await useFetch(
        `/api/digital_grimoire/hydrate/${importedGameId}`
      );

      if (error.value || !data.value) {
        console.error("Failed to hydrate imported game:", error.value);
        return;
      }

      const hydrated = data.value as {
        date: string;
        script: string;
        script_id: number | null;
        is_storyteller: boolean;
        location_type: "ONLINE" | "IN_PERSON";
        location: string;
        player_count: number;
        traveler_count: number;
        win_v2: WinStatus_V2;
        notes: string;
        demon_bluffs: { name: string; role_id: string | null }[];
        fabled: { name: string; role_id: string | null }[];
        grimoire: {
          tokens: {
            create: {
              role_id: string | null;
              alignment: "GOOD" | "EVIL" | "NEUTRAL";
              is_dead: boolean;
              used_ghost_vote: boolean;
              order: number;
              player_name: string;
              reminders: {
                create: { reminder: string; token_url: string }[];
              };
            }[];
          };
        }[];
      };

      // Transform grimoire tokens with role data
      const transformedGrimoire = hydrated.grimoire.map((g) => ({
        tokens: g.tokens.create.map((token) => {
          const role = token.role_id
            ? rolesStore.getRole(token.role_id)
            : undefined;
          return {
            alignment: token.alignment,
            order: token.order,
            is_dead: token.is_dead,
            used_ghost_vote: token.used_ghost_vote,
            role_id: token.role_id,
            role: role
              ? {
                  token_url: role.token_url,
                  type: role.type,
                  initial_alignment: role.initial_alignment,
                }
              : undefined,
            related_role_id: null,
            related_role: { token_url: "/1x1.png" },
            player_name: token.player_name,
            reminders: token.reminders.create,
          };
        }),
      }));

      // Transform demon bluffs with role data
      const transformedDemonBluffs = hydrated.demon_bluffs.map((bluff) => {
        const role = bluff.role_id
          ? rolesStore.getRole(bluff.role_id)
          : undefined;
        return {
          name: bluff.name,
          role_id: bluff.role_id,
          role: role
            ? {
                token_url: role.token_url,
                type: role.type,
              }
            : undefined,
        };
      });

      // Transform fabled with role data
      const transformedFabled = hydrated.fabled.map((fab) => {
        const role = fab.role_id ? rolesStore.getRole(fab.role_id) : undefined;
        return {
          name: fab.name,
          role_id: fab.role_id,
          role: role
            ? {
                token_url: role.token_url,
                type: role.type,
              }
            : undefined,
        };
      });

      // Populate the game object with hydrated data
      Object.assign(game, {
        date: dayjs(hydrated.date).format("YYYY-MM-DD"),
        script: hydrated.script,
        script_id: hydrated.script_id,
        is_storyteller: hydrated.is_storyteller,
        location_type: hydrated.location_type,
        location: hydrated.location,
        player_count: hydrated.player_count,
        traveler_count: hydrated.traveler_count,
        win_v2: hydrated.win_v2,
        notes: hydrated.notes,
        demon_bluffs: transformedDemonBluffs,
        fabled: transformedFabled,
        grimoire: transformedGrimoire,
      });
    } catch (e) {
      console.error("Error importing game:", e);
    }
  } else {
    // Only restore draft if not importing
    const draftGame = localStorage.getItem("draftGame");
    if (draftGame) {
      Object.assign(game, JSON.parse(draftGame));
    }
  }
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
  if (!game.win_v2) {
    alert("Please select a win condition.");
    return;
  }

  const privacyNotice = (() => {
    if (game.privacy === "PUBLIC") {
      return `, and this game will be publicly visible to anyone who visits the site.`;
    } else if (game.privacy === "PRIVATE") {
      return `, and this game will be visible to your friends and anyone you share the link with.`;
    } else {
      return ", and this game will be visible to your friends.";
    }
  })();
  if (
    game.date !== dayjs().format("YYYY-MM-DD") ||
    confirm(
      `Are you sure you are ready to save this game? Any tagged players will be notified${privacyNotice}`
    )
  ) {
    inFlight.value = true;

    const { data, error } = await useFetch("/api/games", {
      method: "POST",
      body: JSON.stringify(formattedGame.value),
    });

    if (error.value) {
      inFlight.value = false;
      console.error(error.value);
    } else {
      localStorage.removeItem("draftGame");
      router.push(`/game/${data.value?.id}?new=true`);
    }
  }
}

function resetGame() {
  if (confirm("Are you sure you want to reset your game details?")) {
    localStorage.removeItem("draftGame");
    Object.assign(game, {
      date: dayjs().format("YYYY-MM-DD"),
      script: "",
      script_id: null,
      storyteller: "",
      co_storytellers: [],
      is_storyteller: false,
      location_type: "ONLINE",
      location: "",
      community_name: "",
      community_id: null,
      player_count: null,
      traveler_count: null,
      player_characters: [
        {
          name: "",
          alignment: "NEUTRAL",
          related: "",
          showRelated: false,
          role_id: null,
          related_role_id: null,
          role: {
            token_url: "/1x1.png",
            name: "",
            type: "",
            initial_alignment: "NEUTRAL",
          },
          related_role: {
            token_url: "/1x1.png",
          },
        },
      ],
      demon_bluffs: [
        // {
        //   name: "",
        //   role_id: null,
        //   role: {
        //     token_url: "/1x1.png",
        //     type: "",
        //   },
        // },
      ],
      fabled: [
        // {
        //   name: "",
        //   role_id: null,
        //   role: {
        //     token_url: "/1x1.png",
        //   },
        // },
      ],
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
      privacy: userSettings.data?.value?.privacy || "PUBLIC",
    });
  }
}
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
