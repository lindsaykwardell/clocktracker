import type { GameRecord } from "~/composables/useGames";
import { GrimoireEventType } from "~/composables/useGames";

export type RoleStatCardCategory = "role" | "general";

export type RoleStatCardDisplayRole = {
  id: string;
  name: string;
  token_url: string;
  type: string;
  initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
};

type RoleStatCardContext = {
  games: GameRecord[];
  roleId?: string | null;
  roleName?: string | null;
  isMe?: boolean;
  username?: string;
};

export type RoleStatCardDefinition = {
  id: string;
  category: RoleStatCardCategory;
  roleIds?: string[];
  source: string;
  label: string;
  getCount: (context: RoleStatCardContext) => number;
  getSentence: (context: Required<Pick<RoleStatCardContext, "games">> & {
    count: number;
    roleId?: string | null;
    roleName?: string | null;
    isMe: boolean;
    username?: string;
  }) => string;
  getSubtitle?: (context: RoleStatCardContext & { count: number }) => string | null;
  getDisplayRole?: (context: RoleStatCardContext & { count: number }) => RoleStatCardDisplayRole | null;
};

export function countEventsAffectingPlayer(
  games: GameRecord[],
  username: string | undefined,
  predicate: (game: GameRecord, event: GameRecord["grimoire_events"][number]) => boolean
) {
  if (!username) return 0;

  let total = 0;

  for (const game of games) {
    if (game.ignore_for_stats) continue;

    const participantIds = new Set(
      game.grimoire
        .flatMap((page) => page.tokens)
        .filter((token) => token.player?.username === username)
        .map((token) => token.grimoire_participant_id)
        .filter((id): id is string => !!id)
    );

    if (!participantIds.size) continue;

    total += game.grimoire_events.filter(
      (event) => participantIds.has(event.participant_id) && predicate(game, event)
    ).length;
  }

  return total;
}

export function countGrimoireEvents(
  games: GameRecord[],
  roleId: string | null | undefined,
  eventType: GrimoireEventType
) {
  if (!roleId) return 0;

  return games.reduce((total, game) => {
    if (game.ignore_for_stats) return total;

    return (
      total +
      game.grimoire_events.filter(
        (event) => event.by_role_id === roleId && event.event_type === eventType
      ).length
    );
  }, 0);
}

export function getEventCurrentToken(
  game: GameRecord,
  event: GameRecord["grimoire_events"][number]
) {
  return (
    game.grimoire[event.grimoire_page]?.tokens.find(
      (token) => token.grimoire_participant_id === event.participant_id
    ) ?? null
  );
}

export function getEventPreviousToken(
  game: GameRecord,
  event: GameRecord["grimoire_events"][number]
) {
  if (event.grimoire_page <= 0) return null;

  return (
    game.grimoire[event.grimoire_page - 1]?.tokens.find(
      (token) => token.grimoire_participant_id === event.participant_id
    ) ?? null
  );
}

export function getByRoleForEvent(
  game: GameRecord,
  event: GameRecord["grimoire_events"][number]
) {
  if (!event.by_role_id) return null;

  const current = game.grimoire[event.grimoire_page]?.tokens.find(
    (token) => token.grimoire_participant_id === event.by_participant_id
  );
  if (current?.role_id === event.by_role_id) return current.role ?? null;

  const previous =
    event.grimoire_page > 0
      ? game.grimoire[event.grimoire_page - 1]?.tokens.find(
          (token) => token.grimoire_participant_id === event.by_participant_id
        )
      : null;

  if (previous?.role_id === event.by_role_id) return previous.role ?? null;

  const anyMatch =
    game.grimoire[event.grimoire_page]?.tokens.find(
      (token) => token.role_id === event.by_role_id
    ) ??
    (event.grimoire_page > 0
      ? game.grimoire[event.grimoire_page - 1]?.tokens.find(
          (token) => token.role_id === event.by_role_id
        )
      : null);

  return anyMatch?.role ?? null;
}

export function getMostCommonByRoleSubtitle(
  games: GameRecord[],
  predicate: (game: GameRecord, event: GameRecord["grimoire_events"][number]) => boolean
) {
  const top = getMostCommonByRole(games, predicate);
  return top ? `Most often as ${top.name}` : null;
}

export function getMostCommonByRole(
  games: GameRecord[],
  predicate: (game: GameRecord, event: GameRecord["grimoire_events"][number]) => boolean
) {
  const counts = new Map<string, { role: RoleStatCardDisplayRole; count: number }>();

  for (const game of games) {
    if (game.ignore_for_stats) continue;

    for (const event of game.grimoire_events) {
      if (!predicate(game, event)) continue;
      const role = getByRoleForEvent(game, event);
      if (!role?.id || !role.name || !role.token_url || !role.type || !role.initial_alignment) continue;

      const existing = counts.get(role.id) ?? {
        role: {
          id: role.id,
          name: role.name,
          token_url: role.token_url,
          type: role.type,
          initial_alignment: role.initial_alignment,
        },
        count: 0,
      };
      existing.count += 1;
      counts.set(role.id, existing);
    }
  }

  const top = Array.from(counts.values()).sort((a, b) => b.count - a.count)[0];
  return top?.role ?? null;
}

export function getMostCommonEndTriggerRoleSubtitle(
  games: GameRecord[],
  predicate: (game: GameRecord) => boolean
) {
  const top = getMostCommonEndTriggerRole(games, predicate);
  return top ? `Most often as ${top.name}` : null;
}

export function getMostCommonEndTriggerRole(
  games: GameRecord[],
  predicate: (game: GameRecord) => boolean
) {
  const counts = new Map<string, { role: RoleStatCardDisplayRole; count: number }>();

  for (const game of games) {
    if (
      game.ignore_for_stats ||
      !predicate(game) ||
      !game.end_trigger_role?.id ||
      !game.end_trigger_role?.name
    ) {
      continue;
    }

    const existing = counts.get(game.end_trigger_role.id) ?? {
      role: {
        id: game.end_trigger_role.id,
        name: game.end_trigger_role.name,
        token_url: game.end_trigger_role.token_url,
        type: game.end_trigger_role.type,
        initial_alignment: game.end_trigger_role.initial_alignment,
      },
      count: 0,
    };
    existing.count += 1;
    counts.set(game.end_trigger_role.id, existing);
  }

  const top = Array.from(counts.values()).sort((a, b) => b.count - a.count)[0];
  return top?.role ?? null;
}

export function isDemonKillEvent(
  game: GameRecord,
  event: GameRecord["grimoire_events"][number]
) {
  if (event.event_type !== GrimoireEventType.DEATH) return false;
  const sourceRole = getByRoleForEvent(game, event);
  return sourceRole?.type === "DEMON";
}

export function pluralize(count: number) {
  return count === 1 ? "" : "s";
}

export function subject(isMe: boolean) {
  return isMe ? "you've" : "this player has";
}

export function rolePrefix(roleName?: string | null) {
  if (!roleName) return "this role";
  if (roleName.startsWith("The ")) return roleName;
  if (["Legion", "Lil' Monsta", "Riot"].includes(roleName)) return roleName;
  return `the ${roleName}`;
}
