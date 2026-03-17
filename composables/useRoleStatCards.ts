import type { GameRecord } from "~/composables/useGames";
import {
  GameEndTrigger,
  GameEndTriggerCause,
  GameEndTriggerType,
  GrimoireEventType,
} from "~/composables/useGames";
import { TOWNSFOLK_ROLE_STAT_CARD_DEFINITIONS } from "~/composables/statCardConfig/townsfolk";
import { OUTSIDERS_ROLE_STAT_CARD_DEFINITIONS } from "~/composables/statCardConfig/outsiders";
import { MINIONS_ROLE_STAT_CARD_DEFINITIONS } from "~/composables/statCardConfig/minions";
import { DEMONS_ROLE_STAT_CARD_DEFINITIONS } from "~/composables/statCardConfig/demons";
import { TRAVELLERS_ROLE_STAT_CARD_DEFINITIONS } from "~/composables/statCardConfig/travellers";
import { FABLEDLORIC_ROLE_STAT_CARD_DEFINITIONS } from "~/composables/statCardConfig/fabledLoric";
import { GENERAL_ROLE_STAT_CARD_DEFINITIONS } from "~/composables/statCardConfig/general";

export type RoleStatCardCategory = "role" | "general";

export type RoleStatCardRecord = {
  id: number;
  role_id: string | null;
  source: string;
  metric_key: string;
  storyteller_only: boolean;
  role?: {
    id: string;
    name: string;
    ability: string;
    token_url: string;
    type: string;
    initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
  } | null;
};

export type RoleStatCardDisplayRole = {
  id: string;
  name: string;
  token_url: string;
  type: string;
  initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
};

export type RoleStatCardResult = {
  count: number;
  metricLabel: string;
  sentence: string;
  subtitle?: string | null;
  displayRole?: RoleStatCardDisplayRole | null;
  isHiddenLocked?: boolean;
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
  script?: string | null;
  sao?: number;
  hidden?: boolean;
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

export const ROLE_STAT_CARD_DEFINITIONS: RoleStatCardDefinition[] = [
  ...TOWNSFOLK_ROLE_STAT_CARD_DEFINITIONS,
  ...OUTSIDERS_ROLE_STAT_CARD_DEFINITIONS,
  ...MINIONS_ROLE_STAT_CARD_DEFINITIONS,
  ...DEMONS_ROLE_STAT_CARD_DEFINITIONS,
  ...TRAVELLERS_ROLE_STAT_CARD_DEFINITIONS,
  ...FABLEDLORIC_ROLE_STAT_CARD_DEFINITIONS,
  ...GENERAL_ROLE_STAT_CARD_DEFINITIONS,
];

export function getRoleStatCardDefinition(metricKey: string) {
  return ROLE_STAT_CARD_DEFINITIONS.find((definition) => definition.id === metricKey) ?? null;
}

export function getAvailableRoleCardDefinitions(games: GameRecord[], roleId: string) {
  return ROLE_STAT_CARD_DEFINITIONS.filter((definition) => {
    if (definition.category !== "role") return false;
    if (!definition.roleIds?.includes(roleId)) return false;
    return definition.getCount({ games, roleId }) > 0;
  });
}

export function getAvailableGeneralCardDefinitions(games: GameRecord[]) {
  return ROLE_STAT_CARD_DEFINITIONS.filter((definition) => {
    if (definition.category !== "general") return false;
    return definition.getCount({ games }) > 0;
  });
}

export function getRoleCardDefinitions(roleId: string) {
  return ROLE_STAT_CARD_DEFINITIONS.filter((definition) => {
    if (definition.category !== "role") return false;
    return definition.roleIds?.includes(roleId) ?? false;
  });
}

export function getGeneralCardDefinitions() {
  return ROLE_STAT_CARD_DEFINITIONS.filter((definition) => {
    return definition.category === "general";
  });
}

export function buildRoleStatCardResult(
  card: RoleStatCardRecord,
  games: GameRecord[],
  isMe: boolean,
  username?: string
): RoleStatCardResult {
  const definition = getRoleStatCardDefinition(card.metric_key);
  const roleName = card.role?.name ?? null;

  if (!definition) {
    return {
      count: 0,
      sentence: "This stat card is no longer configured.",
      metricLabel: "Unknown Stat Card",
      subtitle: null,
      displayRole: null,
    };
  }

  const count = definition.getCount({
    games,
    roleId: card.role_id,
    roleName,
    isMe,
    username,
  });
  const isHiddenLocked = !!definition.hidden && count === 0;

  return {
    count,
    metricLabel: isHiddenLocked ? "Hidden statistic" : definition.label,
    sentence: isHiddenLocked
      ? "Details for this stat will be shown when unlocked."
      : definition.getSentence({
      games,
      count,
        roleId: card.role_id,
        roleName,
        isMe,
        username,
      }),
    isHiddenLocked,
    subtitle:
      isHiddenLocked
        ? null
        : definition.getSubtitle?.({
        games,
        count,
        roleId: card.role_id,
        roleName,
        isMe,
        username,
      }) ?? null,
    displayRole:
      isHiddenLocked
        ? null
        : definition.getDisplayRole?.({
        games,
        count,
        roleId: card.role_id,
        roleName,
        isMe,
        username,
      }) ?? null,
  };
}

export function buildRoleStatCardPreview(
  definitionId: string,
  games: GameRecord[],
  isMe: boolean,
  role?: RoleStatCardRecord["role"] | null,
  username?: string
) {
  const definition = getRoleStatCardDefinition(definitionId);
  if (!definition) return null;

  const count = definition.getCount({
    games,
    roleId: role?.id ?? null,
    roleName: role?.name ?? null,
    isMe,
    username,
  });
  const isHiddenLocked = !!definition.hidden && count === 0;

  return {
    id: 0,
    role_id: role?.id ?? null,
    source: definition.source,
    metric_key: definition.id,
    storyteller_only: false,
    role: role ?? null,
    preview: {
      count,
      metricLabel: isHiddenLocked ? "Hidden statistic" : definition.label,
      sentence: isHiddenLocked
        ? "Details for this stat will be shown when unlocked."
        : definition.getSentence({
        games,
        count,
          roleId: role?.id ?? null,
          roleName: role?.name ?? null,
          isMe,
          username,
        }),
      isHiddenLocked,
      subtitle:
        isHiddenLocked
          ? null
          : definition.getSubtitle?.({
          games,
          count,
          roleId: role?.id ?? null,
          roleName: role?.name ?? null,
          isMe,
          username,
        }) ?? null,
      displayRole:
        isHiddenLocked
          ? null
          : definition.getDisplayRole?.({
          games,
          count,
          roleId: role?.id ?? null,
          roleName: role?.name ?? null,
          isMe,
          username,
        }) ?? null,
    },
  };
}

function countEventsAffectingPlayer(
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

function countGrimoireEvents(
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

function getEventCurrentToken(
  game: GameRecord,
  event: GameRecord["grimoire_events"][number]
) {
  return (
    game.grimoire[event.grimoire_page]?.tokens.find(
      (token) => token.grimoire_participant_id === event.participant_id
    ) ?? null
  );
}

function getEventPreviousToken(
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

function getByRoleForEvent(
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

function getMostCommonByRoleSubtitle(
  games: GameRecord[],
  predicate: (game: GameRecord, event: GameRecord["grimoire_events"][number]) => boolean
) {
  const top = getMostCommonByRole(games, predicate);
  return top ? `Most often as ${top.name}` : null;
}

function getMostCommonByRole(
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

function getMostCommonEndTriggerRoleSubtitle(
  games: GameRecord[],
  predicate: (game: GameRecord) => boolean
) {
  const top = getMostCommonEndTriggerRole(games, predicate);
  return top ? `Most often as ${top.name}` : null;
}

function getMostCommonEndTriggerRole(
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

function isDemonKillEvent(
  game: GameRecord,
  event: GameRecord["grimoire_events"][number]
) {
  if (event.event_type !== GrimoireEventType.DEATH) return false;
  const sourceRole = getByRoleForEvent(game, event);
  return sourceRole?.type === "DEMON";
}

function pluralize(count: number) {
  return count === 1 ? "" : "s";
}

function subject(isMe: boolean) {
  return isMe ? "you've" : "this player has";
}

function rolePrefix(roleName?: string | null) {
  if (!roleName) return "this role";
  if (roleName.startsWith("The ")) return roleName;
  if (["Legion", "Lil' Monsta", "Riot"].includes(roleName)) return roleName;
  return `the ${roleName}`;
}
