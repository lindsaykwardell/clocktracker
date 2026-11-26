/**
 * Characters who only think they're the character on their small token (the
 * Drunk, Lunatic and Marionette). Nothing they "do" with it happens in the
 * game, so a reminder from that character records no event.
 */
export const IMAGINED_ABILITY_ROLE_IDS = new Set(["drunk", "lunatic", "marionette"]);

type TokenLike = {
  role_id?: string | null;
  related_role_id?: string | null;
};

/**
 * Whether a reminder from one of these characters can only have come from a
 * Drunk, Lunatic or Marionette who thinks they're it: no seat has one of them
 * as their character, and one of those seats has it as their small token.
 */
export function isImaginedAbilitySource(tokens: TokenLike[], roleIds: string[]) {
  if (roleIds.length === 0) return false;
  const roles = new Set(roleIds);
  if (tokens.some((token) => !!token.role_id && roles.has(token.role_id))) {
    return false;
  }
  return tokens.some(
    (token) =>
      !!token.role_id &&
      IMAGINED_ABILITY_ROLE_IDS.has(token.role_id) &&
      !!token.related_role_id &&
      roles.has(token.related_role_id)
  );
}
