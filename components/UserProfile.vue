<template>
  <section
    v-if="userGames.status === Status.SUCCESS"
    class="grid grid-cols-1 md:grid-cols-2"
  >
    <div class="row-span-2">
      <GameOverviewGrid
        :games="favoriteGames"
        cardWidth="w-1/2 md:w-full lg:w-1/2"
      />
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
    <div>
      <UserRoles :games="userGames" condensed />
    </div>
  </section>
</template>

<script setup lang="ts">
import naturalOrder from "natural-order";

const games = useGames();
const users = useUsers();

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
</script>
