<template>
  <StandardTemplate>
    <section class="py-6">
      <h2 class="font-dumbledor text-4xl text-center">Add Game</h2>
      <ClientOnly>
        <GameEditor :game="game" @submit="submitGame" :inFlight="inFlight" />
      </ClientOnly>
    </section>
  </StandardTemplate>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { WinStatus } from "~/composables/useGames";

definePageMeta({
  middleware: "auth",
});

useHead({
  title: "Add Game",
});

const router = useRouter();
const inFlight = ref(false);
const userSettings = await useFetch("/api/settings");

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
    };
  }[];
  win: WinStatus;
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
      alignment: "GOOD",
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
  win: WinStatus.NOT_RECORDED,
  notes: "",
  image_urls: [],
  grimoire: [
    {
      tokens: [],
    },
  ],
  ignore_for_stats: false,
  tags: [],
  privacy: userSettings.data.value?.privacy || "PUBLIC",
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
      router.push(`/game/${data.value?.id}`);
    }
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
