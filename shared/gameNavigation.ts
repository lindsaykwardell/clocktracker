/**
 * One game in the list a game page's Previous and Next buttons go through
 * (see composables/useGameNavigation.ts and server/api/games/[id]/neighbors).
 */
export type GameNavigationEntry = {
  id: string;
  date: string;
  script: string | null;
  /** The owner's last character, or "Storyteller". Missing in older lists. */
  character?: string | null;
  alignment?: "GOOD" | "EVIL" | null;
};

/**
 * The character a game ends on, as the game page's header shows it: the
 * last one, "Storyteller", or the team when only that was recorded.
 */
export function gameNavigationCharacter(
  isStoryteller: boolean,
  last: { name?: string | null; alignment?: string | null } | null | undefined
): Pick<GameNavigationEntry, "character" | "alignment"> {
  if (isStoryteller) return { character: "Storyteller", alignment: null };
  const alignment =
    last?.alignment === "GOOD" || last?.alignment === "EVIL"
      ? last.alignment
      : null;
  if (last?.name) return { character: last.name, alignment };
  if (alignment) {
    return { character: alignment === "GOOD" ? "Good" : "Evil", alignment };
  }
  return { character: null, alignment: null };
}
