import type { Game, Character } from "@prisma/client";

export type ClientGame = Game & {
  player_characters: (Character & { role?: { token_url: string } })[];
};
