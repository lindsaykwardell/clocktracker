import { defineStore } from "pinia";
import { markRaw } from "vue";
import type { FetchStatus } from "./useFetchStatus";
import type {
  Alignment,
  Game,
  Character,
  Grimoire,
  Token,
  DemonBluff,
  Fabled,
  ReminderToken,
} from "~/server/generated/prisma/client";
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
  ADDITIONAL_WIN_CONDITION = "ADDITIONAL_WIN_CONDITION",
  GAME_ENDED_EARLY = "GAME_ENDED_EARLY",
  OTHER = "OTHER",
}

export enum GameEndTriggerType {
  DEATH = "DEATH",
  EXECUTION = "EXECUTION",
  CHARACTER_CHANGE = "CHARACTER_CHANGE",
  EXTRA_WIN_CONDITION = "EXTRA_WIN_CONDITION",
  OTHER = "OTHER",
}

export enum GameEndTriggerCause {
  ABILITY = "ABILITY",
  NOMINATION = "NOMINATION",
  FAILED_ABILITY = "FAILED_ABILITY",
}

export enum GrimoireEventCause {
  ABILITY = "ABILITY",
  NOMINATION = "NOMINATION",
  /** A player called for a Traveller's exile; they are the source. */
  CALL_FOR_EXILE = "CALL_FOR_EXILE",
}

export enum GrimoireEventType {
  NOT_RECORDED = "NOT_RECORDED",
  DEATH = "DEATH",
  EXECUTION = "EXECUTION",
  /** A Traveller exiled: a death, but not an execution. */
  EXILE = "EXILE",
  REVIVE = "REVIVE",
  ROLE_CHANGE = "ROLE_CHANGE",
  SEAT_CHANGE = "SEAT_CHANGE",
  ALIGNMENT_CHANGE = "ALIGNMENT_CHANGE",
  MAD = "MAD",
  DRUNK = "DRUNK",
  POISONED = "POISONED",
  OTHER = "OTHER",
}

export type FullCharacter = Character & {
  role?: {
    token_url: string;
    type: string;
    initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
    alternate_token_urls?: string[] | null;
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

export type GameRecord = Omit<
  Game,
  | "win_v2"
  | "end_trigger"
  | "end_trigger_type"
  | "end_trigger_cause"
  | "end_trigger_role_id"
  | "end_trigger_subtype"
  | "end_trigger_note"
  | "end_trigger_participant_id"
  | "end_trigger_participant_alignment"
> & {
  ls_game?: {
    campaign?: {
      title: string;
      id: string;
    };
  };
  win_v2: WinStatus_V2;
  end_trigger: GameEndTrigger;
  end_trigger_type: GameEndTriggerType | null;
  end_trigger_cause: GameEndTriggerCause | null;
  end_trigger_role_id: string | null;
  end_trigger_subtype: string;
  end_trigger_note: string;
  end_trigger_participant_id: string | null;
  end_trigger_participant_alignment: "GOOD" | "EVIL" | "NEUTRAL" | null;
  end_trigger_role?: {
    id: string;
    token_url: string;
    type: string;
    initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
    name: string;
  } | null;
  grimoire_events: {
    id: number;
    grimoire_page: number;
    participant_id: string;
    event_type: GrimoireEventType;
    status_source: string | null;
    cause: GrimoireEventCause | null;
    by_participant_id: string | null;
    player_name: string;
    role_id: string | null;
    by_role_id: string | null;
    old_role_id: string | null;
    new_role_id: string | null;
    old_alignment: "GOOD" | "EVIL" | "NEUTRAL" | null;
    new_alignment: "GOOD" | "EVIL" | "NEUTRAL" | null;
    created_at: Date;
  }[];
  player_characters: FullCharacter[];
  demon_bluffs?: FullDemonBluff[];
  fabled?: FullFabled[];
  user: {
    username: string;
  };
  grimoire: (Grimoire & {
    tokens: (Token & {
      role?: {
        id: string;
        token_url: string;
        type: string;
        initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
        name: string;
      };
      related_role?: { token_url: string };
      reminders?: ReminderToken[];
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

        return Array.from(tags).sort((a, b) =>
          a.localeCompare(b, undefined, { sensitivity: "base" })
        );
      };
    },
    getCommunityNamesByPlayer(): (username: string) => string[] {
      return (username: string) => {
        const games = this.getByPlayer(username);
        if (games.status !== Status.SUCCESS) return [];

        const communities = new Set<string>();
        for (const game of games.data) {
          if (game.community_name?.trim()) {
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
          } as FullCharacter;
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
          data: markRaw(game),
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

      let games: GameRecord[];
      try {
        games = await useProtectedFetch()<GameRecord[]>(`/api/user/${username}/games`);
      } catch (error) {
        if (this.players.get(username)?.status !== Status.SUCCESS) {
          this.players.set(username, { status: Status.ERROR, error });
        }
        return;
      }

      // Batch all reactive updates into a single notification.
      // markRaw prevents Vue from creating deep Proxy wrappers for each game
      // (characters, grimoire, tokens, roles, etc.) — game data is read-only.
      const newGameIds = new Set(games.map((g) => g.id));
      this.$patch((state) => {
        state.players.set(username, { status: Status.SUCCESS, data: 1 });

        for (const game of games) {
          state.games.set(game.id, {
            status: Status.SUCCESS,
            data: markRaw(game),
          });
        }
      });

      // Purge stale games outside the patch (needs getter access)
      const allGames = this.getByPlayer(username);
      if (allGames.status === Status.SUCCESS) {
        const toDelete = allGames.data
          .filter((game) => !newGameIds.has(game.id))
          .map((game) => game.id);

        if (toDelete.length) {
          this.$patch((state) => {
            for (const id of toDelete) {
              state.games.delete(id);
            }
          });
        }
      }
    },
    async fetchSimilarGames(gameId: string) {
      const user = useUser();

      if (!user.value) return;

      if (!this.similar.has(gameId))
        this.similar.set(gameId, { status: Status.LOADING });

      const similar = await $fetch<GameRecord[]>(
        `/api/games/${gameId}/similar`
      );

      this.$patch((state) => {
        state.similar.set(gameId, {
          status: Status.SUCCESS,
          data: similar.map((g) => g.id),
        });

        for (const game of similar) {
          state.games.set(game.id, {
            status: Status.SUCCESS,
            data: markRaw(game),
          });
        }
      });
    },
    async fetchCommunityGames(slug: string) {
      let games: GameRecord[];
      try {
        games = await useProtectedFetch()<GameRecord[]>(`/api/games/community/${slug}`);
      } catch {
        return;
      }

      this.$patch((state) => {
        for (const game of games) {
          state.games.set(game.id, {
            status: Status.SUCCESS,
            data: markRaw(game),
          });
        }
      });
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

              this_.$patch((state) => {
                for (const game of games) {
                  state.games.set(game.id, {
                    status: Status.SUCCESS,
                    data: markRaw(game),
                  });
                }
              });

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

/** What a game's trophy shows: the player's own result, or which team won. */
export type GameResult = "win" | "loss" | "good" | "evil" | "none";

/**
 * The result the win/loss icon shows (see WinIcon and WinIconSprite).
 * Storytellers, or showTeamWin, get the winning team; players get their own
 * result from the alignment of their last character.
 */
export function gameResult(game: GameRecord, showTeamWin: boolean = false): GameResult {
  const win = game.win_v2;

  if (game.is_storyteller || showTeamWin) {
    if (win === WinStatus_V2.GOOD_WINS) return "good";
    if (win === WinStatus_V2.EVIL_WINS) return "evil";
    return "none";
  }

  const alignment = game.player_characters.at(-1)?.alignment;
  if (!alignment) return "none";

  if (
    (win === WinStatus_V2.GOOD_WINS && alignment === "GOOD") ||
    (win === WinStatus_V2.EVIL_WINS && alignment === "EVIL")
  ) {
    return "win";
  }

  if (
    (win === WinStatus_V2.EVIL_WINS && alignment === "GOOD") ||
    (win === WinStatus_V2.GOOD_WINS && alignment === "EVIL")
  ) {
    return "loss";
  }

  return "none";
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
