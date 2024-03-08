import type {
  Game,
  Character,
  Grimoire,
  Token,
  ReminderToken,
} from "@prisma/client";
import { PrivacySetting, PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export type FullCharacter = Character & {
  role?: {
    token_url: string;
    type: string;
    initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
  };
  related_role?: { token_url: string };
};

export type GameRecord = Game & {
  player_characters: FullCharacter[];
  user: {
    username: string;
    privacy: PrivacySetting;
  };
  grimoire: (Grimoire & {
    tokens: (Token & {
      role?: {
        token_url: string;
        type: string;
        initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
        name: string;
      };
      related_role?: { token_url: string };
      reminders: ReminderToken[];
      player?: {
        username: string;
      };
    })[];
  })[];
  parent_game?: {
    user: {
      username: string;
      display_name: string;
    };
  };
  community?: {
    slug: string;
    icon: string;
  };
  associated_script?: {
    version: string;
  };
};

export async function anonymizeGame(
  game: GameRecord,
  user: User | null
): Promise<GameRecord> {
  // If the user is the game creator, we can return the game as is
  if (game.user_id === user?.id) return game;

  // We need to know if the user is a friend of the game creator
  const isFriend = !!(await prisma.friend.findFirst({
    where: {
      OR: [
        {
          user_id: game.user_id,
          friend_id: user?.id || "",
        },
        {
          user_id: user?.id || "",
          friend_id: game.user_id,
        },
      ],
    },
  }));

  /*
  | User Privacy | Game Privacy | Result                                                          |
  |-----------------------------------------------------------------------------------------------|
  | PUBLIC       | PUBLIC       | Game is fully visible.                                          |
  | PUBLIC       | PRIVATE      | Game is only visible to friends and people with the direct URL  |
  | PUBLIC       | FRIENDS ONLY | Game is only visible to friends.                                |
  | PRIVATE      | PUBLIC       | Game is discoverable and visible, but anonymized to non-friends |
  | PRIVATE      | PRIVATE      | Game is only visible to friends and people with the direct URL  | 
  | PRIVATE      | FRIENDS ONLY | Game is only visible to friends                                 | 
  | FRIENDS ONLY | PUBLIC       | Game is discoverable and visible, but anonymized to non-friends |
  | FRIENDS ONLY | PRIVATE      | Game is visible to friends and via URL, but anonymized          | 
  | FRIENDS ONLY | FRIENDS ONLY | Game is only visible to friends                                 |
  */

  // Modes where the game doesn't need to be anonymized:
  // Public user, public game
  // Public user, private game
  // Public user, friends only game
  // Private user, public game (friend)
  // Private user, private game (friend)
  // Private user, friends only game

  // Modes where the game _does_ need to be anonymized:
  // Private user, public game (not friend)
  // Private user, private game (not friend)
  // Friends only user, public game (not friend)
  // Friends only user, private game (not friend)

  if (
    !isFriend &&
    (game.user.privacy === PrivacySetting.PRIVATE ||
      game.user.privacy === PrivacySetting.FRIENDS_ONLY)
  ) {
    if (game.user.privacy === PrivacySetting.FRIENDS_ONLY) {
      game.user.username = "anonymous";
    }
    // Anonymize the game. All names should be shortened to their first character, excluding "@".
    game.storyteller = shortenName(game.storyteller);
    game.co_storytellers.map(shortenName);
    game.location = shortenName(game.location);
    game.community_name = shortenName(game.community_name);
    game.community = undefined;

    game.grimoire.map((g) =>
      g.tokens.map((t) => {
        t.player_id = null;
        if (t.player_name) {
          t.player_name = shortenName(t.player_name);
        }
      })
    );
  }

  return game;
}

function shortenName(name: string | null) {
  if (!name) return "";
  return ((name?.replace("@", "") ?? "")[0] + ".").toUpperCase();
}
