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
      <template v-if="profileGames.length > 0">
        <!-- Whole rows only: see .profile-games in app.vue. -->
        <div class="profile-games">
          <GameOverviewGrid :games="profileGames" />
        </div>
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
  <!-- Until the games are in (and before the request starts): the page's shape. -->
  <ProfileSkeleton
    v-else-if="userGames.status !== Status.ERROR"
    :show-manage="isMe"
  />
  <Dialog v-if="isMe" v-model:visible="showFavoritesDialog" size="xl">
    <template #title>
      <h2 class="text-2xl font-bold">Manage Favorites</h2>
      <p class="text-lg text-stone-400 py-4">
        Click on a game to add or remove it from your favorites. Your profile
        shows a different selection of your favorites on every visit, topped up
        with your latest games. You can favorite as many games as you like.
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

// The games at the top of the profile: the favourites in a random order (a
// new order on every visit), then the latest other games. More than fit in a
// row: .profile-games (app.vue) shows whole rows only, so how many appear
// depends on the width.
const PROFILE_GAMES = 10;
const shuffleKeys = new Map<string, number>();
function shuffleKey(gameId: string) {
  if (!shuffleKeys.has(gameId)) shuffleKeys.set(gameId, Math.random());
  return shuffleKeys.get(gameId)!;
}

const profileGames = computed(() => {
  const user = users.getUserById(props.player.user_id);

  if (user.status !== Status.SUCCESS) return [];

  if (userGames.value.status !== Status.SUCCESS) return [];

  const favoriteIds = new Set(user.data.favorites.map((f) => f.game_id));
  const all = userGames.value.data;
  const favorites = all
    .filter((game) => favoriteIds.has(game.id))
    .sort((a, b) => shuffleKey(a.id) - shuffleKey(b.id));
  const latest = naturalOrder(all.filter((game) => !favoriteIds.has(game.id)))
    .orderBy("desc")
    .sort(["date"]);

  return [...favorites, ...latest].slice(0, PROFILE_GAMES);
});

// The character walls need every role. Ask now, alongside the games, instead
// of after the walls mount (which waits for the games first).
const roles = useRoles();
onMounted(() => {
  roles.fetchRoles().catch((e) => console.error("Failed to fetch roles", e));
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
