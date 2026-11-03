import { WinStatus_V2, type GameRecord } from "~/composables/useGames";
import { Status } from "~/composables/useFetchStatus";

const DAY_MS = 24 * 60 * 60 * 1000;

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  if (!config.public.isCapacitorBuild) return;

  const me = useMe();
  const games = useGames();

  // Sync stats to SharedPreferences whenever games change
  watch(
    [me, () => {
      if (me.value.status !== Status.SUCCESS) return null;
      const g = games.getByPlayer(me.value.data.username);
      return g.status === Status.SUCCESS ? g.data : null;
    }],
    async ([meVal, userGames]) => {
      if (meVal.status !== Status.SUCCESS || !userGames) return;

      const cutoff = Date.now() - 30 * DAY_MS;
      const gamesBefore: GameRecord[] = [];
      for (const game of userGames) {
        const time = new Date(game.date).getTime();
        if (Number.isFinite(time) && time <= cutoff) {
          gamesBefore.push(game);
        }
      }

      const stats = buildStats(userGames);
      const oldStats = buildStats(gamesBefore);
      const { Preferences } = await import("@capacitor/preferences");

      // Stats widget
      await Preferences.set({ key: "widget_display_name", value: meVal.data.display_name });
      await Preferences.set({ key: "widget_total_games", value: String(stats.totalGames) });
      await Preferences.set({ key: "widget_total_roles", value: String(stats.totalRoles) });
      await Preferences.set({ key: "widget_total_scripts", value: String(stats.totalScripts) });
      await Preferences.set({ key: "widget_win_rate", value: String(stats.winRate) });
      await Preferences.set({ key: "widget_favorite_role", value: stats.favoriteRole ?? "" });

      // 30-day trends
      await Preferences.set({ key: "widget_trend_games", value: trendString(stats.totalGames - oldStats.totalGames) });
      await Preferences.set({ key: "widget_trend_roles", value: trendString(stats.totalRoles - oldStats.totalRoles) });
      await Preferences.set({ key: "widget_trend_scripts", value: trendString(stats.totalScripts - oldStats.totalScripts) });
      await Preferences.set({
        key: "widget_trend_win_rate",
        value: oldStats.winRate === 0
          ? ""
          : trendString(Math.round(((stats.winRate - oldStats.winRate) / oldStats.winRate) * 100), "%"),
      });

      // Top scripts widget (up to 5)
      for (let i = 0; i < 5; i++) {
        const entry = stats.topScripts[i];
        await Preferences.set({
          key: `widget_script_${i}`,
          value: entry ? `${entry.name}  ·  ${entry.count} game${entry.count === 1 ? "" : "s"}` : "",
        });
      }

      // Top roles widget (up to 5)
      for (let i = 0; i < 5; i++) {
        const entry = stats.topRoles[i];
        await Preferences.set({
          key: `widget_role_${i}`,
          value: entry ? `${entry.name}  ·  ${entry.count} game${entry.count === 1 ? "" : "s"}` : "",
        });
      }

      await Preferences.set({ key: "widget_last_updated", value: String(Date.now()) });

      // Tell Android to refresh the widgets
      try {
        const { registerPlugin } = await import("@capacitor/core");
        const WidgetBridge = registerPlugin("WidgetBridge");
        await (WidgetBridge as any).refreshWidgets();
      } catch {
        // Ignore — widget may not be on home screen
      }
    },
    { deep: true }
  );
});

function trendString(delta: number, suffix = ""): string {
  if (delta > 0) return `+${delta}${suffix}`;
  if (delta < 0) return `${delta}${suffix}`;
  return "";
}

function topN(map: Map<string, number>, n: number): { name: string; count: number }[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
}

function buildStats(games: GameRecord[]) {
  const roleCounts = new Map<string, number>();
  const scriptCounts = new Map<string, number>();
  let wins = 0;
  let decided = 0;

  for (const game of games) {
    if (game.script) {
      scriptCounts.set(game.script, (scriptCounts.get(game.script) ?? 0) + 1);
    }

    for (const character of game.player_characters) {
      if (!character.name) continue;
      roleCounts.set(character.name, (roleCounts.get(character.name) ?? 0) + 1);
    }

    if (game.is_storyteller) continue;

    const lastCharacter =
      game.player_characters[game.player_characters.length - 1];
    if (!lastCharacter) continue;

    if (
      game.win_v2 === WinStatus_V2.GOOD_WINS ||
      game.win_v2 === WinStatus_V2.EVIL_WINS
    ) {
      decided++;
    }

    switch (lastCharacter.alignment) {
      case "GOOD":
        if (game.win_v2 === WinStatus_V2.GOOD_WINS) wins++;
        break;
      case "EVIL":
        if (game.win_v2 === WinStatus_V2.EVIL_WINS) wins++;
        break;
    }
  }

  return {
    totalGames: games.length,
    totalRoles: roleCounts.size,
    totalScripts: scriptCounts.size,
    winRate: decided === 0 ? 0 : Math.round((wins / decided) * 100),
    favoriteRole: topN(roleCounts, 1)[0]?.name ?? null,
    topScripts: topN(scriptCounts, 5),
    topRoles: topN(roleCounts, 5),
  };
}
