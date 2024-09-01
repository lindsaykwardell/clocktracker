import { Alignment, Role, WinStatus_V2 } from "@prisma/client";
import { GameRecord } from "./anonymizeGame";

export function winRateByRole(
  games: GameRecord[],
  role: Role
): {
  total: number;
  win: number;
} {
  return games.reduce(
    (acc, game) => {
      let win = acc.win;

      const character = (() => {
        if (game.is_storyteller) {
          return game.grimoire[game.grimoire.length - 1].tokens.find(
            (token) => token.role_id === role.id
          );
        } else {
          return game.player_characters[game.player_characters.length - 1];
        }
      })();

      if (!character || character.role_id !== role.id) return acc;

      if (
        game.win_v2 === WinStatus_V2.GOOD_WINS &&
        character.alignment === Alignment.GOOD
      ) {
        win++;
      } else if (
        game.win_v2 === WinStatus_V2.EVIL_WINS &&
        character.alignment === Alignment.EVIL
      ) {
        win++;
      }

      return { total: acc.total + 1, win };
    },
    { total: 0, win: 0 }
  );
}
