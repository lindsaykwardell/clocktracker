import { v4 as uuidv4 } from "uuid";

export type Game = {
  id: string;
  date: string;
  script: string;
  location: string;
  playerCount: number;
  initialCharacter: string;
  alignment: "Good" | "Evil";
  final3: boolean;
  win: boolean;
};

export const useGames = () => {
  if (process.client) {
    let games: Game[] = JSON.parse(localStorage.getItem("games") || "[]") || [];

    return {
      games: computed<Game[]>({
        get: () => games,
        set: (value) => {
          localStorage.setItem("games", JSON.stringify(value));
          games = value;
        },
      }),
      addGame: (game: Partial<Game>) => {
        games.push({ ...game, id: uuidv4() } as Game);
        localStorage.setItem("games", JSON.stringify(games));
      },
    };
  } else {
    return {
      games: computed<Game[]>(() => []),
      addGame: (game: Partial<Game>) => {},
    }
  }
};
