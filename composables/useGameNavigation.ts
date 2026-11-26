import { StorageSerializers, useLocalStorage } from "@vueuse/core";
import type { GameNavigationEntry } from "~/shared/gameNavigation";

export type { GameNavigationEntry };

/**
 * The games a games overview last showed, in its order and with its filters.
 * A game page uses it for its Previous and Next buttons, so it doesn't have to
 * load the whole game list itself.
 */
export type GameNavigationList = {
  /** The overview to go back to. */
  backTo: string;
  filtered: boolean;
  /**
   * The list's date order, if it's sorted by date: the buttons then say
   * Newer and Older instead of Previous and Next.
   */
  dateOrder: "asc" | "desc" | null;
  /** When it was saved (ms); an old list is ignored. */
  savedAt: number;
  games: GameNavigationEntry[];
};

/** How long a saved list is used for: after that it's from another session. */
export const GAME_NAVIGATION_LIST_LIFETIME_MS = 24 * 60 * 60 * 1000;

/**
 * Kept in local storage like the overview's filters, so a game opened in a
 * new tab or after a reload still has it.
 */
export function useGameNavigationList() {
  return useLocalStorage<GameNavigationList | null>("games__navigation", null, {
    serializer: StorageSerializers.object,
  });
}
