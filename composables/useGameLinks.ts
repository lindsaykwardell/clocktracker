import type { GameRecord } from "~/composables/useGames";
import { FriendStatus } from "~/composables/useFriends";

/**
 * Where a game card in a games overview goes, and whether it goes anywhere.
 * When you have your own copy of a game (you were tagged in it), the card
 * opens your copy.
 */
export function useGameLinks() {
  const me = useMe();
  const friends = useFriends();

  function getChildGameId(game: GameRecord) {
    if (me.value?.status !== Status.SUCCESS) return null;

    const userId = me.value.data.user_id;
    const childGame = game.child_games?.find((g) => g.user_id === userId);
    return childGame?.id ?? null;
  }

  /** The id of the game a card opens: yours if you have a copy. */
  function getLinkedGameId(game: GameRecord) {
    return getChildGameId(game) ?? game.id;
  }

  function getGameLink(game: GameRecord) {
    return `/game/${getLinkedGameId(game)}`;
  }

  function canViewGame(game: GameRecord) {
    if (game.privacy === "PUBLIC") return true;
    if (me.value?.status !== Status.SUCCESS) return false;

    if (me.value.data.user_id === game.user_id) return true;
    if (getChildGameId(game)) return true;

    if (game.privacy === "FRIENDS_ONLY") {
      return friends.getFriendStatus(game.user_id) === FriendStatus.FRIENDS;
    }

    return false;
  }

  return { getLinkedGameId, getGameLink, canViewGame };
}
