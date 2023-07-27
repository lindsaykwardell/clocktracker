<template>
  <AuthenticatedTemplate>
    <section class="py-6">
      <h2 class="font-dumbledor text-4xl text-center">Add Game</h2>
      <GameEditor :game="game" @submit="submitGame" :inFlight="inFlight" />
    </section>
  </AuthenticatedTemplate>
</template>

<script setup lang="ts">
import dayjs from "dayjs";

definePageMeta({
  middleware: "auth",
});

useHead({
  title: "Add Game",
});

const router = useRouter();
const inFlight = ref(false);

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
  grimoire: {
    tokens: {
      alignment: "GOOD" | "EVIL" | "NEUTRAL" | undefined;
      order: number;
      is_dead: boolean;
      role_id?: string;
      role?: { token_url: string; type: string };
      related_role_id?: string;
      related_role?: { token_url: string };
    }[];
  }[];
}>({
  date: dayjs().format("YYYY-MM-DD"),
  script: "",
  script_id: null,
  storyteller: "",
  location_type: "ONLINE",
  location: "",
  community: "",
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
    },
  ],
  win: false,
  notes: "",
  image_urls: [],
  grimoire: [
    {
      tokens: [],
    },
  ],
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

  const { error } = await useFetch("/api/games", {
    method: "POST",
    body: JSON.stringify(formattedGame.value),
  });

  if (error.value) {
    inFlight.value = false;
    console.error(error.value);
  } else {
    router.push("/");
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
