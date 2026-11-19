import {
  GameEndTrigger,
  GameEndTriggerCause,
  GameEndTriggerType,
  GrimoireEventCause,
  GrimoireEventType,
} from "./useGames";

type Alignment = "GOOD" | "EVIL" | "NEUTRAL";

export type EndTriggerRoleLike = {
  id?: string;
  name: string;
  token_url: string;
  type: string;
  initial_alignment: Alignment;
};

/**
 * The end trigger values a grimoire event fills in when it ended the game.
 */
export type EndTriggerFromEvent = {
  end_trigger: GameEndTrigger;
  end_trigger_type: GameEndTriggerType | null;
  end_trigger_cause: GameEndTriggerCause | null;
  end_trigger_participant_id: string | null;
  end_trigger_role_id: string | null;
  end_trigger_role: EndTriggerRoleLike | null;
};

type EventLike = {
  grimoire_page: number;
  participant_id: string;
  event_type: GrimoireEventType | null;
  cause: GrimoireEventCause | null;
  by_participant_id: string | null;
  by_role_id: string | null;
  role_id: string | null;
  old_role_id: string | null;
  new_role_id: string | null;
};

type TokenLike = {
  player_name: string;
  role_id: string | null;
  is_dead: boolean;
  grimoire_participant_id?: string | null;
  role?: { type: string } | null;
};

type RoleResolver = (
  roleId: string | null | undefined
) => { name?: string | null; token_url: string; type: string; initial_alignment: Alignment } | null | undefined;

// Executing the Saint ends the game, so that execution counts as an
// additional win condition rather than a death or execution trigger.
const EXECUTION_WIN_CONDITION_ROLE_IDS = new Set(["saint"]);

function roleType(
  roleId: string | null | undefined,
  resolveRole: RoleResolver
) {
  return roleId ? resolveRole(roleId)?.type ?? null : null;
}

function toEndTriggerRole(
  roleId: string | null,
  resolveRole: RoleResolver
): EndTriggerRoleLike | null {
  const role = roleId ? resolveRole(roleId) : null;
  if (!roleId || !role) return null;
  return {
    id: roleId,
    name: role.name ?? "",
    token_url: role.token_url,
    type: role.type,
    initial_alignment: role.initial_alignment,
  };
}

/**
 * Works out the end trigger a grimoire event would have caused, or null when
 * the event could not have ended the game.
 *
 * Only events on the last grimoire page count. A Demon dying, being executed
 * or losing their Demon character ends the game when no living Demon is left
 * on that page. Anyone else dying or being executed ends it when two players
 * or fewer are left alive (Travellers are not counted).
 */
export function deriveEndTriggerFromEvent(
  event: EventLike,
  pages: { tokens: TokenLike[] }[],
  resolveRole: RoleResolver
): EndTriggerFromEvent | null {
  const lastPageIndex = pages.length - 1;
  if (lastPageIndex < 0 || event.grimoire_page !== lastPageIndex) return null;

  const page = pages[lastPageIndex];
  const seatedTokens = page.tokens.filter(
    (token) => token.role_id || token.player_name?.trim()
  );
  const tokenRoleType = (token: TokenLike) =>
    token.role?.type ?? roleType(token.role_id, resolveRole);
  const livingPlayers = seatedTokens.filter(
    (token) => !token.is_dead && tokenRoleType(token) !== "TRAVELER"
  );
  const hasLivingDemon = livingPlayers.some(
    (token) => tokenRoleType(token) === "DEMON"
  );

  const affectedToken =
    page.tokens.find(
      (token) => token.grimoire_participant_id === event.participant_id
    ) ?? null;

  const triggeringCharacter = {
    end_trigger_participant_id: event.by_participant_id ?? null,
    end_trigger_role_id: event.by_role_id ?? null,
    end_trigger_role: toEndTriggerRole(event.by_role_id ?? null, resolveRole),
  };

  if (event.event_type === GrimoireEventType.ROLE_CHANGE) {
    const oldType = roleType(event.old_role_id, resolveRole);
    const newType = roleType(event.new_role_id, resolveRole);
    if (oldType !== "DEMON" || newType === "DEMON" || hasLivingDemon) {
      return null;
    }
    return {
      end_trigger: GameEndTrigger.NO_LIVING_DEMON,
      end_trigger_type: GameEndTriggerType.CHARACTER_CHANGE,
      end_trigger_cause: GameEndTriggerCause.ABILITY,
      ...triggeringCharacter,
    };
  }

  if (
    event.event_type !== GrimoireEventType.DEATH &&
    event.event_type !== GrimoireEventType.EXECUTION
  ) {
    return null;
  }

  const affectedRoleId = affectedToken?.role_id ?? event.role_id ?? null;

  if (
    event.event_type === GrimoireEventType.EXECUTION &&
    affectedRoleId &&
    EXECUTION_WIN_CONDITION_ROLE_IDS.has(affectedRoleId)
  ) {
    return {
      end_trigger: GameEndTrigger.ADDITIONAL_WIN_CONDITION,
      end_trigger_type: null,
      end_trigger_cause: GameEndTriggerCause.ABILITY,
      end_trigger_participant_id: event.participant_id || null,
      end_trigger_role_id: affectedRoleId,
      end_trigger_role: toEndTriggerRole(affectedRoleId, resolveRole),
    };
  }

  const type =
    event.event_type === GrimoireEventType.DEATH
      ? GameEndTriggerType.DEATH
      : GameEndTriggerType.EXECUTION;

  let cause: GameEndTriggerCause | null = null;
  if (event.cause === GrimoireEventCause.NOMINATION) {
    cause = GameEndTriggerCause.NOMINATION;
  } else if (
    event.cause === GrimoireEventCause.ABILITY ||
    type === GameEndTriggerType.DEATH
  ) {
    // A death can only be caused by an ability.
    cause = GameEndTriggerCause.ABILITY;
  }

  const affectedIsDemon =
    (affectedToken ? tokenRoleType(affectedToken) : null) === "DEMON" ||
    roleType(affectedRoleId, resolveRole) === "DEMON";

  let endTrigger: GameEndTrigger | null = null;
  if (affectedIsDemon && !hasLivingDemon) {
    endTrigger = GameEndTrigger.NO_LIVING_DEMON;
  } else if (!affectedIsDemon && livingPlayers.length <= 2) {
    endTrigger = GameEndTrigger.TWO_PLAYERS_LEFT_ALIVE;
  }
  if (!endTrigger) return null;

  return {
    end_trigger: endTrigger,
    end_trigger_type: type,
    end_trigger_cause: cause,
    ...triggeringCharacter,
  };
}

/**
 * Whether the game's current end trigger is the one this event would set.
 */
export function endTriggerMatchesGame(
  derived: EndTriggerFromEvent | null,
  game: {
    end_trigger?: GameEndTrigger | null;
    end_trigger_type?: GameEndTriggerType | null;
    end_trigger_participant_id?: string | null;
    end_trigger_role_id?: string | null;
  }
) {
  if (!derived) return false;
  return (
    game.end_trigger === derived.end_trigger &&
    (game.end_trigger_type ?? null) === derived.end_trigger_type &&
    (game.end_trigger_participant_id ?? null) ===
      derived.end_trigger_participant_id &&
    (game.end_trigger_role_id ?? null) === derived.end_trigger_role_id
  );
}
