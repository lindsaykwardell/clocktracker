import { defineStore } from "pinia";
import type { FetchStatus } from "./useFetchStatus";
import type {
  Game,
  Character,
  Grimoire,
  Token,
  DemonBluff,
  Fabled,
  ReminderToken,
} from "@prisma/client";
import naturalOrder from "natural-order";

export enum WinStatus_V2 {
  GOOD_WINS = "GOOD_WINS",
  EVIL_WINS = "EVIL_WINS",
  NOT_RECORDED = "NOT_RECORDED",
}

export enum GameEndTrigger {
  NOT_RECORDED = "NOT_RECORDED",
  TWO_PLAYERS_LEFT_ALIVE = "TWO_PLAYERS_LEFT_ALIVE",
  NO_LIVING_DEMON = "NO_LIVING_DEMON",
  CHARACTER_ABILITY = "CHARACTER_ABILITY",
  GAME_ENDED_EARLY = "GAME_ENDED_EARLY",
  OTHER = "OTHER",
}

export type FullCharacter = Character & {
  role?: {
    token_url: string;
    type: string;
    initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
  };
  related_role?: { token_url: string };
};

export type FullDemonBluff = DemonBluff & {
  role?: {
    token_url: string;
    type: string;
  };
};

export type FullFabled = Fabled & {
  role?: {
    token_url: string;
    type: string;
  };
};

export type GameRecord = Omit<Game, "win_v2"> & {
  ls_game?: {
    campaign?: {
      title: string;
      id: string;
    };
  };
  win_v2: WinStatus_V2;
  end_trigger: GameEndTrigger;
  end_trigger_role_id: string | null;
  end_trigger_note: string;
  end_trigger_seat_page: number | null;
  end_trigger_seat_order: number | null;
  end_trigger_role?: {
    token_url: string;
    type: string;
    initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
    name: string;
  } | null;
  player_characters: FullCharacter[];
  demon_bluffs: FullDemonBluff[];
  fabled: FullFabled[];
  user: {
    username: string;
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
        display_name: string;
        avatar: string;
      };
    })[];
  })[];
  parent_game?: {
    user: {
      username: string;
      display_name: string;
    };
  };
  child_games?: {
    id: string;
    user_id: string;
  }[];
  community?: {
    slug: string;
    icon: string;
  };
  associated_script?: {
    version: string;
    script_id: string;
    is_custom_script: boolean;
    logo: string | null;
    background: string | null;
  };
};

export type RecentGameRecord = GameRecord & {
  user: {
    user_id: string;
    username: string;
    display_name: string;
    avatar: string | null;
    pronouns: string | null;
    location: string | null;
  };
};

export const useGames = defineStore("games", {
  state: () => ({
    games: new Map<string, FetchStatus<GameRecord>>(),
    players: new Map<string, FetchStatus<number>>(),
    similar: new Map<string, FetchStatus<string[]>>(),
  }),
  getters: {
    getGame(): (gameId: string) => FetchStatus<GameRecord> {
      return (gameId: string) => {
        return this.games.get(gameId) || { status: Status.IDLE };
      };
    },
    /**
     * Build the timeline of the main player's tokens from the grimoire.
     * Keeps page order and only collapses exact consecutive duplicates.
     */
    getAlignmentTimeline(): (
      gameId: string
    ) => {
      alignment: Alignment | null;
      role_id: string | null;
      related_role_id: string | null;
      name: string | null;
      role?: {
        token_url?: string | null;
        type?: string | null;
        initial_alignment?: Alignment | null;
      } | null;
      related_role?: {
        token_url?: string | null;
      } | null;
    }[] {
      return (gameId: string) => {
        const gameStatus = this.games.get(gameId);
        if (!gameStatus || gameStatus.status !== Status.SUCCESS) return [];

        const game = gameStatus.data;
        const timeline: {
          alignment: Alignment | null;
          role_id: string | null;
          related_role_id: string | null;
          name: string | null;
          role?: {
            token_url?: string | null;
            type?: string | null;
            initial_alignment?: Alignment | null;
          } | null;
          related_role?: {
            token_url?: string | null;
          } | null;
        }[] = [];

        for (const page of game.grimoire) {
          for (const token of page.tokens) {
            if (token.player_id !== game.user_id) continue;

            const entry = {
              alignment: token.alignment,
              role_id: token.role_id,
              related_role_id: token.related_role_id,
              name: token.role?.name ?? null,
              role: token.role ?? null,
              related_role: token.related_role ?? null,
            };

            const last = timeline.at(-1);
            if (
              last &&
              last.alignment === entry.alignment &&
              last.role_id === entry.role_id &&
              last.related_role_id === entry.related_role_id
            ) {
              continue;
            }

            timeline.push(entry);
          }
        }

        return timeline;
      };
    },
    getSimilarGames(): (gameId: string) => GameRecord[] {
      return (gameId: string) => {
        const similar = this.similar.get(gameId);
        if (!similar || similar.status !== Status.SUCCESS) return [];

        return similar.data
          .map((gameId) => {
            const game = this.games.get(gameId);
            if (!game || game.status !== Status.SUCCESS) return null;
            return game.data;
          })
          .filter((g) => !!g) as GameRecord[];
      };
    },
    getByPlayer(): (username: string) => FetchStatus<GameRecord[]> {
      return (username: string) => {
        const users = useUsers();
        const user = users.getUser(username);
        if (user.status !== Status.SUCCESS) return user;
        const user_id = user.data.user_id;

        const playerStatus = this.players.get(username);
        if (!playerStatus) return { status: Status.IDLE };

        if (playerStatus.status !== Status.SUCCESS) return playerStatus;

        const games: GameRecord[] = [];
        for (const [_, gameStatus] of this.games) {
          if (gameStatus.status === Status.SUCCESS) {
            const game = gameStatus.data;
            if (game.user_id === user_id && !game.waiting_for_confirmation) {
              games.push(game);
            }
          }
        }

        return { status: Status.SUCCESS, data: games };
      };
    },
    getByCommunity(): (
      slug: string,
      options?: { includePrivate?: boolean }
    ) => FetchStatus<GameRecord[]> {
      return (slug: string, options?: { includePrivate?: boolean }) => {
        const includePrivate = options?.includePrivate ?? false;
        const communities = useCommunities();
        const community = communities.getCommunity(slug);
        if (community.status !== Status.SUCCESS) return community;

        const games: GameRecord[] = [];
        for (const user of community.data.members) {
          for (const [_, gameStatus] of this.games) {
            if (gameStatus.status === Status.SUCCESS) {
              const game = gameStatus.data;
              if (
                game.user_id === user.user_id &&
                game.community_id === community.data.id &&
                (includePrivate || game.privacy === "PUBLIC") &&
                game.parent_game_id === null
              ) {
                games.push(game);
              }
            }
          }
        }

        return { status: Status.SUCCESS, data: games };
      };
    },
    getPendingByPlayer(): (username: string) => FetchStatus<GameRecord[]> {
      return (username: string) => {
        const users = useUsers();
        const user = users.getUser(username);
        if (user.status !== Status.SUCCESS) return user;
        const user_id = user.data.user_id;

        const playerStatus = this.players.get(username);
        if (!playerStatus) return { status: Status.IDLE };

        if (playerStatus.status !== Status.SUCCESS) return playerStatus;

        const games: GameRecord[] = [];
        for (const [_, gameStatus] of this.games) {
          if (gameStatus.status === Status.SUCCESS) {
            const game = gameStatus.data;
            if (game.user_id === user_id && game.waiting_for_confirmation) {
              games.push(game);
            }
          }
        }

        return { status: Status.SUCCESS, data: games };
      };
    },
    getTagsByPlayer(): (username: string) => string[] {
      return (username: string) => {
        const games = this.getByPlayer(username);
        if (games.status !== Status.SUCCESS) return [];

        const tags = new Set<string>();
        for (const game of games.data) {
          for (const tag of game.tags) {
            tags.add(tag);
          }
        }

        return Array.from(tags);
      };
    },
    getCommunityNamesByPlayer(): (username: string) => string[] {
      return (username: string) => {
        const games = this.getByPlayer(username);
        if (games.status !== Status.SUCCESS) return [];

        const communities = new Set<string>();
        for (const game of games.data) {
          if (game.community_name) {
            communities.add(game.community_name);
          }
        }

        return Array.from(communities);
      };
    },
    getLocationsByPlayer(): (username: string) => string[] {
      return (username: string) => {
        const games = this.getByPlayer(username);
        if (games.status !== Status.SUCCESS) return [];

        const locations = new Set<string>();
        for (const game of games.data) {
          locations.add(game.location);
        }

        return Array.from(locations).filter((l) => !!l);
      };
    },
    getPreviouslyTaggedByPlayer(): (username?: string) => string[] {
      return (username?: string) => {
        if (!username) return [];
        const games = this.getByPlayer(username);
        if (games.status !== Status.SUCCESS) return [];

        const playerNames = new Set<string>();
        for (const game of games.data) {
          for (const grimoire of game.grimoire) {
            for (const token of grimoire.tokens) {
              if (token.player_name && !token.player_name.startsWith("@")) {
                playerNames.add(token.player_name);
              }
            }
          }
        }

        return Array.from(playerNames);
      };
    },
    getLastCharater(): (gameId: string) => FullCharacter {
      return (gameId: string) => {
        const dummyCharacter: FullCharacter = {
          id: 0,
          name: "",
          alignment: "NEUTRAL",
          related: null,
          game_id: gameId,
          role_id: null,
          related_role_id: null,
        };

        const game = this.games.get(gameId);
        if (!game || game.status !== Status.SUCCESS) return dummyCharacter;

        if (game.data.is_storyteller) {
          return {
            ...dummyCharacter,
            name: "STORYTELLER",
            role: {
              token_url: "/img/role/storyteller.webp",
              initial_alignment: "NEUTRAL",
              type: "STORYTELLER",
            },
          };
        }

        const characters = game.data.player_characters;
        if (characters.length === 0) return dummyCharacter;

        // Prefer the last alignment/role in the grimoire timeline if available.
        const grimAlignments = this.getAlignmentTimeline(gameId);
        if (grimAlignments.length) {
          const last = grimAlignments[grimAlignments.length - 1];
          const lastChar = characters[characters.length - 1];
          return {
            ...lastChar,
            alignment: last.alignment ?? lastChar.alignment,
            name: last.name ?? lastChar.name,
            role_id: last.role_id ?? lastChar.role_id,
            related_role_id: last.related_role_id ?? lastChar.related_role_id,
            role: last.role ?? lastChar.role,
            related_role: last.related_role ?? lastChar.related_role,
          };
        }

        return characters[characters.length - 1];
      };
    },
    allGamesLoadedForPlayer(): (username: string) => boolean {
      return (username: string) => {
        const playerStatus = this.players.get(username);
        if (!playerStatus) return false;

        const games = this.getByPlayer(username);

        return (
          playerStatus.status === Status.SUCCESS &&
          games.status === Status.SUCCESS &&
          games.data.length === playerStatus.data
        );
      };
    },
    getRecentScripts(): {
      name: string;
      id: number | null;
      version: string;
      url: string;
    }[] {
      const me = useMe();
      if (me.value.status !== Status.SUCCESS) return [];

      const games = this.getByPlayer(me.value.data.username);

      if (games.status !== Status.SUCCESS) return [];
      const orderedGames = naturalOrder(games.data)
        .orderBy("desc")
        .sort(["date"]);

      const scriptList: {
        name: string;
        id: number | null;
        version: string;
        url: string;
      }[] = [];

      for (const game of orderedGames) {
        if (scriptList.length >= 10) continue;

        if (
          game.script &&
          !scriptList.some(
            (s) => s.name === game.script && s.id === game.script_id
          )
        ) {
          scriptList.push({
            name: game.script,
            id: game.script_id,
            version: game.associated_script?.version ?? "",
            url: this.getScriptLink(game),
          });
        }
      }

      return scriptList;
    },
    getScriptLink(): (game: GameRecord) => string {
      return (game: GameRecord) => {
        if (game.script === "Sects & Violets")
          return "/scripts/Sects_and_Violets";

        if (game.script_id) {
          if (game.associated_script?.is_custom_script) {
            return `/scripts/${game.script.replaceAll(" ", "_")}?version=${
              game.associated_script.version
            }&id=${game.associated_script.script_id}`;
          } else {
            return `/scripts/${game.script.replaceAll(" ", "_")}?version=${
              game.associated_script?.version
            }`;
          }
        }

        return `https://botcscripts.com/?search=${game.script.replace(
          / /g,
          "+"
        )}&script_type=&include=&exclude=&edition=&author=`;
      };
    },
  },
  actions: {
    async fetchGame(gameId: string) {
      // Mark as loading if we don't have the user yet
      if (!this.games.has(gameId))
        this.games.set(gameId, { status: Status.LOADING });

      try {
        const game = await $fetch<GameRecord>(`/api/games/${gameId}`);

        this.games.set(gameId, {
          status: Status.SUCCESS,
          data: game,
        });
      } catch (err) {
        this.games.set(gameId, {
          status: Status.ERROR,
          error: err,
        });
      }
    },
    async fetchPlayerGames(username: string) {
      if (!this.players.has(username))
        this.players.set(username, { status: Status.LOADING });

      const games = await $fetch<GameRecord[]>(`/api/user/${username}/games`);

      this.players.set(username, { status: Status.SUCCESS, data: 1 });

      for (const game of games) {
        this.games.set(game.id, {
          status: Status.SUCCESS,
          data: game,
        });
      }

      const allGames = this.getByPlayer(username);
      if (allGames.status === Status.SUCCESS) {
        for (const game of allGames.data) {
          // If the game is in the new data, don't worry
          if (games.map((g) => g.id).includes(game.id)) continue;

          // Purge the game if it's not in the new data
          this.games.delete(game.id);
        }
      }
    },
    async fetchSimilarGames(gameId: string) {
      const user = useSupabaseUser();

      if (!user.value) return;

      if (!this.similar.has(gameId))
        this.similar.set(gameId, { status: Status.LOADING });

      const similar = await $fetch<GameRecord[]>(
        `/api/games/${gameId}/similar`
      );

      this.similar.set(gameId, {
        status: Status.SUCCESS,
        data: similar.map((g) => g.id),
      });

      for (const game of similar) {
        this.games.set(game.id, {
          status: Status.SUCCESS,
          data: game,
        });
      }
    },
    async fetchCommunityGames(slug: string) {
      const games = await $fetch<GameRecord[]>(`/api/games/community/${slug}`);

      for (const game of games) {
        this.games.set(game.id, {
          status: Status.SUCCESS,
          data: game,
        });
      }
    },
    async importGames(showLoader: () => void) {
      const this_ = this;

      return new Promise((resolve, reject) => {
        try {
          async function selectFile(e: Event) {
            showLoader();
            const uploadedFiles = (e.target as HTMLInputElement).files;
            if (!uploadedFiles) return;

            const file = Array.from(uploadedFiles)[0];

            const reader = new FileReader();
            reader.onload = async (e) => {
              const text = e.target?.result;
              if (typeof text === "string") {
                uploadImportedGames(text);
              }
            };

            reader.readAsText(file);
          }

          async function uploadImportedGames(csv: string) {
            try {
              const games = await $fetch<GameRecord[]>("/api/import", {
                method: "POST",
                body: JSON.stringify({ csv }),
              });

              for (const game of games) {
                this_.games.set(game.id, {
                  status: Status.SUCCESS,
                  data: game,
                });
              }

              resolve(games);
            } catch (err) {
              console.error(err);
              reject(err);
            }
          }

          const input = document.createElement("input");
          input.type = "file";
          // Accept only csv files
          input.accept = ".csv";
          input.onchange = selectFile;
          input.click();
        } catch (err) {
          console.error(err);
          reject(err);
        }
      });
    },
    async deleteGame(gameId: string, untagMyself?: boolean) {
      await $fetch(`/api/games/${gameId}?untag=${untagMyself}`, {
        method: "DELETE",
      });

      this.games.delete(gameId);
    },
    async deleteMultipleGames(gameIds: string[]) {
      await Promise.all(gameIds.map((id) => this.deleteGame(id)));
    },
  },
});

export function displayWinIcon(game: GameRecord, showTeamWin: boolean = false) {
  return game.is_storyteller || showTeamWin
    ? game.win_v2 === WinStatus_V2.GOOD_WINS
      ? "/img/role/good.webp"
      : game.win_v2 === WinStatus_V2.EVIL_WINS
      ? "/img/role/evil.webp"
      : "/1x1.png"
    : game.player_characters.length > 0
    ? (game.win_v2 === WinStatus_V2.GOOD_WINS &&
        game.player_characters[game.player_characters.length - 1].alignment ===
          "GOOD") ||
      (game.win_v2 === WinStatus_V2.EVIL_WINS &&
        game.player_characters[game.player_characters.length - 1].alignment ===
          "EVIL")
      ? "/img/win."
      : (game.win_v2 === WinStatus_V2.EVIL_WINS &&
          game.player_characters[game.player_characters.length - 1]
            .alignment === "GOOD") ||
        (game.win_v2 === WinStatus_V2.GOOD_WINS &&
          game.player_characters[game.player_characters.length - 1]
            .alignment === "EVIL")
      ? "/img/loss.png"
      : "/1x1.png"
    : "/1x1.png";
}

export function displayWinIconSvg(game: GameRecord, showTeamWin: boolean = false) {
  const lastChar = game.player_characters.at(-1);
  const win = game.win_v2;

  const icon = (color: string, title: string, content: string) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="${color}" viewBox="0 0 16 16">
      <title>${title}</title>
      ${content}
    </svg>
  `;

  const icons = {
    good: icon(
      "#3186e4",
      "Good won", 
      `
        <path d="M6.956 1.745C7.021.81 7.908.087 8.864.325l.261.066c.463.116.874.456 1.012.965.22.816.533 2.511.062 4.51a10 10 0 0 1 .443-.051c.713-.065 1.669-.072 2.516.21.518.173.994.681 1.2 1.273.184.532.16 1.162-.234 1.733q.086.18.138.363c.077.27.113.567.113.856s-.036.586-.113.856c-.039.135-.09.273-.16.404.169.387.107.819-.003 1.148a3.2 3.2 0 0 1-.488.901c.054.152.076.312.076.465 0 .305-.089.625-.253.912C13.1 15.522 12.437 16 11.5 16H8c-.605 0-1.07-.081-1.466-.218a4.8 4.8 0 0 1-.97-.484l-.048-.03c-.504-.307-.999-.609-2.068-.722C2.682 14.464 2 13.846 2 13V9c0-.85.685-1.432 1.357-1.615.849-.232 1.574-.787 2.132-1.41.56-.627.914-1.28 1.039-1.639.199-.575.356-1.539.428-2.59z"/>
        <path fill="currentColor" d="M8.864.046C7.908-.193 7.02.53 6.956 1.466c-.072 1.051-.23 2.016-.428 2.59-.125.36-.479 1.013-1.04 1.639-.557.623-1.282 1.178-2.131 1.41C2.685 7.288 2 7.87 2 8.72v4.001c0 .845.682 1.464 1.448 1.545 1.07.114 1.564.415 2.068.723l.048.03c.272.165.578.348.97.484.397.136.861.217 1.466.217h3.5c.937 0 1.599-.477 1.934-1.064a1.86 1.86 0 0 0 .254-.912c0-.152-.023-.312-.077-.464.201-.263.38-.578.488-.901.11-.33.172-.762.004-1.149.069-.13.12-.269.159-.403.077-.27.113-.568.113-.857 0-.288-.036-.585-.113-.856a2 2 0 0 0-.138-.362 1.9 1.9 0 0 0 .234-1.734c-.206-.592-.682-1.1-1.2-1.272-.847-.282-1.803-.276-2.516-.211a10 10 0 0 0-.443.05 9.4 9.4 0 0 0-.062-4.509A1.38 1.38 0 0 0 9.125.111zM11.5 14.721H8c-.51 0-.863-.069-1.14-.164-.281-.097-.506-.228-.776-.393l-.04-.024c-.555-.339-1.198-.731-2.49-.868-.333-.036-.554-.29-.554-.55V8.72c0-.254.226-.543.62-.65 1.095-.3 1.977-.996 2.614-1.708.635-.71 1.064-1.475 1.238-1.978.243-.7.407-1.768.482-2.85.025-.362.36-.594.667-.518l.262.066c.16.04.258.143.288.255a8.34 8.34 0 0 1-.145 4.725.5.5 0 0 0 .595.644l.003-.001.014-.003.058-.014a9 9 0 0 1 1.036-.157c.663-.06 1.457-.054 2.11.164.175.058.45.3.57.65.107.308.087.67-.266 1.022l-.353.353.353.354c.043.043.105.141.154.315.048.167.075.37.075.581 0 .212-.027.414-.075.582-.05.174-.111.272-.154.315l-.353.353.353.354c.047.047.109.177.005.488a2.2 2.2 0 0 1-.505.805l-.353.353.353.354c.006.005.041.05.041.17a.9.9 0 0 1-.121.416c-.165.288-.503.56-1.066.56z"/>
      `
    ),
    evil: icon(
      "#cc1a04",
      "Evil won", 
      `
        <path d="M6.956 14.534c.065.936.952 1.659 1.908 1.42l.261-.065a1.38 1.38 0 0 0 1.012-.965c.22-.816.533-2.512.062-4.51q.205.03.443.051c.713.065 1.669.071 2.516-.211.518-.173.994-.68 1.2-1.272a1.9 1.9 0 0 0-.234-1.734c.058-.118.103-.242.138-.362.077-.27.113-.568.113-.856 0-.29-.036-.586-.113-.857a2 2 0 0 0-.16-.403c.169-.387.107-.82-.003-1.149a3.2 3.2 0 0 0-.488-.9c.054-.153.076-.313.076-.465a1.86 1.86 0 0 0-.253-.912C13.1.757 12.437.28 11.5.28H8c-.605 0-1.07.08-1.466.217a4.8 4.8 0 0 0-.97.485l-.048.029c-.504.308-.999.61-2.068.723C2.682 1.815 2 2.434 2 3.279v4c0 .851.685 1.433 1.357 1.616.849.232 1.574.787 2.132 1.41.56.626.914 1.28 1.039 1.638.199.575.356 1.54.428 2.591"/>
        <path fill="currentColor" d="M8.864 15.674c-.956.24-1.843-.484-1.908-1.42-.072-1.05-.23-2.015-.428-2.59-.125-.36-.479-1.012-1.04-1.638-.557-.624-1.282-1.179-2.131-1.41C2.685 8.432 2 7.85 2 7V3c0-.845.682-1.464 1.448-1.546 1.07-.113 1.564-.415 2.068-.723l.048-.029c.272-.166.578-.349.97-.484C6.931.08 7.395 0 8 0h3.5c.937 0 1.599.478 1.934 1.064.164.287.254.607.254.913 0 .152-.023.312-.077.464.201.262.38.577.488.9.11.33.172.762.004 1.15.069.13.12.268.159.403.077.27.113.567.113.856s-.036.586-.113.856c-.035.12-.08.244-.138.363.394.571.418 1.2.234 1.733-.206.592-.682 1.1-1.2 1.272-.847.283-1.803.276-2.516.211a10 10 0 0 1-.443-.05 9.36 9.36 0 0 1-.062 4.51c-.138.508-.55.848-1.012.964zM11.5 1H8c-.51 0-.863.068-1.14.163-.281.097-.506.229-.776.393l-.04.025c-.555.338-1.198.73-2.49.868-.333.035-.554.29-.554.55V7c0 .255.226.543.62.65 1.095.3 1.977.997 2.614 1.709.635.71 1.064 1.475 1.238 1.977.243.7.407 1.768.482 2.85.025.362.36.595.667.518l.262-.065c.16-.04.258-.144.288-.255a8.34 8.34 0 0 0-.145-4.726.5.5 0 0 1 .595-.643h.003l.014.004.058.013a9 9 0 0 0 1.036.157c.663.06 1.457.054 2.11-.163.175-.059.45-.301.57-.651.107-.308.087-.67-.266-1.021L12.793 7l.353-.354c.043-.042.105-.14.154-.315.048-.167.075-.37.075-.581s-.027-.414-.075-.581c-.05-.174-.111-.273-.154-.315l-.353-.354.353-.354c.047-.047.109-.176.005-.488a2.2 2.2 0 0 0-.505-.804l-.353-.354.353-.354c.006-.005.041-.05.041-.17a.9.9 0 0 0-.121-.415C12.4 1.272 12.063 1 11.5 1"/>
      `
    ),
    win: icon(
      "#e28c1b",
      "Win", 
      `
        <path d="M2.5.5c0-.3.2-.5.5-.5h10c.3,0,.5.2.5.5,0,.5,0,1,0,1.5,1.6.3,2.7,1.8,2.5,3.4-.3,1.6-1.8,2.7-3.4,2.5,0,0-.1,0-.2,0-.8,1.9-1.9,2.8-2.8,3v2.2l1.4.4c.2,0,.4.1.5.3l1.8,1.4c.2.2.3.5,0,.7,0,.1-.2.2-.4.2H3c-.3,0-.5-.2-.5-.5,0-.2,0-.3.2-.4l1.8-1.4c.2-.1.3-.2.5-.3l1.4-.4v-2.2c-1-.2-2-1.1-2.8-3-1.6.4-3.2-.7-3.6-2.3-.4-1.6.7-3.2,2.3-3.6,0,0,.1,0,.2,0,0-.5,0-1,0-1.5"/>
        <path fill="currentColor" d="M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5q0 .807-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.194.048.377.135.537.255L13.3 15.1a.5.5 0 0 1-.3.9H3a.5.5 0 0 1-.3-.9l1.838-1.379c.16-.12.343-.207.537-.255L6.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33 33 0 0 1 2.5.5m.099 2.54a2 2 0 0 0 .72 3.935c-.333-1.05-.588-2.346-.72-3.935m10.083 3.935a2 2 0 0 0 .72-3.935c-.133 1.59-.388 2.885-.72 3.935M3.504 1q.01.775.056 1.469c.13 2.028.457 3.546.87 4.667C5.294 9.48 6.484 10 7 10a.5.5 0 0 1 .5.5v2.61a1 1 0 0 1-.757.97l-1.426.356a.5.5 0 0 0-.179.085L4.5 15h7l-.638-.479a.5.5 0 0 0-.18-.085l-1.425-.356a1 1 0 0 1-.757-.97V10.5A.5.5 0 0 1 9 10c.516 0 1.706-.52 2.57-2.864.413-1.12.74-2.64.87-4.667q.045-.694.056-1.469z"/>

      `
    ),
    loss: icon(
      "currentColor",
      "Loss", 
      `
        <path d="m13.3 15.1-1.8-1.4c-.2-.1-.3-.2-.5-.3L9.6 13v-2.2l-.8-.8c-.1 0-.2.2-.2.4V13c0 .5.3.9.8 1l1.4.4h.2l.6.5h-7l.6-.5h.2l1.4-.4c.4-.1.8-.5.8-1v-2.6c0-.3-.2-.5-.5-.5-.5 0-1.7-.5-2.6-2.9-.2-.5-.4-1.1-.5-1.8L2.8 4c.1 1.1.4 2.1.6 2.9-1.1.2-2.1-.5-2.3-1.6-.2-.8.2-1.6.9-2.1l-.7-.7c-1 .8-1.5 2-1.3 3.1.4 1.6 2 2.6 3.6 2.3.8 1.9 1.9 2.8 2.8 3v2.2l-1.4.4c-.2 0-.4.1-.5.3l-1.8 1.4c-.1 0-.2.2-.2.4 0 .3.2.5.5.5h10c.2 0 .3 0 .4-.2.2-.2.1-.5-.1-.7Z"/><path d="M13.5 2V.5c0-.5-.2-.5-.5-.5H2.9l1 1h8.6v1.5c-.1 2-.5 3.5-.9 4.7-.2.4-.3.8-.5 1.1l.7.7c.2-.3.4-.6.5-1h.2c1.6.3 3.2-.8 3.4-2.5s-.8-3.2-2.5-3.4ZM15 5.4c-.2 1.1-1.2 1.8-2.3 1.6.3-1 .6-2.3.7-3.9 1.1.2 1.8 1.2 1.6 2.3Z"/><path d="M1.036.877 1.743.17l12.02 12.021-.707.707z"/>
      `
    ),
    none: icon("No result", "")
  };

  // Storyteller or team win.
  if (game.is_storyteller || showTeamWin) {
    if (win === WinStatus_V2.GOOD_WINS) return icons.good;
    if (win === WinStatus_V2.EVIL_WINS) return icons.evil;
    return icons.none;
  }

  // Player-specific outcome.
  if (game.player_characters.length === 0) return icons.none;
  const alignment = lastChar.alignment;

  if (
    (win === WinStatus_V2.GOOD_WINS && alignment === "GOOD") ||
    (win === WinStatus_V2.EVIL_WINS && alignment === "EVIL")
  ) {
    return icons.win;
  }

  if (
    (win === WinStatus_V2.EVIL_WINS && alignment === "GOOD") ||
    (win === WinStatus_V2.GOOD_WINS && alignment === "EVIL")
  ) {
    return icons.loss;
  }

  return icons.none;
}

export function isStorytellerForGame<
  T extends {
    storyteller?: string | null;
    co_storytellers?: string[] | null;
    is_storyteller?: boolean | null;
  }
>(game: T, username: string): boolean {
  const isPrimaryST = game.storyteller === username;
  const isCoST = Array.isArray(game.co_storytellers)
    ? game.co_storytellers.includes(username)
    : false;
  const isFlagST = game.is_storyteller === true;

  return isPrimaryST || isCoST || isFlagST;
}

export function filterStorytellerGames<
  T extends {
    ignore_for_stats?: boolean | null;
    storyteller?: string | null;
    co_storytellers?: string[] | null;
    is_storyteller?: boolean | null;
  }
>(games: T[], username: string): T[] {
  return games.filter((game) => {
    if (game.ignore_for_stats) return false;
    return isStorytellerForGame(game, username);
  });
}
