<template>
  <section v-if="favoriteGames.length" class="grid grid-cols-1 md:grid-cols-2">
    <div>
      <GameOverviewGrid
        :games="favoriteGames"
        cardWidth="w-1/2 md:w-full lg:w-1/2"
      />
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
