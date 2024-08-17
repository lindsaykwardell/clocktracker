export type SelectMultipleGames =
  | {
      type: "OFF";
    }
  | {
      type: "ON";
      games: string[];
    };

export const useSelectMultipleGames = defineStore("selectMultipleGames", {
  state: () => ({
    selection: { type: "OFF" } as SelectMultipleGames,
  }),
  getters: {
    selectedGames(): string[] {
      if (this.selection.type === "OFF") {
        return [];
      } else {
        return this.selection.games;
      }
    },
    enabled(): boolean {
      return this.selection.type === "ON";
    },
    selectedGamesHaveBGG(): boolean {
      const allGames = useGames();

      if (this.selection.type === "OFF") {
        return false;
      }

      return this.selection.games.some((game_id) => {
        const game = allGames.getGame(game_id);
        return game.status === Status.SUCCESS && !!game.data.bgg_id;
      });
    },
  },
  actions: {
    toggleMode() {
      this.selection =
        this.selection.type === "OFF"
          ? { type: "ON", games: [] }
          : { type: "OFF" };
    },
    toggleGame(game_id: string) {
      if (this.selection.type === "OFF") {
        return;
      }

      const index = this.selection.games.indexOf(game_id);
      if (index === -1) {
        this.selection.games.push(game_id);
      } else {
        this.selection.games.splice(index, 1);
      }
    },
  },
});
