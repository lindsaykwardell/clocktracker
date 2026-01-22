<template>
  <div
    v-if="userGames.status === Status.SUCCESS"
    class="space-y-8 md:space-y-12 xl:space-y-16 pb-4 lg:pb-8"
  >
    <!-- @todo improve graphically + copy to community-->
    <section class="px-4 lg:px-8 w-full xl:w-3/4 mx-auto">
      <UserStatsSummary :games="userGames.data" class="" />
    </section>

    <section>
      <template v-if="favoriteGames.length > 0">
        <GameOverviewGrid
          :games="favoriteGames"
        />
        <div v-if="isMe" class="flex justify-center items-center mt-2">
          <Button
            @click="showFavoritesDialog = !showFavoritesDialog"
            size="sm"
          >
            Manage Favorite Games
          </Button>
        </div>
      </template>
      <p v-else class="text-center text-2xl font-sorts">No games yet!</p>
    </section>

    <section class="px-4 lg:px-8">
      <StatsPlayerRoles 
        :games="userGames" 
        condensed 
      />
    </section>

    <section class="px-4 lg:px-8">
      <StatsStorytellerRoles 
        :games="userGames"
        :username="player.username"
        condensed 
      />
    </section>
  </div>
  <Dialog v-if="isMe" v-model:visible="showFavoritesDialog" size="xl">
    <template #title>
      <h2 class="text-2xl font-bold">Manage Favorites</h2>
      <p class="text-lg text-stone-400 py-4">
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
    .slice(0, 8);

  if (favorites.length > 0) {
    return favorites;
  } else {
    return naturalOrder(userGames.value.data)
      .orderBy("desc")
      .sort(["date"])
      .slice(0, 8);
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
