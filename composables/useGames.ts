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

export enum WinStatus {
  WIN = "WIN",
  LOSS = "LOSS",
  NOT_RECORDED = "NOT_RECORDED",
}

export enum WinStatus_V2 {
  GOOD_WINS = "GOOD_WINS",
  EVIL_WINS = "EVIL_WINS",
  NOT_RECORDED = "NOT_RECORDED",
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
  };
};

export type GameRecord = Omit<Game, "win" | "win_v2"> & {
  win: WinStatus;
  win_v2: WinStatus_V2;
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
    script_id: string;
    is_custom_script: boolean;
    logo: string | null;
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
    getByCommunity(): (slug: string) => FetchStatus<GameRecord[]> {
      return (slug: string) => {
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
                game.privacy === "PUBLIC" &&
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

        return Array.from(locations);
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
              token_url: "/img/role/storyteller.png",
              initial_alignment: "NEUTRAL",
              type: "STORYTELLER",
            },
          };
        }

        const characters = game.data.player_characters;
        if (characters.length === 0) return dummyCharacter;

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
    getRecentScripts(): { name: string; id: number | null; version: string }[] {
      const user = useSupabaseUser();
      if (!user.value) return [];
      const users = useUsers();
      const me = users.getUserById(user.value.id);
      if (me.status !== Status.SUCCESS) return [];

      const games = this.getByPlayer(me.data.username);

      if (games.status !== Status.SUCCESS) return [];
      const orderedGames = naturalOrder(games.data)
        .orderBy("desc")
        .sort(["date"]);

      const scriptList: { name: string; id: number | null; version: string }[] =
        [];

      for (const game of games.data) {
        if (scriptList.length >= 10) continue;

        if (
          !scriptList.some(
            (s) => s.name === game.script && s.id === game.script_id
          )
        ) {
          scriptList.push({
            name: game.script,
            id: game.script_id,
            version: game.associated_script?.version ?? "",
          });
        }
      }

      return scriptList;
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
    async fetchPlayerGames(
      username: string,
      config?: { show_tagged_games?: boolean }
    ) {
      if (!this.players.has(username))
        this.players.set(username, { status: Status.LOADING });

      const games = await $fetch<GameRecord[]>(
        `/api/user/${username}/games?show_tagged_games=${
          config?.show_tagged_games || false
        }`
      );

      if (!config?.show_tagged_games) {
        this.players.set(username, { status: Status.SUCCESS, data: 1 });
      }

      for (const game of games) {
        this.games.set(game.id, {
          status: Status.SUCCESS,
          data: game,
        });
      }

      // const allGames = this.getByPlayer(username);
      // if (allGames.status === Status.SUCCESS) {
      //   for (const game of allGames.data) {
      //     // If the game is in the new data, don't worry
      //     if (games.map((g) => g.id).includes(game.id)) continue;

      //     // Purge the game if it's not in the new data
      //     this.games.delete(game.id);
      //   }
      // }
    },
    async fetchRecentGamesForScript(scriptId: number) {
      const games = await $fetch<RecentGameRecord[]>(
        `/api/script/${scriptId}/recent`
      );

      for (const game of games) {
        this.games.set(game.id, {
          status: Status.SUCCESS,
          data: game,
        });
      }

      return games;
    },
    async fetchRecentGamesForRole(role_id: string) {
      const games = await $fetch<RecentGameRecord[]>(
        `/api/role/${role_id}/recent`
      );

      for (const game of games) {
        this.games.set(game.id, {
          status: Status.SUCCESS,
          data: game,
        });
      }

      return games;
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
  },
});

export function displayWinIcon(game: GameRecord) {
  const featureFlags = useFeatureFlags();

  if (featureFlags.isEnabled("win_status_v2")) {
    return game.is_storyteller
      ? game.win_v2 === WinStatus_V2.GOOD_WINS
        ? "/img/role/good.png"
        : game.win_v2 === WinStatus_V2.EVIL_WINS
        ? "/img/role/evil.png"
        : "/1x1.png"
      : game.player_characters.length > 0
      ? (game.win_v2 === WinStatus_V2.GOOD_WINS &&
          game.player_characters[game.player_characters.length - 1]
            .alignment === "GOOD") ||
        (game.win_v2 === WinStatus_V2.EVIL_WINS &&
          game.player_characters[game.player_characters.length - 1]
            .alignment === "EVIL")
        ? "/img/win.png"
        : (game.win_v2 === WinStatus_V2.EVIL_WINS &&
            game.player_characters[game.player_characters.length - 1]
              .alignment === "GOOD") ||
          (game.win_v2 === WinStatus_V2.GOOD_WINS &&
            game.player_characters[game.player_characters.length - 1]
              .alignment === "EVIL")
        ? "/img/loss.png"
        : "/1x1.png"
      : "/1x1.png";
  } else {
    return game.is_storyteller
      ? game.win === WinStatus.WIN
        ? "/img/role/good.png"
        : game.win === WinStatus.LOSS
        ? "/img/role/evil.png"
        : "/1x1.png"
      : game.win === WinStatus.WIN
      ? "/img/win.png"
      : game.win === WinStatus.LOSS
      ? "/img/loss.png"
      : "/1x1.png";
  }
}
