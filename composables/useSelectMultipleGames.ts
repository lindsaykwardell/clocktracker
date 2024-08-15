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
