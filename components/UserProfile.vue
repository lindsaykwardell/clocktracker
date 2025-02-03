<template>
  <section
    v-if="userGames.status === Status.SUCCESS"
    class="grid grid-cols-1 md:grid-cols-2"
  >
    <div class="row-span-3">
      <template v-if="favoriteGames.length > 0">
        <GameOverviewGrid
          :games="favoriteGames"
          cardWidth="w-1/2 md:w-full lg:w-1/2"
        />
        <div v-if="isMe" class="flex justify-center items-center">
          <button
            @click="showFavoritesDialog = !showFavoritesDialog"
            class="p-4 text-gray-400 hover:text-gray-200"
          >
            Manage Favorite Games
          </button>
        </div>
      </template>
      <p v-else class="text-center text-2xl font-sorts">No games yet!</p>
    </div>
    <div
      class="row-start-1 md:row-start-auto p-4 grid grid-cols-2 xl:grid-cols-4 gap-4"
    >
      <div
        class="border rounded border-stone-500 p-2 text-center text-lg font-bold bg-purple-200 dark:bg-purple-950"
      >
        {{ userGames.data.length }}
        {{ userGames.data.length === 1 ? "game" : "games" }}
      </div>
      <div
        class="border rounded border-stone-500 p-2 text-center text-lg font-bold bg-red-200 dark:bg-red-950"
      >
        {{ totalRoles }} {{ totalRoles === 1 ? "role" : "roles" }}
      </div>
      <div
        class="border rounded border-stone-500 p-2 text-center text-lg font-bold bg-green-200 dark:bg-green-950"
      >
        {{ totalScripts }}
        {{ totalScripts === 1 ? "script" : "scripts" }}
      </div>
      <div
        class="border rounded border-stone-500 p-2 text-center text-lg font-bold bg-blue-200 dark:bg-blue-950"
      >
        {{ totalWins }} {{ totalWins === 1 ? "win" : "wins" }}
      </div>
    </div>
    <UserRoles :games="userGames" condensed />
  </section>
  <Dialog v-if="isMe" v-model:visible="showFavoritesDialog" size="xl">
    <template #title>
      <h2 class="text-2xl font-bold">Manage Favorites</h2>
      <p class="text-lg text-stone-400 p-4">
        Click on a game to add or remove it from your favorites. Only six
        favorites are shown on your profile, but you can favorite as many games
        as you like.
      </p>
    </template>

    <div class="text-black dark:text-stone-200">
      <GameOverviewList
        v-if="userGames.status === Status.SUCCESS"
        :games="userGames.data"
        readonly
        :onClick="toggleFavorite"
      />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import naturalOrder from "natural-order";
import { Status } from "~/composables/useFetchStatus";

const games = useGames();
const users = useUsers();
const me = useMe();

const props = defineProps<{
  player: {
    username: string;
    user_id: string;
    display_name: string;
    avatar: string | null;
    pronouns: string | null;
    bio: string;
    location: string | null;
  };
}>();

const isMe = computed(() => {
  return (
    me.value.status === Status.SUCCESS &&
    me.value.data.user_id === props.player.user_id
  );
});

const userGames = computed(() => {
  return games.getByPlayer(props.player.username);
});

const totalScripts = computed(() => {
  if (userGames.value.status !== Status.SUCCESS) return 0;

  return userGames.value.data.reduce((scripts, game) => {
    if (!scripts.includes(game.script)) scripts.push(game.script);

    return scripts;
  }, [] as string[]).length;
});

const totalRoles = computed(() => {
  if (userGames.value.status !== Status.SUCCESS) return 0;

  return userGames.value.data.reduce((roles, game) => {
    game.player_characters.forEach((character) => {
      if (!roles.includes(character.name)) roles.push(character.name);
    });

    return roles;
  }, [] as string[]).length;
});

const totalWins = computed(() => {
  if (userGames.value.status !== Status.SUCCESS) return 0;

  return userGames.value.data.reduce((wins, game) => {
    if (game.is_storyteller) return wins;

    const lastCharacter =
      game.player_characters[game.player_characters.length - 1];

    if (!lastCharacter) return wins;

    switch (lastCharacter.alignment) {
      case "GOOD":
        if (game.win_v2 === "GOOD_WINS") {
          wins++;
        }
        break;
      case "EVIL":
        if (game.win_v2 === "EVIL_WINS") {
          wins++;
        }
        break;
    }

    return wins;
  }, 0);
});

const favoriteGames = computed(() => {
  const user = users.getUserById(props.player.user_id);

  if (user.status !== Status.SUCCESS) return [];

  if (userGames.value.status !== Status.SUCCESS) return [];

  const favorites = naturalOrder(
    userGames.value.data.filter((game) =>
      user.data.favorites.some((f) => f.game_id === game.id)
    )
  )
    .orderBy("desc")
    .sort(["date"])
    .slice(0, 6);

  if (favorites.length > 0) {
    return favorites;
  } else {
    return naturalOrder(userGames.value.data)
      .orderBy("desc")
      .sort(["date"])
      .slice(0, 6);
  }
});

const showFavoritesDialog = ref(false);

async function toggleFavorite(game: GameRecord) {
  if (me.value.status === Status.SUCCESS) {
    const result = await $fetch(`/api/games/${game.id}/favorite`, {
      method: "POST",
    });

    if (result.status === "added") {
      me.value.data.favorites.push(result.data);
    } else {
      me.value.data.favorites = me.value.data.favorites.filter(
        (f) => f.game_id !== game.id
      );
    }
  }
}
</script>
