import type { GameRecord } from "~/composables/useGames";
import {
  GameEndTrigger,
  GameEndTriggerCause,
  GameEndTriggerType,
  GrimoireEventType,
  WinStatus_V2,
} from "~/composables/useGames";
import { TOWNSFOLK_ROLE_STAT_CARD_DEFINITIONS } from "~/composables/statCardConfig/townsfolk";
import { OUTSIDERS_ROLE_STAT_CARD_DEFINITIONS } from "~/composables/statCardConfig/outsiders";
import { MINIONS_ROLE_STAT_CARD_DEFINITIONS } from "~/composables/statCardConfig/minions";
import { DEMONS_ROLE_STAT_CARD_DEFINITIONS } from "~/composables/statCardConfig/demons";
import { TRAVELLERS_ROLE_STAT_CARD_DEFINITIONS } from "~/composables/statCardConfig/travellers";
import { FABLEDLORIC_ROLE_STAT_CARD_DEFINITIONS } from "~/composables/statCardConfig/fabledLoric";
import { GENERAL_ROLE_STAT_CARD_DEFINITIONS } from "~/composables/statCardConfig/general";

export type RoleStatCardCategory = "role" | "general";
export type RoleStatCardVisibility = "personal" | "global" | "both";
export type RoleStatCardGlobalDataNeed =
  | "grimoire_events"
  | "grimoire_state"
  | "end_trigger_role";

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
  visibility?: RoleStatCardVisibility;
  globalDataNeeds?: RoleStatCardGlobalDataNeed[];
  scope?: "as_role" | "affected_player" | "triggering_player";
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
  getGlobalSentence?: (context: Required<Pick<RoleStatCardContext, "games">> & {
    count: number;
    roleId?: string | null;
    roleName?: string | null;
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

function didEndTriggerParticipantWin(game: GameRecord) {
  if (game.win_v2 === WinStatus_V2.NOT_RECORDED) return false;

  const alignment =
    game.end_trigger_participant_alignment ??
    game.player_characters.at(-1)?.alignment ??
    null;

  if (alignment === "GOOD") {
    return game.win_v2 === WinStatus_V2.GOOD_WINS;
  }
  if (alignment === "EVIL") {
    return game.win_v2 === WinStatus_V2.EVIL_WINS;
  }
  return false;
}

function getDefaultEndTriggerWinsSubtitle(params: {
  definition: RoleStatCardDefinition;
  games: GameRecord[];
  roleId?: string | null;
  roleName?: string | null;
  isMe: boolean;
  username?: string;
  count: number;
}) {
  const { definition, games, roleId, roleName, isMe, username, count } = params;
  if (definition.source !== "end_trigger" || count <= 0) return null;

  const recordedGames = games.filter(
    (game) => game.win_v2 !== WinStatus_V2.NOT_RECORDED
  );
  const recorded = definition.getCount({
    games: recordedGames,
    roleId,
    roleName,
    isMe,
    username,
  });

  const winningAlignmentGames = games.filter(didEndTriggerParticipantWin);
  const wins = definition.getCount({
    games: winningAlignmentGames,
    roleId,
    roleName,
    isMe,
    username,
  });

  return `${isMe ? "You've" : "This player has"} won ${wins} of ${recorded} recorded results.`;
}

function includesPersonalVisibility(definition: RoleStatCardDefinition) {
  return definition.visibility !== "global";
}

function includesGlobalVisibility(definition: RoleStatCardDefinition) {
  return definition.visibility !== "personal";
}

export function getRoleStatCardDefinition(metricKey: string) {
  return ROLE_STAT_CARD_DEFINITIONS.find((definition) => definition.id === metricKey) ?? null;
}

export function getAvailableRoleCardDefinitions(games: GameRecord[], roleId: string) {
  return ROLE_STAT_CARD_DEFINITIONS.filter((definition) => {
    if (definition.category !== "role") return false;
    if (!definition.roleIds?.includes(roleId)) return false;
    if (!includesPersonalVisibility(definition)) return false;
    return definition.getCount({ games, roleId }) > 0;
  });
}

export function getAvailableGeneralCardDefinitions(games: GameRecord[]) {
  return ROLE_STAT_CARD_DEFINITIONS.filter((definition) => {
    if (definition.category !== "general") return false;
    if (!includesPersonalVisibility(definition)) return false;
    return definition.getCount({ games }) > 0;
  });
}

export function getRoleCardDefinitions(
  roleId: string,
  visibility: RoleStatCardVisibility = "personal"
) {
  return ROLE_STAT_CARD_DEFINITIONS.filter((definition) => {
    if (definition.category !== "role") return false;
    if (!(definition.roleIds?.includes(roleId) ?? false)) return false;

    if (visibility === "personal") return includesPersonalVisibility(definition);
    if (visibility === "global") {
      return includesGlobalVisibility(definition) && !!definition.getGlobalSentence;
    }
    return true;
  });
}

export function getGeneralCardDefinitions(
  visibility: RoleStatCardVisibility = "personal"
) {
  return ROLE_STAT_CARD_DEFINITIONS.filter((definition) => {
    if (definition.category !== "general") return false;
    if (visibility === "personal") return includesPersonalVisibility(definition);
    if (visibility === "global") return includesGlobalVisibility(definition);
    return true;
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
  if (!includesPersonalVisibility(definition)) {
    return {
      count: 0,
      sentence: "This stat card is only available in global role stats.",
      metricLabel: definition.label,
      subtitle: null,
      displayRole: null,
    };
  }

  const scopedGames = getScopedGamesForRole(
    games,
    username,
    card.role_id,
    definition.category,
    definition.scope ?? "as_role"
  );

  const count = definition.getCount({
    games: scopedGames,
    roleId: card.role_id,
    roleName,
    isMe,
    username,
  });
  const isHiddenLocked = !!definition.hidden && count === 0;
  const computedSubtitle =
    definition.getSubtitle?.({
      games: scopedGames,
      count,
      roleId: card.role_id,
      roleName,
      isMe,
      username,
    }) ??
    getDefaultEndTriggerWinsSubtitle({
      definition,
      games: scopedGames,
      count,
      roleId: card.role_id,
      roleName,
      isMe,
      username,
    });

  return {
    count,
    metricLabel: isHiddenLocked ? "Hidden statistic" : definition.label,
    sentence: isHiddenLocked
      ? "Details for this card will be shown when unlocked."
      : definition.getSentence({
      games: scopedGames,
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
        : computedSubtitle ?? null,
    displayRole:
      isHiddenLocked
        ? null
        : definition.getDisplayRole?.({
        games: scopedGames,
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
  if (!includesPersonalVisibility(definition)) return null;

  const scopedGames = getScopedGamesForRole(
    games,
    username,
    role?.id ?? null,
    definition.category,
    definition.scope ?? "as_role"
  );

  const count = definition.getCount({
    games: scopedGames,
    roleId: role?.id ?? null,
    roleName: role?.name ?? null,
    isMe,
    username,
  });
  const isHiddenLocked = !!definition.hidden && count === 0;
  const computedSubtitle =
    definition.getSubtitle?.({
      games: scopedGames,
      count,
      roleId: role?.id ?? null,
      roleName: role?.name ?? null,
      isMe,
      username,
    }) ??
    getDefaultEndTriggerWinsSubtitle({
      definition,
      games: scopedGames,
      count,
      roleId: role?.id ?? null,
      roleName: role?.name ?? null,
      isMe,
      username,
    });

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
        ? "Details for this card will be shown when unlocked."
        : definition.getSentence({
        games: scopedGames,
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
          : computedSubtitle ?? null,
      displayRole:
        isHiddenLocked
          ? null
          : definition.getDisplayRole?.({
          games: scopedGames,
          count,
          roleId: role?.id ?? null,
          roleName: role?.name ?? null,
          isMe,
          username,
        }) ?? null,
    },
  };
}

export function buildGlobalRoleStatCardPreview(
  definitionId: string,
  games: GameRecord[],
  role: NonNullable<RoleStatCardRecord["role"]>
) {
  const definition = getRoleStatCardDefinition(definitionId);
  if (!definition || !includesGlobalVisibility(definition)) return null;
  if (!definition.getGlobalSentence) return null;

  const count = definition.getCount({
    games,
    roleId: role.id,
    roleName: role.name,
  });

  return {
    id: 0,
    role_id: role.id,
    source: definition.source,
    metric_key: definition.id,
    storyteller_only: false,
    role,
    preview: {
      count,
      metricLabel: definition.label,
      sentence: definition.getGlobalSentence({
        games,
        count,
        roleId: role.id,
        roleName: role.name,
      }),
      isHiddenLocked: false,
      subtitle:
        definition.getSubtitle?.({
          games,
          count,
          roleId: role.id,
          roleName: role.name,
        }) ?? null,
      displayRole:
        definition.getDisplayRole?.({
          games,
          count,
          roleId: role.id,
          roleName: role.name,
        }) ?? null,
    },
  };
}

// Scoping a game list for a card used to re-scan every game for every card
// (~250 cards per page). Each card scope only depends on the game list and the
// username (plus the role id for "as_role"), so the work is done once per list
// and shared by every card. The cache is keyed by the array itself: the games
// store builds a new array whenever its data changes and never mutates one.
type ScopeIndex = {
  userParticipantIds: Set<string>[];
  userRoleIds: Set<string>[];
  affectedPlayer?: GameRecord[];
  triggeringPlayer?: GameRecord[];
  general?: GameRecord[];
  asRole: Map<string, GameRecord[]>;
};

const scopeIndexCache = new WeakMap<GameRecord[], Map<string, ScopeIndex>>();

function getScopeIndex(games: GameRecord[], username: string): ScopeIndex {
  let byUser = scopeIndexCache.get(games);
  if (!byUser) {
    byUser = new Map();
    scopeIndexCache.set(games, byUser);
  }

  let index = byUser.get(username);
  if (!index) {
    const userParticipantIds: Set<string>[] = [];
    const userRoleIds: Set<string>[] = [];
    for (const game of games) {
      const participantIds = new Set<string>();
      const roleIds = new Set<string>();
      for (const page of game.grimoire) {
        for (const token of page.tokens) {
          if (token.player?.username !== username) continue;
          if (token.grimoire_participant_id) participantIds.add(token.grimoire_participant_id);
          if (token.role_id) roleIds.add(token.role_id);
        }
      }
      userParticipantIds.push(participantIds);
      userRoleIds.push(roleIds);
    }
    index = { userParticipantIds, userRoleIds, asRole: new Map() };
    byUser.set(username, index);
  }

  return index;
}

function getScopedGamesForRole(
  games: GameRecord[],
  username: string | undefined,
  roleId: string | null | undefined,
  category: RoleStatCardCategory,
  scope: "as_role" | "affected_player" | "triggering_player"
) {
  if (!username) {
    return games;
  }

  const index = getScopeIndex(games, username);

  if (category === "general") {
    // General cards are about what this player did, whatever their role:
    // the events they caused and the game endings they triggered.
    index.general ??= games.flatMap((game, i) => {
      const participantIds = index.userParticipantIds[i];
      if (!participantIds.size) return [];

      const triggeredEnd =
        !!game.end_trigger_participant_id &&
        participantIds.has(game.end_trigger_participant_id);
      return [
        {
          ...game,
          grimoire_events: game.grimoire_events.filter(
            (event) =>
              !!event.by_participant_id &&
              participantIds.has(event.by_participant_id)
          ),
          ...(triggeredEnd
            ? {}
            : {
                end_trigger: GameEndTrigger.NOT_RECORDED,
                end_trigger_cause: null,
                end_trigger_role: null,
              }),
        },
      ];
    });
    return index.general;
  }

  if (category !== "role") {
    return games;
  }

  if (scope === "affected_player") {
    index.affectedPlayer ??= games.flatMap((game, i) => {
      const participantIds = index.userParticipantIds[i];
      if (!participantIds.size) return [];

      return [
        {
          ...game,
          grimoire_events: game.grimoire_events.filter((event) =>
            participantIds.has(event.participant_id)
          ),
        },
      ];
    });
    return index.affectedPlayer;
  }

  if (scope === "triggering_player") {
    index.triggeringPlayer ??= games.flatMap((game, i) => {
      const participantIds = index.userParticipantIds[i];
      if (!participantIds.size) return [];

      const triggeringEvents = game.grimoire_events.filter(
        (event) =>
          !!event.by_participant_id &&
          participantIds.has(event.by_participant_id)
      );

      // Keep companion Claimed markers for executions triggered by this player,
      // so role cards can correlate execution + claim without loading all events.
      const executionKeys = new Set(
        triggeringEvents
          .filter((event) => event.event_type === GrimoireEventType.EXECUTION)
          .map((event) => `${event.grimoire_page}:${event.participant_id}`)
      );
      const claimedCompanionEvents = game.grimoire_events.filter(
        (event) =>
          event.event_type === GrimoireEventType.OTHER &&
          event.status_source === "Claimed" &&
          executionKeys.has(`${event.grimoire_page}:${event.participant_id}`)
      );

      return [
        {
          ...game,
          grimoire_events: [...triggeringEvents, ...claimedCompanionEvents],
        },
      ];
    });
    return index.triggeringPlayer;
  }

  if (!roleId) return games;

  let asRole = index.asRole.get(roleId);
  if (!asRole) {
    asRole = games.flatMap((game, i) => {
      if (!index.userRoleIds[i].has(roleId)) return [];

      // Someone else can hold the same role in the same game (an Imp
      // starpass, a Fang Gu jump), so drop the events this role caused while
      // another player held it. Events with no recorded source stay.
      const participantIds = index.userParticipantIds[i];
      const ownEvents = game.grimoire_events.filter(
        (event) =>
          event.by_role_id !== roleId ||
          !event.by_participant_id ||
          participantIds.has(event.by_participant_id)
      );
      return [
        ownEvents.length === game.grimoire_events.length
          ? game
          : { ...game, grimoire_events: ownEvents },
      ];
    });
    index.asRole.set(roleId, asRole);
  }
  return asRole;
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

export type StatDebugRow = {
  game: GameRecord;
  /** What this game adds; 0 when it doesn't count. */
  count: number;
  /** Why the game adds nothing, or null when it counts. */
  reason: string | null;
  /** Grimoire events of this game that the card could see (short summary). */
  events: string[];
};

export type StatDebugResult = {
  total: number;
  /** Sum of the per-game counts; differs from total for cards that don't add up per game. */
  sum: number;
  rows: StatDebugRow[];
};

function describeEvent(event: GameRecord["grimoire_events"][number]) {
  const parts = [`p${event.grimoire_page + 1}`, event.event_type];
  if (event.status_source) parts.push(`"${event.status_source}"`);
  if (event.player_name) parts.push(`on ${event.player_name}`);
  if (event.by_role_id) parts.push(`by ${event.by_role_id}`);
  return parts.join(" ");
}

/**
 * Debug view of one stat card: what each game adds, and why the others add
 * nothing. Runs the card's count on one game at a time, so it only explains
 * cards whose count adds up per game; `sum` shows when it doesn't.
 */
export function explainRoleStatCard(
  card: RoleStatCardRecord,
  games: GameRecord[],
  isMe: boolean,
  username?: string
): StatDebugResult | null {
  const definition = getRoleStatCardDefinition(card.metric_key);
  if (!definition) return null;

  const roleId = card.role_id;
  const roleName = card.role?.name ?? null;
  const scope = definition.scope ?? "as_role";
  const scopedGames = getScopedGamesForRole(
    games,
    username,
    roleId,
    definition.category,
    scope
  );
  const scopedById = new Map(scopedGames.map((game) => [game.id, game]));
  const index = username ? getScopeIndex(games, username) : null;
  const params = { roleId, roleName, isMe, username };
  const total = definition.getCount({ games: scopedGames, ...params });

  const rows = games.map((game, i): StatDebugRow => {
    const scoped = scopedById.get(game.id);
    if (!scoped) {
      let reason = "Left out of this card";
      if (!game.grimoire.some((page) => page.tokens.length)) {
        reason = "No grimoire recorded";
      } else if (index && !index.userParticipantIds[i].size) {
        reason = "Your seat isn't tagged as you in the grimoire";
      } else if (definition.category === "role" && scope === "as_role") {
        reason = `You weren't ${roleName ?? roleId} in this game's grimoire`;
      }
      return { game, count: 0, reason, events: [] };
    }

    const count = definition.getCount({ games: [scoped], ...params });
    const events = scoped.grimoire_events.map(describeEvent);
    let reason: string | null = null;
    if (!count) {
      reason = game.ignore_for_stats
        ? "Ignored for stats"
        : events.length
          ? "Included, but none of its events match this card"
          : "Included, but it has no grimoire events this card can see";
    }
    return { game, count, reason, events };
  });

  const sum = rows.reduce((total, row) => total + row.count, 0);
  return { total, sum, rows };
}
