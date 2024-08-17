export function useBGG() {
  const user = useSupabaseUser();
  const users = useUsers();
  const games = useGames();

  const bggInFlight = ref(false);

  const me = computed(() => {
    if (user.value) {
      return users.getUserById(user.value.id);
    }
    return null;
  });

  const canPostToBGG = computed(() => {
    return me.value?.status === Status.SUCCESS && !!me.value.data.bgg_username;
  });

  async function postToBGG(game: GameRecord, anonymize: boolean = false) {
    bggInFlight.value = true;

    if (game.bgg_id) {
      await $fetch(`/api/games/${game.id}/post_to_bgg`, {
        method: "DELETE",
      });
    } else {
      await $fetch(`/api/games/${game.id}/post_to_bgg`, {
        method: "POST",
        body: JSON.stringify({
          anonymize: anonymize,
        }),
      });
    }

    await games.fetchGame(game.id);
    bggInFlight.value = false;
  }

  async function postMultipleToBGG(
    gameIds: string[],
    anonymize: boolean = false
  ) {
    bggInFlight.value = true;

    await Promise.all(
      gameIds
        .filter((id) => {
          const game = games.getGame(id);
          return game.status === Status.SUCCESS && !game.data.bgg_id;
        })
        .map((id) => {
          return $fetch(`/api/games/${id}/post_to_bgg`, {
            method: "POST",
            body: JSON.stringify({
              anonymize: anonymize,
            }),
          });
        })
    );

    const username =
      me.value?.status === Status.SUCCESS ? me.value.data.username : null;

    if (username) {
      await games.fetchPlayerGames(username);
    }
    bggInFlight.value = false;
  }

  async function deleteMultipleFromBGG(gameIds: string[]) {
    bggInFlight.value = true;

    await Promise.all(
      gameIds
        .filter((id) => {
          const game = games.getGame(id);
          return game.status === Status.SUCCESS && game.data.bgg_id;
        })
        .map((id) => {
          return $fetch(`/api/games/${id}/post_to_bgg`, {
            method: "DELETE",
          });
        })
    );

    const username =
      me.value?.status === Status.SUCCESS ? me.value.data.username : null;

    if (username) {
      await games.fetchPlayerGames(username);
    }
    bggInFlight.value = false;
  }

  return {
    bggInFlight,
    canPostToBGG,
    postToBGG,
    postMultipleToBGG,
    deleteMultipleFromBGG,
  };
}
