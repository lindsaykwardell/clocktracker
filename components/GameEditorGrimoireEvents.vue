<template>
  <fieldset v-if="!editingMultipleGames" class="block border rounded border-stone-500 p-4 my-3 bg-center bg-cover">
    <legend>Grimoire Events</legend>
    <p v-if="game.grimoire_events.length === 0" class="text-sm text-stone-400">
      No events recorded yet.
    </p>
    <Alert v-if="grimoireEventSyncSummary" :color="grimoireEventSyncAlertColor">
      {{ grimoireEventSyncSummary }}
    </Alert>
    <div class="space-y-4">
      <details
        v-for="pageGroup in grimoireEventsByPage"
        :key="pageGroup.page"
        :open="pageGroup.events.some((event) => event.event_type !== null)"
      >
        <summary class="cursor-pointer">Grimoire Page {{ pageGroup.page + 1 }}</summary>
        <ul class="py-2 space-y-2">
          <li
            v-for="event in pageGroup.events"
            :key="`${pageGroup.page}-${event.participant_id}-${event.event_type}-${event.player_name}`"
            class="border border-stone-600 rounded bg-stone-300/50 dark:bg-stone-900/60"
          >
            <details :open="isEventExpandedByDefault(event)">
              <summary class="cursor-pointer px-3 py-2 text-stone-700 dark:text-stone-300/85">
                {{ grimoireEventSummaryParts(event).before }}
                <span class="font-semibold text-stone-900 dark:text-stone-300">{{ grimoireEventSummaryParts(event).action }}</span>
                {{ grimoireEventSummaryParts(event).after }}
              </summary>
              <div class="grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-2 items-center border-t border-stone-700 px-3 py-4">
                <div class="flex items-center flex-col gap-1">
                  <div class="relative flex justify-center items-center">
                    <div class="token-container relative">
                      <div class="initial-token absolute">
                        <Token
                          v-if="
                            hasGrimoireEventPreviousSeatCharacter(event) &&
                            event.event_type === GrimoireEventType.ROLE_CHANGE
                          "
                          :character="grimoireEventPreviousSeatCharacter(event)"
                          size="md"
                          labelPosition="top"
                          class="pointer-events-none clip-token"
                          hideRelated
                        />
                        <Token
                          v-else-if="
                            hasGrimoireEventPreviousSeatCharacter(event) &&
                            event.event_type === GrimoireEventType.ALIGNMENT_CHANGE
                          "
                          :character="grimoireEventPreviousAlignmentCharacter(event)"
                          size="md"
                          labelPosition="top"
                          class="pointer-events-none clip-token"
                          hideRelated
                        />
                        <Token
                          v-else-if="
                            hasGrimoireEventPreviousSeatCharacter(event) &&
                            event.event_type === GrimoireEventType.SEAT_CHANGE
                          "
                          :character="grimoireEventPreviousSeatTokenCharacter(event)"
                          size="md"
                          labelPosition="top"
                          class="pointer-events-none clip-token"
                          hideRelated
                        />
                        <Token
                          v-else
                          :character="grimoireEventSeatCharacter(event)"
                          size="md"
                          class="pointer-events-none clip-token"
                          hideRelated
                        />
                        <img
                          v-if="
                            hasGrimoireEventPreviousSeatCharacter(event) &&
                            event.event_type === GrimoireEventType.REVIVE
                          "
                          src="/img/shroud.png"
                          class="absolute left-[50%] -translate-x-[50%] top-0 w-8 md:w-10"
                          alt=""
                        />
                      </div>
                      <div class="current-token relative">
                        <Token
                          :character="
                            event.event_type === GrimoireEventType.ALIGNMENT_CHANGE
                              ? grimoireEventSeatAlignmentCharacter(event)
                              : event.event_type === GrimoireEventType.SEAT_CHANGE
                                ? grimoireEventSeatTokenCharacter(event)
                                : grimoireEventSeatCharacter(event)
                          "
                          size="md"
                          class="pointer-events-none"
                          hideRelated
                        />
                        <img
                          v-if="
                            event.event_type === null ||
                            event.event_type === GrimoireEventType.NOT_RECORDED ||
                            event.event_type === GrimoireEventType.DEATH ||
                            event.event_type === GrimoireEventType.EXECUTION
                          "
                          src="/img/shroud.png"
                          class="absolute left-[50%] -translate-x-[50%] top-0 w-8 md:w-10"
                          alt=""
                        />
                        <ReminderToken
                          v-else-if="grimoireEventStatusReminder(event)"
                          :reminder="grimoireEventStatusReminder(event)!"
                          size="sm-reminder"
                          class="current-token-reminder left-[50%] -translate-x-[50%] top-1 pointer-events-none"
                        />
                      </div>
                    </div>
                    <span
                      class="absolute text-white top-1 left-[calc(50%+1rem)]"
                      title="Alignment switch"
                    >
                      <IconUI id="arrow-90deg-down" size="sm" class="-scale-x-100" />
                    </span>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <label>
                    <span class="block text-xs mb-[0.125rem]">Event type</span>
                    <Input
                      mode="select"
                      v-model="event.event_type"
                      :disabled="isEventTypeLocked(event)"
                      @update:modelValue="onGrimoireEventTypeChange(event)"
                    >
                      <option
                        v-if="event.event_type === GrimoireEventType.REVIVE"
                        :value="GrimoireEventType.REVIVE"
                      >
                        Revival
                      </option>
                      <template v-else-if="isEventTypeLocked(event)">
                        <option :value="event.event_type">
                          {{ eventTypeOptionLabel(event.event_type) }}
                        </option>
                      </template>
                      <template v-else>
                        <option :value="GrimoireEventType.NOT_RECORDED">Not recorded</option>
                        <option :value="GrimoireEventType.DEATH">Death</option>
                        <option :value="GrimoireEventType.EXECUTION">Execution</option>
                      </template>
                    </Input>
                  </label>
                  <template
                    v-if="
                      event.event_type !== null &&
                      event.event_type !== GrimoireEventType.NOT_RECORDED
                    "
                  >
                    <label>
                      <span class="block text-xs mb-[0.125rem]">Cause</span>
                      <Input
                        mode="select"
                        v-model="event.cause"
                        :disabled="
                          event.event_type === GrimoireEventType.REVIVE ||
                          event.event_type === GrimoireEventType.MAD ||
                          event.event_type === GrimoireEventType.DRUNK ||
                          event.event_type === GrimoireEventType.POISONED ||
                          event.event_type === GrimoireEventType.OTHER
                        "
                        @update:modelValue="onGrimoireEventCauseChange(event)"
                      >
                        <option
                          v-if="
                            event.event_type === GrimoireEventType.REVIVE ||
                            event.event_type === GrimoireEventType.MAD ||
                            event.event_type === GrimoireEventType.DRUNK ||
                            event.event_type === GrimoireEventType.POISONED ||
                            event.event_type === GrimoireEventType.OTHER
                          "
                          :value="GrimoireEventCause.ABILITY"
                        >
                          Ability
                        </option>
                        <template v-else>
                          <option :value="null">Select cause</option>
                          <option :value="GrimoireEventCause.ABILITY">Ability</option>
                          <option
                            v-if="event.event_type === GrimoireEventType.EXECUTION"
                            :value="GrimoireEventCause.NOMINATION"
                          >
                            Nomination
                          </option>
                        </template>
                      </Input>
                    </label>
                    <label
                      v-if="isStatusEventType(event.event_type)"
                      class="col-span-2"
                    >
                      <span class="block text-xs mb-[0.125rem]">Status reminder</span>
                      <Input
                        mode="select"
                        v-model="event.status_source"
                        :disabled="isStatusSourceLocked(event)"
                      >
                        <option :value="null">Select reminder</option>
                        <option
                          v-for="option in grimoireEventStatusSourceOptions(event)"
                          :key="option"
                          :value="option"
                        >
                          {{ option }}
                        </option>
                      </Input>
                    </label>
                    <label class="col-span-2">
                      <span class="block text-xs mb-[0.125rem]">Select triggering character</span>
                      <Input
                        mode="select"
                        :modelValue="getGrimoireEventSeatSelection(event)"
                        @update:modelValue="
                          (value) => updateGrimoireEventSeatSelection(event, value as any)
                        "
                        :disabled="event.event_type !== GrimoireEventType.REVIVE && event.cause === null"
                      >
                        <option :value="null">No character selected</option>
                        <option
                          v-for="seat in grimoireEventSeatOptionsForPage(pageGroup.page, event.cause, event.event_type)"
                          :key="seat.participant_id"
                          :value="seat.participant_id"
                        >
                          {{ seat.label }}
                        </option>
                        <option value="custom">Set custom character</option>
                      </Input>
                    </label>
                  </template>
                </div>
                <div
                  v-if="
                    event.event_type !== null &&
                    event.event_type !== GrimoireEventType.NOT_RECORDED
                  "
                  class="relative flex justify-center items-center aspect-square"
                >
                  <Token
                    v-if="event.by_role_id"
                    :character="grimoireEventByRoleCharacter(event)"
                    size="md"
                    class="cursor-pointer"
                    :class="{
                      'pointer-events-none opacity-50': !allowManualGrimoireEventByRole(event),
                    }"
                    @clickRole="emit('open-by-role-dialog', event)"
                    hideRelated
                  />
                  <Token v-else outline size="md" class="font-sorts">
                    <button
                      type="button"
                      @click="emit('open-by-role-dialog', event)"
                      class="w-full h-full p-1 text-xs"
                      :disabled="!allowManualGrimoireEventByRole(event)"
                    >
                      <template v-if="allowManualGrimoireEventByRole(event)">
                        Add Character
                      </template>
                      <template v-else>
                        No Character Selected
                      </template>
                    </button>
                  </Token>
                </div>
              </div>
            </details>
          </li>
        </ul>
      </details>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import {
  GrimoireEventCause,
  GrimoireEventType,
} from "~/composables/useGames";
import { useRoles } from "~/composables/useRoles";
import {
  GRIMOIRE_EVENT_ROLE_INCLUDES,
  type RoleIncludeConfig,
} from "~/composables/grimoireEventRoleConfig";
import { GRIMOIRE_REMINDER_EVENT_CONFIG } from "~/composables/grimoireReminderEventConfig";
import {
  createParticipantId,
  findMatchingTokenOnPreviousPage,
  normalizePlayerName,
} from "~/composables/grimoireParticipantMatching";

type ReminderLike = {
  reminder: string;
  token_url: string;
};

type GrimoireTokenLike = {
  order: number;
  player_name: string;
  player_id?: string | null;
  role_id: string | null;
  related_role_id?: string | null;
  alignment?: "GOOD" | "EVIL" | "NEUTRAL";
  is_dead: boolean;
  grimoire_participant_id?: string | null;
  reminders: ReminderLike[];
  role?: {
    name?: string;
    token_url: string;
    type: string;
    initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
  };
  related_role?: {
    name?: string;
    token_url: string;
  };
};

type GrimoirePageLike = {
  tokens: GrimoireTokenLike[];
};

type GrimoireEventLike = {
  grimoire_page: number;
  participant_id: string;
  player_name: string;
  event_type: GrimoireEventType | null;
  status_source: string | null;
  cause: GrimoireEventCause | null;
  by_participant_id: string | null;
  by_role_id: string | null;
  role_id: string | null;
  old_role_id: string | null;
  new_role_id: string | null;
  old_alignment: "GOOD" | "EVIL" | "NEUTRAL" | null;
  new_alignment: "GOOD" | "EVIL" | "NEUTRAL" | null;
};

type SeatOption = {
  participant_id: string;
  label: string;
};

const props = defineProps<{
  editingMultipleGames?: boolean;
  scriptRoleIds: Set<string>;
  game: {
    grimoire: GrimoirePageLike[];
    grimoire_events: GrimoireEventLike[];
  };
}>();

const emit = defineEmits<{
  (e: "open-by-role-dialog", event: GrimoireEventLike): void;
}>();

const allRoles = useRoles();
const grimoireEventSyncSummary = ref("");
const grimoireEventSyncStats = ref({ added: 0, updated: 0, removed: 0 });
const grimoireEventSyncDone = ref(false);
const grimoireEventCustomSeatSelections = ref(new Set<string>());

// Token and page access helpers.
// These helpers keep page-to-page token lookup and participant matching consistent
// when seat order alone is not reliable.

/**
 * Returns the token occupying a specific seat on a given grimoire page.
 */
function getTokenForSeat(pageIndex: number, order: number) {
  const page = props.game.grimoire[pageIndex];
  if (!page) return null;
  return page.tokens.find((token) => token.order === order) || null;
}




/**
 * Returns the token for a participant on a specific grimoire page.
 */
function getTokenForParticipant(pageIndex: number, participantId: string) {
  const page = props.game.grimoire[pageIndex];
  if (!page) return null;
  return (
    page.tokens.find(
      (token) => token.grimoire_participant_id === participantId
    ) || null
  );
}

// Event display helpers

/**
 * Returns a placeholder character object for empty token renders.
 */
function blankCharacter() {
  return {
    name: "",
    alignment: "NEUTRAL" as const,
    role: {
      token_url: "/1x1.png",
      type: "",
      initial_alignment: "NEUTRAL" as const,
    },
  };
}

/**
 * Returns the best display name for an event row.
 */
function grimoireEventDisplayName(event: {
  grimoire_page: number;
  participant_id: string;
  player_name: string;
}) {
  if (event.player_name) return event.player_name;
  const token = getTokenForParticipant(event.grimoire_page, event.participant_id);
  return token?.player_name || token?.role?.name || "Unknown player";
}

/**
 * Builds the current-page role token preview for an event row.
 */
function grimoireEventSeatCharacter(event: {
  grimoire_page: number;
  participant_id: string;
}) {
  const token = getTokenForParticipant(event.grimoire_page, event.participant_id);
  if (!token || !token.role) return blankCharacter();

  return {
    name: token.role?.name ?? "",
    alignment: token.alignment ?? "NEUTRAL",
    role: {
      token_url: token.role.token_url,
      type: token.role.type,
      initial_alignment: token.role.initial_alignment,
    },
  };
}

/**
 * Builds the current-page alignment token preview for an alignment-change row.
 */
function grimoireEventSeatAlignmentCharacter(event: {
  grimoire_page: number;
  participant_id: string;
}) {
  const token = getTokenForParticipant(event.grimoire_page, event.participant_id);
  const alignment = token?.alignment ?? "NEUTRAL";
  const tokenUrl =
    alignment === "GOOD"
      ? "/img/role/good.webp"
      : alignment === "EVIL"
        ? "/img/role/evil.webp"
        : "/1x1.png";
  return {
    name:
      alignment === "GOOD" ? "Good" : alignment === "EVIL" ? "Evil" : "",
    alignment,
    role: {
      id: `alignment-${alignment.toLowerCase()}`,
      token_url: tokenUrl,
      custom_role: true,
      type: "",
      initial_alignment: alignment,
    },
  };
}

/**
 * Indicates whether the participant exists on the previous page.
 */
function hasGrimoireEventPreviousSeatCharacter(event: {
  grimoire_page: number;
  participant_id: string;
}) {
  if (event.grimoire_page <= 0) return false;
  return !!getTokenForParticipant(event.grimoire_page - 1, event.participant_id);
}

/**
 * Builds the previous-page role token preview for a switch row.
 */
function grimoireEventPreviousSeatCharacter(event: {
  grimoire_page: number;
  participant_id: string;
}) {
  const token = getTokenForParticipant(
    event.grimoire_page - 1,
    event.participant_id
  );
  if (!token || !token.role) return blankCharacter();

  return {
    name: token.role?.name ?? "",
    alignment: token.alignment ?? "NEUTRAL",
    role: {
      token_url: token.role.token_url,
      type: token.role.type,
      initial_alignment: token.role.initial_alignment,
    },
  };
}

/**
 * Builds the previous-page alignment token preview for an alignment-change row.
 */
function grimoireEventPreviousAlignmentCharacter(event: {
  grimoire_page: number;
  participant_id: string;
}) {
  const token = getTokenForParticipant(
    event.grimoire_page - 1,
    event.participant_id
  );
  const alignment = token?.alignment ?? "NEUTRAL";
  const tokenUrl =
    alignment === "GOOD"
      ? "/img/role/good.webp"
      : alignment === "EVIL"
        ? "/img/role/evil.webp"
        : "/1x1.png";
  return {
    name:
      alignment === "GOOD" ? "Good" : alignment === "EVIL" ? "Evil" : "",
    alignment,
    role: {
      id: `alignment-${alignment.toLowerCase()}`,
      token_url: tokenUrl,
      custom_role: true,
      type: "",
      initial_alignment: alignment,
    },
  };
}

/**
 * Builds the current-page seat token preview for a seat-change row.
 */
function grimoireEventSeatTokenCharacter(event: {
  grimoire_page: number;
  participant_id: string;
}) {
  const token = getTokenForParticipant(event.grimoire_page, event.participant_id);
  const seatNumber = token ? token.order + 1 : null;
  return {
    name: seatNumber ? `Seat ${seatNumber}` : "",
    alignment: "NEUTRAL" as const,
    role: {
      id: "seat-token-current",
      token_url: "/img/role/seat.webp",
      custom_role: true,
      type: "",
      initial_alignment: "NEUTRAL" as const,
    },
  };
}

/**
 * Builds the previous-page seat token preview for a seat-change row.
 */
function grimoireEventPreviousSeatTokenCharacter(event: {
  grimoire_page: number;
  participant_id: string;
}) {
  const token = getTokenForParticipant(
    event.grimoire_page - 1,
    event.participant_id
  );
  const seatNumber = token ? token.order + 1 : null;
  return {
    name: seatNumber ? `Seat ${seatNumber}` : "",
    alignment: "NEUTRAL" as const,
    role: {
      id: "seat-token-previous",
      token_url: "/img/role/seat.webp",
      custom_role: true,
      type: "",
      initial_alignment: "NEUTRAL" as const,
    },
  };
}

/**
 * Returns whether the event type is fixed by grimoire diffing and cannot be edited.
 */
function isEventTypeLocked(event: { event_type: GrimoireEventType | null }) {
  return (
    event.event_type === GrimoireEventType.REVIVE ||
    event.event_type === GrimoireEventType.ROLE_CHANGE ||
    event.event_type === GrimoireEventType.SEAT_CHANGE ||
    event.event_type === GrimoireEventType.ALIGNMENT_CHANGE ||
    event.event_type === GrimoireEventType.MAD ||
    event.event_type === GrimoireEventType.DRUNK ||
    event.event_type === GrimoireEventType.POISONED ||
    event.event_type === GrimoireEventType.OTHER
  );
}

function isStatusEventType(eventType: GrimoireEventType | null) {
  return (
    eventType === GrimoireEventType.MAD ||
    eventType === GrimoireEventType.DRUNK ||
    eventType === GrimoireEventType.POISONED ||
    eventType === GrimoireEventType.OTHER
  );
}

function defaultStatusSourceForEventType(eventType: GrimoireEventType | null) {
  if (eventType === GrimoireEventType.MAD) return "Mad";
  if (eventType === GrimoireEventType.DRUNK) return "Drunk";
  if (eventType === GrimoireEventType.POISONED) return "Poisoned";
  return null;
}

function grimoireEventStatusSourceOptions(event: {
  event_type: GrimoireEventType | null;
  by_role_id: string | null;
  status_source: string | null;
}) {
  if (!isStatusEventType(event.event_type)) return [];

  const options = new Set<string>();

  for (const config of GRIMOIRE_REMINDER_EVENT_CONFIG) {
    if (config.eventType !== event.event_type) continue;
    if (
      event.by_role_id &&
      config.sourceRoleIds.length > 0 &&
      !config.sourceRoleIds.includes(event.by_role_id)
    ) {
      continue;
    }
    options.add(config.reminder);
  }

  if (options.size === 0) {
    const fallback = defaultStatusSourceForEventType(event.event_type);
    if (fallback) options.add(fallback);
  }

  if (event.status_source) options.add(event.status_source);

  return Array.from(options).sort((a, b) => a.localeCompare(b));
}

function onGrimoireEventTypeChange(event: {
  event_type: GrimoireEventType | null;
  status_source: string | null;
  cause: GrimoireEventCause | null;
  by_participant_id: string | null;
  by_role_id: string | null;
}) {
  event.cause = null;
  event.by_participant_id = null;
  event.by_role_id = null;

  if (event.event_type === GrimoireEventType.REVIVE) {
    event.cause = GrimoireEventCause.ABILITY;
    event.status_source = null;
    return;
  }

  if (isStatusEventType(event.event_type)) {
    event.cause = GrimoireEventCause.ABILITY;
    if (!event.status_source) {
      event.status_source = defaultStatusSourceForEventType(event.event_type);
    }
    return;
  }

  event.status_source = null;
}

function isStatusSourceLocked(event: {
  grimoire_page: number;
  participant_id: string;
  event_type: GrimoireEventType | null;
  status_source: string | null;
}) {
  if (!isStatusEventType(event.event_type)) return false;
  return !!grimoireEventStatusReminder(event);
}

/**
 * Returns the short screen-reader summary label for an event row.
 */
function eventSummaryLabel(event: { event_type: GrimoireEventType | null }) {
  if (event.event_type === GrimoireEventType.REVIVE) return "Revived";
  if (event.event_type === GrimoireEventType.EXECUTION) return "Executed";
  if (event.event_type === GrimoireEventType.ROLE_CHANGE) return "Character switched";
  if (event.event_type === GrimoireEventType.SEAT_CHANGE) return "Seat changed";
  if (event.event_type === GrimoireEventType.ALIGNMENT_CHANGE) return "Alignment switched";
  if (event.event_type === GrimoireEventType.MAD) return "Made mad";
  if (event.event_type === GrimoireEventType.DRUNK) return "Made drunk";
  if (event.event_type === GrimoireEventType.POISONED) return "Poisoned";
  if (event.event_type === GrimoireEventType.OTHER) return "Marked";
  return "Died";
}

/**
 * Returns the display label for an event type select option.
 */
function eventTypeOptionLabel(eventType: GrimoireEventType | null) {
  if (eventType === GrimoireEventType.REVIVE) return "Revival";
  if (eventType === GrimoireEventType.ROLE_CHANGE) return "Character switch";
  if (eventType === GrimoireEventType.SEAT_CHANGE) return "Seat change";
  if (eventType === GrimoireEventType.ALIGNMENT_CHANGE) return "Alignment switch";
  if (eventType === GrimoireEventType.MAD) return "Madness";
  if (eventType === GrimoireEventType.DRUNK) return "Drunk";
  if (eventType === GrimoireEventType.POISONED) return "Poisoned";
  if (eventType === GrimoireEventType.OTHER) return "Other";
  if (eventType === GrimoireEventType.EXECUTION) return "Execution";
  if (eventType === GrimoireEventType.DEATH) return "Death";
  return "Not recorded";
}

function roleNameWithArticle(roleName: string) {
  if (!roleName) return "";
  if (roleName.startsWith("The ")) return roleName;
  if (["Legion", "Lil' Monsta", "Riot"].includes(roleName)) return roleName;
  return `the ${roleName}`;
}

function grimoireEventSourceActorLabel(event: {
  grimoire_page: number;
  by_participant_id: string | null;
  by_role_id: string | null;
}) {
  let sourcePlayer = "";
  if (event.by_participant_id) {
    const sourceToken =
      getTokenForParticipant(event.grimoire_page, event.by_participant_id) ||
      (event.grimoire_page > 0
        ? getTokenForParticipant(event.grimoire_page - 1, event.by_participant_id)
        : null);
    sourcePlayer = sourceToken?.player_name?.trim() || "";
  }

  const sourceRole = event.by_role_id ? allRoles.getRole(event.by_role_id)?.name || "" : "";
  if (sourcePlayer && sourceRole) {
    return `${roleNameWithArticle(sourceRole)} (${sourcePlayer})`;
  }
  if (sourcePlayer) return sourcePlayer;
  if (sourceRole) return roleNameWithArticle(sourceRole);
  return "";
}

type GrimoireEventSummaryParts = {
  before: string;
  action: string;
  after: string;
};

function grimoireEventSummaryParts(event: GrimoireEventLike): GrimoireEventSummaryParts {
  const targetName = grimoireEventDisplayName(event);
  const sourceActor = grimoireEventSourceActorLabel(event);

  if (event.event_type === GrimoireEventType.POISONED) {
    return {
      before: `${targetName} was `,
      action: "poisoned",
      after: sourceActor ? ` by ${sourceActor}` : "",
    };
  }
  if (event.event_type === GrimoireEventType.DRUNK) {
    return {
      before: `${targetName} was made `,
      action: "drunk",
      after: sourceActor ? ` by ${sourceActor}` : "",
    };
  }
  if (event.event_type === GrimoireEventType.MAD) {
    return {
      before: `${targetName} was made `,
      action: "mad",
      after: sourceActor ? ` by ${sourceActor}` : "",
    };
  }
  if (event.event_type === GrimoireEventType.OTHER) {
    return {
      before: `${targetName} was `,
      action: "marked",
      after: sourceActor ? ` by ${sourceActor}` : "",
    };
  }
  if (event.event_type === GrimoireEventType.REVIVE) {
    return {
      before: `${targetName} was `,
      action: "revived",
      after: sourceActor ? ` by ${sourceActor}` : "",
    };
  }
  if (event.event_type === GrimoireEventType.EXECUTION) {
    return {
      before: `${targetName} was `,
      action: "executed",
      after: "",
    };
  }
  if (
    event.event_type === GrimoireEventType.DEATH ||
    event.event_type === GrimoireEventType.NOT_RECORDED ||
    event.event_type === null
  ) {
    if (sourceActor) {
      return {
        before: `${targetName} was `,
        action: "killed",
        after: ` by ${sourceActor}`,
      };
    }
    return {
      before: `${targetName} `,
      action: "died",
      after: "",
    };
  }
  if (event.event_type === GrimoireEventType.ROLE_CHANGE) {
    return {
      before: `${targetName} `,
      action: "changed character",
      after: "",
    };
  }
  if (event.event_type === GrimoireEventType.ALIGNMENT_CHANGE) {
    return {
      before: `${targetName} `,
      action: "changed alignment",
      after: "",
    };
  }
  if (event.event_type === GrimoireEventType.SEAT_CHANGE) {
    return {
      before: `${targetName} `,
      action: "changed seats",
      after: "",
    };
  }

  return {
    before: `${targetName}: `,
    action: eventTypeOptionLabel(event.event_type),
    after: "",
  };
}

function isEventExpandedByDefault(event: GrimoireEventLike) {
  const isReminderStatusEvent =
    event.event_type === GrimoireEventType.MAD ||
    event.event_type === GrimoireEventType.DRUNK ||
    event.event_type === GrimoireEventType.POISONED ||
    event.event_type === GrimoireEventType.OTHER;
  const hasAutofilledFields =
    event.event_type !== null &&
    event.event_type !== GrimoireEventType.NOT_RECORDED &&
    event.cause === GrimoireEventCause.ABILITY &&
    !!event.status_source &&
    !!event.by_participant_id &&
    !!event.by_role_id &&
    !!grimoireEventStatusReminder(event);

  if (isReminderStatusEvent && hasAutofilledFields) {
    return false;
  }

  return true;
}

/**
 * Formats a triggering-character label for dropdowns.
 * Falls back to seat when there is no player name, because page numbers add noise unless
 * the source specifically came from the previous page.
 */
function grimoireEventSourceLabel(
  token: {
    order: number;
    role?: { name?: string | null } | null;
    player_name?: string | null;
  },
  options?: {
    fromPreviousPage?: boolean;
  }
) {
  const roleName = token.role?.name || "Unknown role";
  const playerLabel = token.player_name?.trim()
    ? token.player_name.trim()
    : `Seat ${token.order + 1}`;
  const previousSuffix = options?.fromPreviousPage ? " (from previous page)" : "";
  return `${roleName} - ${playerLabel}${previousSuffix}`;
}

// Trigger selection helpers

/**
 * Resolves the allowed source role ids for ability-caused events.
 */
function grimoireEventAllowedRoleIds(
  cause: GrimoireEventCause | null,
  eventType: GrimoireEventType | null
) {
  if (cause !== GrimoireEventCause.ABILITY || eventType === null) return null;
  // "Other" events are intentionally free-form and should not restrict
  // triggering-character choices to curated include lists.
  if (eventType === GrimoireEventType.OTHER) return null;
  const config: RoleIncludeConfig = GRIMOIRE_EVENT_ROLE_INCLUDES[eventType];
  const includes = [
    ...(config.base ?? []),
    ...(config.conditional ?? [])
      .filter((entry) =>
        entry.requires.every((required) => props.scriptRoleIds.has(required))
      )
      .map((entry) => entry.role),
  ];
  return includes.length > 0 ? new Set(includes) : null;
}

/**
 * Builds the triggering-character dropdown options for a page and event context,
 * because events should only show seats with roles that can plausibly have caused them.
 */
function grimoireEventSeatOptionsForPage(
  pageIndex: number,
  cause: GrimoireEventCause | null,
  eventType: GrimoireEventType | null
) {
  const page = props.game.grimoire[pageIndex];
  if (!page) return [];
  const previousPage =
    pageIndex > 0 ? props.game.grimoire[pageIndex - 1] : null;
  const ordered = page.tokens.slice().sort((a, b) => a.order - b.order);
  const abilityAllowed = grimoireEventAllowedRoleIds(cause, eventType);
  const shouldPreferPreviousPageSource =
    cause === GrimoireEventCause.ABILITY &&
    previousPage &&
    abilityAllowed &&
    (eventType === GrimoireEventType.ROLE_CHANGE ||
      eventType === GrimoireEventType.ALIGNMENT_CHANGE);

  const currentOptions = ordered
    .filter((token) => {
      if (
        abilityAllowed &&
        (!token.role_id || !abilityAllowed.has(token.role_id))
      ) {
        return false;
      }
      if (cause !== GrimoireEventCause.NOMINATION) return true;
      const prev =
        previousPage && pageIndex > 0
          ? findMatchingTokenOnPreviousPage(props.game.grimoire, pageIndex, token)
          : null;
      const wasDead = prev?.is_dead ?? false;
      return !(token.is_dead && wasDead);
    })
    .map((token) => {
      const participantId = token.grimoire_participant_id || `seat-${token.order}`;
      const previousToken = shouldPreferPreviousPageSource
        ? getTokenForParticipant(pageIndex - 1, participantId)
        : null;
      const sourceToken =
        previousToken?.role_id &&
        abilityAllowed.has(previousToken.role_id) &&
        previousToken.role_id !== token.role_id
          ? previousToken
          : token;
      const sourcePageIndex = sourceToken === previousToken ? pageIndex - 1 : pageIndex;
      return {
        participant_id: participantId,
        label: grimoireEventSourceLabel(sourceToken, {
          fromPreviousPage: sourcePageIndex !== pageIndex,
        }),
      };
    });

  if (!shouldPreferPreviousPageSource) {
    return currentOptions;
  }

  const existingParticipantIds = new Set(
    currentOptions.map((option) => option.participant_id)
  );

  const previousOptions = previousPage.tokens
    .slice()
    .sort((a, b) => a.order - b.order)
    .filter((token) => {
      const participantId = token.grimoire_participant_id || `seat-${token.order}`;
      if (existingParticipantIds.has(participantId)) return false;
      if (token.is_dead) return false;
      if (!token.role_id || !abilityAllowed.has(token.role_id)) return false;
      return true;
    })
    .map((token) => ({
      participant_id: token.grimoire_participant_id || `seat-${token.order}`,
      label: grimoireEventSourceLabel(token, { fromPreviousPage: true }),
    }));

  return [...currentOptions, ...previousOptions];
}

/**
 * Chooses which page's token should be used as the source role for a seat selection,
 * because a character can cause a role change and then no longer have that role on the current page.
 */
function getSourceTokenForGrimoireEventSelection(
  event: {
    grimoire_page: number;
    cause: GrimoireEventCause | null;
    event_type: GrimoireEventType | null;
  },
  participantId: string
) {
  const currentToken = getTokenForParticipant(event.grimoire_page, participantId);

  if (
    (event.event_type !== GrimoireEventType.ROLE_CHANGE &&
      event.event_type !== GrimoireEventType.ALIGNMENT_CHANGE) ||
    event.cause !== GrimoireEventCause.ABILITY ||
    event.grimoire_page <= 0
  ) {
    return currentToken;
  }

  const previousToken = getTokenForParticipant(event.grimoire_page - 1, participantId);
  const allowedRoleIds = grimoireEventAllowedRoleIds(event.cause, event.event_type);

  if (
    previousToken?.role_id &&
    (!allowedRoleIds || allowedRoleIds.has(previousToken.role_id)) &&
    currentToken?.role_id !== previousToken.role_id
  ) {
    return previousToken;
  }

  return currentToken ?? previousToken;
}

/**
 * Builds a stable key for storing per-event custom selection state.
 */
function grimoireEventSelectionKey(event: {
  grimoire_page: number;
  participant_id: string;
  event_type: GrimoireEventType | null;
}) {
  return `${event.grimoire_page}:${event.participant_id}:${event.event_type ?? "none"}`;
}

/**
 * Maps the stored event state to the triggering-character select value.
 */
function getGrimoireEventSeatSelection(event: {
  by_participant_id: string | null;
  event_type: GrimoireEventType | null;
  grimoire_page: number;
  participant_id: string;
}) {
  if (event.by_participant_id !== null) return event.by_participant_id;
  const key = grimoireEventSelectionKey(event);
  if (grimoireEventCustomSeatSelections.value.has(key)) return "custom";
  return null;
}

/**
 * Applies a triggering-character selection and derives the source role token if needed,
 * because the selected participant is not always the same as the role snapshot that should be shown.
 */
function updateGrimoireEventSeatSelection(
  event: {
    grimoire_page: number;
    by_participant_id: string | null;
    by_role_id: string | null;
    participant_id: string;
    cause: GrimoireEventCause | null;
    event_type: GrimoireEventType | null;
  },
  value: string | "custom" | null
) {
  const key = grimoireEventSelectionKey(event);
  if (value === "custom") {
    event.by_participant_id = null;
    grimoireEventCustomSeatSelections.value.add(key);
    return;
  }

  if (value === null) {
    event.by_participant_id = null;
    event.by_role_id = null;
    grimoireEventCustomSeatSelections.value.delete(key);
    return;
  }

  event.by_participant_id = value;
  const token = getSourceTokenForGrimoireEventSelection(event, value);
  event.by_role_id = token?.role_id ?? null;
  grimoireEventCustomSeatSelections.value.delete(key);
}

/**
 * Clears triggering-character state when the cause changes.
 */
function onGrimoireEventCauseChange(event: {
  grimoire_page: number;
  participant_id: string;
  by_participant_id: string | null;
  by_role_id: string | null;
  event_type: GrimoireEventType | null;
}) {
  event.by_participant_id = null;
  event.by_role_id = null;
  grimoireEventCustomSeatSelections.value.delete(grimoireEventSelectionKey(event));
}

/**
 * Returns whether the manual by-role picker should be available for this event.
 */
function allowManualGrimoireEventByRole(event: {
  grimoire_page: number;
  participant_id: string;
  cause: GrimoireEventCause | null;
  event_type: GrimoireEventType | null;
}) {
  const options = grimoireEventSeatOptionsForPage(
    event.grimoire_page,
    event.cause,
    event.event_type
  );
  if (options.length === 0) return true;
  return grimoireEventCustomSeatSelections.value.has(
    grimoireEventSelectionKey(event)
  );
}

/**
 * Builds the token payload for the manually selected by-role character preview.
 */
function grimoireEventByRoleCharacter(event: { by_role_id: string | null }) {
  if (!event.by_role_id) return blankCharacter();
  const role = allRoles.getRole(event.by_role_id);
  if (!role) return blankCharacter();
  return {
    name: role.name,
    alignment: role.initial_alignment,
    role: {
      token_url: role.token_url,
      type: role.type,
      initial_alignment: role.initial_alignment,
    },
  };
}

// Sync and inference helpers

/**
 * Convenience helper for checking whether an event type represents a revival.
 */
function isReviveEventType(eventType: GrimoireEventType | null) {
  return eventType === GrimoireEventType.REVIVE;
}

/**
 * Normalizes reminder token hints so they can be matched against role ids and names.
 */
function normalizeReminderRoleHint(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeReminderName(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function countReminderByName(
  reminders: ReminderLike[] | undefined,
  reminderName: string
) {
  const normalizedReminderName = normalizeReminderName(reminderName);
  return (reminders ?? []).reduce((count, reminder) => {
    return normalizeReminderName(reminder.reminder) === normalizedReminderName
      ? count + 1
      : count;
  }, 0);
}

function addedRemindersByName(
  currentReminders: ReminderLike[] | undefined,
  previousReminders: ReminderLike[] | undefined,
  reminderName: string
) {
  const normalizedReminderName = normalizeReminderName(reminderName);
  const previousCounts = new Map<string, number>();

  for (const reminder of previousReminders ?? []) {
    if (normalizeReminderName(reminder.reminder) !== normalizedReminderName) continue;
    const key = `${normalizedReminderName}|${reminder.token_url ?? ""}`;
    previousCounts.set(key, (previousCounts.get(key) ?? 0) + 1);
  }

  const added: ReminderLike[] = [];
  for (const reminder of currentReminders ?? []) {
    if (normalizeReminderName(reminder.reminder) !== normalizedReminderName) continue;
    const key = `${normalizedReminderName}|${reminder.token_url ?? ""}`;
    const available = previousCounts.get(key) ?? 0;
    if (available > 0) {
      previousCounts.set(key, available - 1);
      continue;
    }
    added.push(reminder);
  }

  return added;
}

function reminderMatchesAnyRoleHint(
  reminder: ReminderLike,
  roleIds: string[]
) {
  const reminderUrlHint = normalizeReminderRoleHint(reminder.token_url);
  if (!reminderUrlHint) return false;

  return roleIds.some((roleId) => {
    const roleNameHint = normalizeReminderRoleHint(allRoles.getRole(roleId)?.name);
    const roleIdHint = normalizeReminderRoleHint(roleId);
    return (
      (!!roleNameHint && reminderUrlHint.includes(roleNameHint)) ||
      (!!roleIdHint && reminderUrlHint.includes(roleIdHint))
    );
  });
}

function reminderNameForStatusEvent(event: {
  event_type: GrimoireEventType | null;
  status_source?: string | null;
}) {
  if (event.status_source) return event.status_source;
  const eventType = event.event_type;
  if (eventType === GrimoireEventType.MAD) return "Mad";
  if (eventType === GrimoireEventType.DRUNK) return "Drunk";
  if (eventType === GrimoireEventType.POISONED) return "Poisoned";
  if (eventType === GrimoireEventType.OTHER) return "Lunch";
  return null;
}

function grimoireEventStatusReminder(event: {
  grimoire_page: number;
  participant_id: string;
  event_type: GrimoireEventType | null;
  status_source?: string | null;
}) {
  const reminderName = reminderNameForStatusEvent(event);
  if (!reminderName) return null;

  const currentToken = getTokenForParticipant(event.grimoire_page, event.participant_id);
  const previousToken =
    event.grimoire_page > 0
      ? getTokenForParticipant(event.grimoire_page - 1, event.participant_id)
      : null;

  const reminderFromCurrent =
    currentToken?.reminders.find(
      (reminder) =>
        normalizeReminderName(reminder.reminder) === normalizeReminderName(reminderName)
    ) ?? null;
  if (reminderFromCurrent) return reminderFromCurrent;

  const reminderFromPrevious =
    previousToken?.reminders.find(
      (reminder) =>
        normalizeReminderName(reminder.reminder) === normalizeReminderName(reminderName)
    ) ?? null;
  return reminderFromPrevious;
}

function detectReminderEventSource(
  pageTokens: GrimoireTokenLike[],
  sourceRoleIds: string[]
) {
  if (!sourceRoleIds.length) return null;
  const allowed = new Set(sourceRoleIds);
  const candidates = pageTokens.filter(
    (candidate) => !!candidate.role_id && allowed.has(candidate.role_id)
  );

  const aliveCandidates = candidates.filter((candidate) => !candidate.is_dead);
  if (aliveCandidates.length === 1 && aliveCandidates[0].grimoire_participant_id) {
    return {
      by_participant_id: aliveCandidates[0].grimoire_participant_id,
      by_role_id: aliveCandidates[0].role_id as string,
    };
  }

  const deadCandidates = candidates.filter((candidate) => candidate.is_dead);
  if (deadCandidates.length === 1 && deadCandidates[0].grimoire_participant_id) {
    return {
      by_participant_id: deadCandidates[0].grimoire_participant_id,
      by_role_id: deadCandidates[0].role_id as string,
    };
  }

  return null;
}

/**
 * Tries to infer a death source from a placed "Dead" reminder token on the page,
 * because reminder token URLs often preserve enough role identity to make a safe autofill.
 */
function detectDeadReminderSource(
  pageTokens: GrimoireTokenLike[],
  token: { reminders: ReminderLike[] }
) {
  const deadReminder = token.reminders.find(
    (reminder) => reminder.reminder.trim().toLowerCase() === "dead"
  );
  if (!deadReminder?.token_url) return null;

  const reminderUrlHint = normalizeReminderRoleHint(deadReminder.token_url);
  if (!reminderUrlHint) return null;

  const matchingCharacters = pageTokens.filter((candidate) => {
    if (!candidate.role_id) return false;

    const roleNameHint = normalizeReminderRoleHint(candidate.role?.name);
    const roleIdHint = normalizeReminderRoleHint(candidate.role_id);

    return (
      (!!roleNameHint && reminderUrlHint.includes(roleNameHint)) ||
      (!!roleIdHint && reminderUrlHint.includes(roleIdHint))
    );
  });

  const matchingAliveCharacters = matchingCharacters.filter(
    (candidate) => !candidate.is_dead
  );
  const matchingDeadCharacters = matchingCharacters.filter(
    (candidate) => candidate.is_dead
  );

  const matchedCharacters =
    matchingAliveCharacters.length === 1
      ? matchingAliveCharacters
      : matchingDeadCharacters.length === 1
        ? matchingDeadCharacters
        : [];

  if (matchedCharacters.length !== 1) return null;

  const [source] = matchedCharacters;
  if (!source.grimoire_participant_id || !source.role_id) return null;

  return {
    by_participant_id: source.grimoire_participant_id,
    by_role_id: source.role_id,
  };
}

/**
 * Assigns the within-page display priority used when sorting event rows.
 */
function grimoireEventSortPriority(eventType: GrimoireEventType | null) {
  switch (eventType) {
    case GrimoireEventType.SEAT_CHANGE:
      return 0;
    case GrimoireEventType.ROLE_CHANGE:
      return 1;
    case GrimoireEventType.ALIGNMENT_CHANGE:
      return 2;
    case GrimoireEventType.MAD:
    case GrimoireEventType.DRUNK:
    case GrimoireEventType.POISONED:
    case GrimoireEventType.OTHER:
      return 3;
    case GrimoireEventType.DEATH:
    case GrimoireEventType.EXECUTION:
    case GrimoireEventType.REVIVE:
    case GrimoireEventType.NOT_RECORDED:
    case null:
    default:
      return 3;
  }
}

const grimoireEventsByPage = computed(() => {
  const groups = new Map<number, typeof props.game.grimoire_events>();
  for (const event of props.game.grimoire_events || []) {
    if (!groups.has(event.grimoire_page)) {
      groups.set(event.grimoire_page, []);
    }
    groups.get(event.grimoire_page)!.push(event);
  }

  return Array.from(groups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([page, events]) => ({
      page,
      events: events.slice().sort((a, b) => {
        const aToken = getTokenForParticipant(page, a.participant_id);
        const bToken = getTokenForParticipant(page, b.participant_id);
        const aOrder = aToken?.order ?? Number.MAX_SAFE_INTEGER;
        const bOrder = bToken?.order ?? Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return aOrder - bOrder;

        const aPriority = grimoireEventSortPriority(a.event_type);
        const bPriority = grimoireEventSortPriority(b.event_type);
        if (aPriority !== bPriority) return aPriority - bPriority;

        const aName = normalizePlayerName(a.player_name || aToken?.player_name);
        const bName = normalizePlayerName(b.player_name || bToken?.player_name);
        if (aName !== bName) return aName.localeCompare(bName);

        return (a.participant_id || "").localeCompare(b.participant_id || "");
      }),
    }));
});

/**
 * Records a direct dead/alive toggle from the grimoire and immediately resyncs events,
 * because manual dead-state changes are one of the main entry points into event syncing.
 */
function recordGrimoireEvent(payload: {
  token: {
    order: number;
    player_name: string;
    role_id: string | null;
    player_id?: string | null;
    grimoire_participant_id?: string | null;
  };
  isDead: boolean;
  pageIndex: number;
}) {
  const pageToken = getTokenForSeat(payload.pageIndex, payload.token.order);
  if (pageToken && !pageToken.grimoire_participant_id) {
    pageToken.grimoire_participant_id = createParticipantId();
  }
  const participantId =
    payload.token.grimoire_participant_id ||
    pageToken?.grimoire_participant_id ||
    createParticipantId();

  const previousPageIndex = payload.pageIndex - 1;
  const previousToken =
    previousPageIndex >= 0
      ? findMatchingTokenOnPreviousPage(
          props.game.grimoire,
          payload.pageIndex,
          payload.token,
          undefined,
          !payload.isDead
        )
      : null;
  const wasDeadPreviously = previousToken?.is_dead ?? false;
  const shouldRecordDeath = payload.isDead && !wasDeadPreviously;
  const shouldRecordRevival = !payload.isDead && wasDeadPreviously;

  const existingIndex = props.game.grimoire_events.findIndex(
    (event) =>
      event.grimoire_page === payload.pageIndex &&
      event.participant_id === participantId
  );
  if (existingIndex >= 0) {
    props.game.grimoire_events.splice(existingIndex, 1);
  }

  if (!shouldRecordDeath && !shouldRecordRevival) {
    syncGrimoireEventsFromGrimoire({ force: true, silent: true });
    return;
  }

  props.game.grimoire_events.push({
    grimoire_page: payload.pageIndex,
    participant_id: participantId,
    event_type: shouldRecordRevival
      ? GrimoireEventType.REVIVE
      : GrimoireEventType.NOT_RECORDED,
    status_source: null,
    cause: shouldRecordRevival ? GrimoireEventCause.ABILITY : null,
    by_participant_id: null,
    player_name: payload.token.player_name || "",
    role_id: payload.token.role_id ?? null,
    by_role_id: null,
    old_role_id: previousToken?.role_id ?? null,
    new_role_id: payload.token.role_id ?? null,
    old_alignment: previousToken?.alignment ?? null,
    new_alignment: pageToken?.alignment ?? null,
  });

  syncGrimoireEventsFromGrimoire({ force: true, silent: true });
}

/**
 * Rebuilds grimoire events from page-to-page token diffs while preserving manual edits where possible,
 * because the grimoire is the source of truth but users still need to keep intentional manual overrides.
 */
function syncGrimoireEventsFromGrimoire(options?: {
  force?: boolean;
  silent?: boolean;
}) {
  const force = options?.force ?? false;
  const silent = options?.silent ?? false;
  if ((grimoireEventSyncDone.value && !force) || props.editingMultipleGames) return;
  if (!props.game.grimoire.length) return;

  let added = 0;
  let removed = 0;
  let updated = 0;

  const events = props.game.grimoire_events;
  const expected = new Map<
    string,
    {
      grimoire_page: number;
      participant_id: string;
      event_type: GrimoireEventType | null;
      status_source: string | null;
      by_participant_id: string | null;
      player_name: string;
      role_id: string | null;
      by_role_id: string | null;
      old_role_id: string | null;
      new_role_id: string | null;
      old_alignment: "GOOD" | "EVIL" | "NEUTRAL" | null;
      new_alignment: "GOOD" | "EVIL" | "NEUTRAL" | null;
    }
  >();

  /**
   * Collapses event types into reconciliation buckets used during sync.
   */
  function eventKindFromValues(
    eventType: GrimoireEventType | null
  ):
    | "death"
    | "revival"
    | "role"
    | "seat"
    | "alignment"
    | "mad"
    | "drunk"
    | "poisoned"
    | "other" {
    if (isReviveEventType(eventType)) return "revival";
    if (eventType === GrimoireEventType.ROLE_CHANGE) return "role";
    if (eventType === GrimoireEventType.SEAT_CHANGE) return "seat";
    if (eventType === GrimoireEventType.ALIGNMENT_CHANGE) return "alignment";
    if (eventType === GrimoireEventType.MAD) return "mad";
    if (eventType === GrimoireEventType.DRUNK) return "drunk";
    if (eventType === GrimoireEventType.POISONED) return "poisoned";
    if (eventType === GrimoireEventType.OTHER) return "other";
    return "death";
  }

  /**
   * Builds a reconciliation kind, including status source for status-style events,
   * so reminder-driven OTHER/MAD/DRUNK/POISONED rows do not cross-match.
   */
  function eventReconciliationKind(
    eventType: GrimoireEventType | null,
    statusSource: string | null | undefined
  ) {
    const baseKind = eventKindFromValues(eventType);
    if (
      (eventType === GrimoireEventType.MAD ||
        eventType === GrimoireEventType.DRUNK ||
        eventType === GrimoireEventType.POISONED ||
        eventType === GrimoireEventType.OTHER) &&
      statusSource
    ) {
      return `${baseKind}:${normalizeReminderName(statusSource)}`;
    }
    return baseKind;
  }

  /**
   * Builds the reconciliation key for an expected event entry.
   */
  function expectedKey(grimoirePage: number, participantId: string, kind: string) {
    return `${grimoirePage}:${participantId}:${kind}`;
  }

  /**
   * Detects the single participant who moved when a seat rotation is effectively one move,
   * because a seat swap recorded as many independent moves is noisy.
   */
  function detectSingleSeatMove(previousIds: string[], currentIds: string[]) {
    if (previousIds.length !== currentIds.length) return null;
    if (previousIds.join("|") === currentIds.join("|")) return null;

    const prevSet = new Set(previousIds);
    if (
      prevSet.size !== previousIds.length ||
      currentIds.some((id) => !prevSet.has(id))
    ) {
      return null;
    }

    let foundMovedId: string | null = null;
    for (let from = 0; from < previousIds.length; from += 1) {
      const moved = previousIds[from];
      const withoutMoved = previousIds
        .slice(0, from)
        .concat(previousIds.slice(from + 1));
      for (let to = 0; to <= withoutMoved.length; to += 1) {
        const candidate = withoutMoved
          .slice(0, to)
          .concat([moved], withoutMoved.slice(to));
        if (candidate.join("|") === currentIds.join("|")) {
          if (foundMovedId && foundMovedId !== moved) {
            return null;
          }
          foundMovedId = moved;
        }
      }
    }

    return foundMovedId;
  }

  props.game.grimoire.forEach((page, pageIndex) => {
    const orderedTokens = page.tokens.slice().sort((a, b) => a.order - b.order);
    const usedPreviousOrders = new Set<number>();
    orderedTokens.forEach((token) => {
      const previousToken =
        pageIndex > 0
          ? findMatchingTokenOnPreviousPage(
              props.game.grimoire,
              pageIndex,
              token,
              usedPreviousOrders,
              !token.is_dead
            )
          : null;
      const wasDeadPreviously = previousToken?.is_dead ?? false;
      const shouldHaveDeath = token.is_dead && !wasDeadPreviously;
      const shouldHaveRevival = !token.is_dead && wasDeadPreviously;

      if (!token.grimoire_participant_id) {
        token.grimoire_participant_id = createParticipantId();
      }
      const participantId = token.grimoire_participant_id;
      const deadReminderSource = detectDeadReminderSource(orderedTokens, token);
      const oldRoleId = previousToken?.role_id ?? null;
      const newRoleId = token.role_id ?? null;
      const oldAlignment = previousToken?.alignment ?? null;
      const newAlignment = token.alignment ?? null;

      if (shouldHaveDeath) {
        expected.set(expectedKey(pageIndex, participantId, "death"), {
          grimoire_page: pageIndex,
          participant_id: participantId,
          event_type: deadReminderSource
            ? GrimoireEventType.DEATH
            : GrimoireEventType.NOT_RECORDED,
          by_participant_id: deadReminderSource?.by_participant_id ?? null,
          status_source: null,
          player_name: token.player_name || "",
          role_id: token.role_id ?? null,
          by_role_id: deadReminderSource?.by_role_id ?? null,
          old_role_id: oldRoleId,
          new_role_id: newRoleId,
          old_alignment: oldAlignment,
          new_alignment: newAlignment,
        });
      }

      if (shouldHaveRevival) {
        expected.set(expectedKey(pageIndex, participantId, "revival"), {
          grimoire_page: pageIndex,
          participant_id: participantId,
          event_type: GrimoireEventType.REVIVE,
          status_source: null,
          by_participant_id: null,
          player_name: token.player_name || "",
          role_id: token.role_id ?? null,
          by_role_id: null,
          old_role_id: oldRoleId,
          new_role_id: newRoleId,
          old_alignment: oldAlignment,
          new_alignment: newAlignment,
        });
      }

      if (previousToken) {
        const roleChanged =
          !!token.role_id &&
          !!previousToken.role_id &&
          (token.role_id !== previousToken.role_id ||
            token.related_role_id !== previousToken.related_role_id);
        if (roleChanged) {
          expected.set(expectedKey(pageIndex, participantId, "role"), {
            grimoire_page: pageIndex,
            participant_id: participantId,
            event_type: GrimoireEventType.ROLE_CHANGE,
            status_source: null,
            by_participant_id: null,
            player_name: token.player_name || "",
            role_id: token.role_id ?? null,
            by_role_id: null,
            old_role_id: oldRoleId,
            new_role_id: newRoleId,
            old_alignment: oldAlignment,
            new_alignment: newAlignment,
          });
        }

        if (token.order !== previousToken.order) {
          expected.set(expectedKey(pageIndex, participantId, "seat"), {
            grimoire_page: pageIndex,
            participant_id: participantId,
            event_type: GrimoireEventType.SEAT_CHANGE,
            status_source: null,
            by_participant_id: null,
            player_name: token.player_name || "",
            role_id: token.role_id ?? null,
            by_role_id: null,
            old_role_id: oldRoleId,
            new_role_id: newRoleId,
            old_alignment: oldAlignment,
            new_alignment: newAlignment,
          });
        }

        if (token.alignment !== previousToken.alignment) {
          expected.set(expectedKey(pageIndex, participantId, "alignment"), {
            grimoire_page: pageIndex,
            participant_id: participantId,
            event_type: GrimoireEventType.ALIGNMENT_CHANGE,
            status_source: null,
            by_participant_id: null,
            player_name: token.player_name || "",
            role_id: token.role_id ?? null,
            by_role_id: null,
            old_role_id: oldRoleId,
            new_role_id: newRoleId,
            old_alignment: oldAlignment,
            new_alignment: newAlignment,
          });
        }
      }

      for (const config of GRIMOIRE_REMINDER_EVENT_CONFIG) {
        const previousCount = previousToken
          ? countReminderByName(previousToken.reminders, config.reminder)
          : 0;
        const currentCount = countReminderByName(token.reminders, config.reminder);
        if (currentCount <= previousCount) continue;
        const addedMatchingNameReminders = addedRemindersByName(
          token.reminders,
          previousToken?.reminders,
          config.reminder
        );
        if (addedMatchingNameReminders.length === 0) continue;
        const addedRemindersWithRoleHint = addedMatchingNameReminders.filter(
          (reminder) => !!normalizeReminderRoleHint(reminder.token_url)
        );
        if (
          config.sourceRoleIds.length > 0 &&
          addedRemindersWithRoleHint.length > 0 &&
          !addedRemindersWithRoleHint.some((reminder) =>
            reminderMatchesAnyRoleHint(reminder, config.sourceRoleIds)
          )
        ) {
          continue;
        }
        if (
          config.targetRoleIds?.length &&
          (!token.role_id || !config.targetRoleIds.includes(token.role_id))
        ) {
          continue;
        }

        const source = detectReminderEventSource(orderedTokens, config.sourceRoleIds);
        let affectedParticipantId = participantId;
        let affectedToken = token;
        let affectedPreviousToken = previousToken;

        // Pixie madness is represented by placing a "Mad" reminder on another token,
        // but the affected participant is the Pixie player.
        if (
          config.eventType === GrimoireEventType.MAD &&
          source?.by_role_id === "pixie" &&
          source.by_participant_id
        ) {
          const pixieToken = getTokenForParticipant(pageIndex, source.by_participant_id);
          if (pixieToken) {
            affectedParticipantId = source.by_participant_id;
            affectedToken = pixieToken;
            affectedPreviousToken =
              pageIndex > 0
                ? getTokenForParticipant(pageIndex - 1, source.by_participant_id)
                : null;
          }
        }

        const reminderBaseKind = eventKindFromValues(config.eventType);
        const reminderKind =
          (config.eventType === GrimoireEventType.MAD ||
            config.eventType === GrimoireEventType.DRUNK ||
            config.eventType === GrimoireEventType.POISONED ||
            config.eventType === GrimoireEventType.OTHER) &&
          config.reminder
            ? `${reminderBaseKind}:${normalizeReminderName(config.reminder)}`
            : reminderBaseKind;

        const reminderExpectedKey = expectedKey(
          pageIndex,
          affectedParticipantId,
          reminderKind
        );
        const existingExpectation = expected.get(reminderExpectedKey);
        const isLifecycleEventType =
          config.eventType === GrimoireEventType.DEATH ||
          config.eventType === GrimoireEventType.EXECUTION ||
          config.eventType === GrimoireEventType.REVIVE;

        // Lifecycle events should only come from shroud/death-state changes.
        // Reminders may enrich those rows but must not create them on their own.
        if (isLifecycleEventType && !existingExpectation) {
          continue;
        }

        expected.set(reminderExpectedKey, {
          grimoire_page: pageIndex,
          participant_id: affectedParticipantId,
          event_type: existingExpectation?.event_type ?? config.eventType,
          status_source: config.reminder,
          by_participant_id:
            isLifecycleEventType
              ? existingExpectation?.by_participant_id ??
                source?.by_participant_id ??
                null
              : source?.by_participant_id ??
                existingExpectation?.by_participant_id ??
                null,
          player_name: affectedToken.player_name || "",
          role_id: affectedToken.role_id ?? null,
          by_role_id: isLifecycleEventType
            ? existingExpectation?.by_role_id ?? source?.by_role_id ?? null
            : source?.by_role_id ?? existingExpectation?.by_role_id ?? null,
          old_role_id:
            affectedPreviousToken?.role_id ?? existingExpectation?.old_role_id ?? null,
          new_role_id: affectedToken.role_id ?? null,
          old_alignment:
            affectedPreviousToken?.alignment ??
            existingExpectation?.old_alignment ??
            null,
          new_alignment: affectedToken.alignment ?? null,
        });
      }
    });

    if (pageIndex > 0) {
      const previousOrderedTokens = props.game.grimoire[pageIndex - 1].tokens
        .slice()
        .sort((a, b) => a.order - b.order);
      const previousIds = previousOrderedTokens
        .map((t) => t.grimoire_participant_id)
        .filter((id): id is string => !!id);
      const currentIds = orderedTokens
        .map((t) => t.grimoire_participant_id)
        .filter((id): id is string => !!id);

      if (previousIds.length === currentIds.length && previousIds.length > 0) {
        const singleMovedParticipantId = detectSingleSeatMove(previousIds, currentIds);
        if (singleMovedParticipantId) {
          const token = orderedTokens.find(
            (t) => t.grimoire_participant_id === singleMovedParticipantId
          );
          if (token) {
            const previousTokenForSeat =
              previousOrderedTokens.find(
                (t) => t.grimoire_participant_id === singleMovedParticipantId
              ) ?? null;
            expected.set(expectedKey(pageIndex, singleMovedParticipantId, "seat"), {
              grimoire_page: pageIndex,
              participant_id: singleMovedParticipantId,
              event_type: GrimoireEventType.SEAT_CHANGE,
              status_source: null,
              by_participant_id: null,
              player_name: token.player_name || "",
              role_id: token.role_id ?? null,
              by_role_id: null,
              old_role_id: previousTokenForSeat?.role_id ?? null,
              new_role_id: token.role_id ?? null,
              old_alignment: previousTokenForSeat?.alignment ?? null,
              new_alignment: token.alignment ?? null,
            });
          }

          expected.forEach((value, key) => {
            if (
              key.startsWith(`${pageIndex}:`) &&
              value.event_type === GrimoireEventType.SEAT_CHANGE &&
              value.participant_id !== singleMovedParticipantId
            ) {
              expected.delete(key);
            }
          });
        }
      }
    }
  });

  /**
   * Finds the best remaining expected event match for an existing row.
   */
  function takeExpectedByIdentity(event: GrimoireEventLike) {
    let bestKey: string | null = null;
    let bestScore = -1;
    const kind = eventReconciliationKind(event.event_type, event.status_source);

    expected.forEach((candidate, candidateKey) => {
      if (candidate.grimoire_page !== event.grimoire_page) return;
      const candidateKind = eventReconciliationKind(
        candidate.event_type,
        candidate.status_source
      );
      if (candidateKind !== kind) return;

      let score = 0;
      if (
        event.participant_id &&
        candidate.participant_id &&
        event.participant_id === candidate.participant_id
      ) {
        score += 10;
      }
      const eventName = normalizePlayerName(event.player_name);
      const candidateName = normalizePlayerName(candidate.player_name);
      if (eventName && candidateName && eventName === candidateName) score += 3;
      if (event.role_id && candidate.role_id && event.role_id === candidate.role_id) {
        score += 4;
      }

      if (score > bestScore) {
        bestScore = score;
        bestKey = candidateKey;
      }
    });

    if (!bestKey || bestScore <= 0) return null;
    const match = expected.get(bestKey) || null;
    if (match) {
      expected.delete(bestKey);
    }
    return match;
  }

  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    const eventType = event.event_type;
    const kind = eventReconciliationKind(event.event_type, event.status_source);
    const key = expectedKey(event.grimoire_page, event.participant_id, kind);
    let expectation = expected.get(key);
    if (expectation) {
      expected.delete(key);
    } else {
      expectation = takeExpectedByIdentity(event);
      if (expectation && event.participant_id !== expectation.participant_id) {
        event.participant_id = expectation.participant_id;
        updated += 1;
      }
    }
    if (!expectation) {
      events.splice(i, 1);
      removed += 1;
      continue;
    }

    if (event.event_type !== expectation.event_type) {
      const keepManualDeathType =
        !isReviveEventType(eventType) &&
        (expectation.event_type === null ||
          expectation.event_type === GrimoireEventType.NOT_RECORDED) &&
        (event.event_type === null ||
          event.event_type === GrimoireEventType.NOT_RECORDED ||
          event.event_type === GrimoireEventType.DEATH ||
          event.event_type === GrimoireEventType.EXECUTION);
      if (!keepManualDeathType) {
        event.event_type = expectation.event_type;
        updated += 1;
      }
    }

    if (event.event_type === GrimoireEventType.REVIVE && event.cause === null) {
      event.cause = GrimoireEventCause.ABILITY;
    }
    if (
      (event.event_type === GrimoireEventType.MAD ||
        event.event_type === GrimoireEventType.DRUNK ||
        event.event_type === GrimoireEventType.POISONED ||
        event.event_type === GrimoireEventType.OTHER) &&
      event.cause === null
    ) {
      event.cause = GrimoireEventCause.ABILITY;
    }
    if (
      event.event_type === GrimoireEventType.DEATH &&
      expectation.by_participant_id &&
      event.cause === null
    ) {
      event.cause = GrimoireEventCause.ABILITY;
    }

    if (!event.player_name) {
      event.player_name = expectation.player_name;
    }
    if (!event.role_id) {
      event.role_id = expectation.role_id;
    }
    if (!event.by_participant_id && expectation.by_participant_id) {
      event.by_participant_id = expectation.by_participant_id;
    }
    if (!event.by_role_id && expectation.by_role_id) {
      event.by_role_id = expectation.by_role_id;
    }
    if (event.old_role_id !== expectation.old_role_id) {
      event.old_role_id = expectation.old_role_id;
    }
    if (event.new_role_id !== expectation.new_role_id) {
      event.new_role_id = expectation.new_role_id;
    }
    if (event.old_alignment !== expectation.old_alignment) {
      event.old_alignment = expectation.old_alignment;
    }
    if (event.new_alignment !== expectation.new_alignment) {
      event.new_alignment = expectation.new_alignment;
    }
    if (event.status_source !== expectation.status_source) {
      event.status_source = expectation.status_source;
    }
  }

  expected.forEach((expectation) => {
    events.push({
      grimoire_page: expectation.grimoire_page,
      participant_id: expectation.participant_id,
      event_type: expectation.event_type,
      status_source: expectation.status_source,
      cause:
        isReviveEventType(expectation.event_type) ||
        expectation.event_type === GrimoireEventType.MAD ||
        expectation.event_type === GrimoireEventType.DRUNK ||
        expectation.event_type === GrimoireEventType.POISONED ||
        expectation.event_type === GrimoireEventType.OTHER ||
        (expectation.event_type === GrimoireEventType.DEATH &&
          expectation.by_participant_id)
          ? GrimoireEventCause.ABILITY
          : null,
      by_participant_id: expectation.by_participant_id,
      player_name: expectation.player_name,
      role_id: expectation.role_id,
      by_role_id: expectation.by_role_id,
      old_role_id: expectation.old_role_id,
      new_role_id: expectation.new_role_id,
      old_alignment: expectation.old_alignment,
      new_alignment: expectation.new_alignment,
    });
    added += 1;
  });

  if (!silent && (added || removed || updated)) {
    grimoireEventSyncStats.value = { added, updated, removed };
    grimoireEventSyncSummary.value = `Synced events: ${added} added, ${updated} updated, ${removed} removed.`;
  }

  grimoireEventSyncDone.value = true;
}

const grimoireEventSyncAlertColor = computed(() => {
  if (!grimoireEventSyncSummary.value) return "info";
  const { updated, removed } = grimoireEventSyncStats.value;
  return updated > 0 || removed > 0 ? "caution" : "positive";
});

defineExpose({
  recordGrimoireEvent,
  syncGrimoireEventsFromGrimoire,
});
</script>

<style scoped>
  .token-container {
    .initial-token + .current-token {
      @apply ml-10 md:ml-14 mt-6;
    }
  }

  .current-token-reminder {
    position: absolute;
  }

  .clip-token {
    /* clip-path: polygon(0% 0%, 25% 0, 50% 50%, 25% 100%, 0% 100%); */
    /* position: absolute; */
  }
</style>
