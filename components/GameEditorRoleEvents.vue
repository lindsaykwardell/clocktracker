<template>
  <fieldset
    v-if="!editingMultipleGames"
    class="block border rounded border-stone-500 p-4 my-3 bg-center bg-cover"
  >
    <legend>Role Events</legend>
    <p v-if="manualEvents.length === 0" class="text-sm text-stone-400">
      No events recorded yet.
    </p>
    <div class="space-y-4">
      <ul class="py-2 space-y-2">
        <li
          v-for="event in manualEvents"
          :key="event.participant_id"
          class="border border-stone-600 rounded bg-stone-300/50 dark:bg-stone-900/60"
        >
          <details open>
            <summary class="cursor-pointer px-3 py-2 text-stone-700 dark:text-stone-300/85 flex justify-between items-center">
              <span>
                {{ eventSummaryParts(event).before }}
                <span class="font-semibold text-stone-900 dark:text-stone-300">
                  {{ eventSummaryParts(event).action }}
                </span>
                {{ eventSummaryParts(event).after }}
              </span>
              
              <Button
                type="button"
                size="sm"
                color="contrast"
                icon="x-lg"
                @click="removeManualEvent(event)"
                title="Delete Event"
                display="icon-only"
                circular
              >
                Delete Event
              </Button>
            </summary>
            <div class="grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-2 items-center border-t border-stone-700 px-3 py-4">
              <div class="relative flex justify-center items-center aspect-square">
                <Token
                  v-if="event.role_id"
                  :character="eventTargetCharacter(event)"
                  size="md"
                  class="cursor-pointer"
                  :class="{
                    'pointer-events-none opacity-50': !allowManualEventTargetRole(event),
                  }"
                  @clickRole="emit('open-role-dialog', event, 'target')"
                  hideRelated
                />
                <Token v-else outline size="md" class="font-sorts">
                  <button
                    type="button"
                    @click="emit('open-role-dialog', event, 'target')"
                    class="w-full h-full p-1 text-xs"
                    :disabled="!allowManualEventTargetRole(event)"
                  >
                    <template v-if="allowManualEventTargetRole(event)">
                      Add Target
                    </template>
                    <template v-else>
                      No Target Selected
                    </template>
                  </button>
                </Token>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <label>
                  <span class="block text-xs mb-[0.125rem]">Event type</span>
                  <Input
                    mode="select"
                    v-model="event.event_type"
                    @update:modelValue="onEventTypeChange(event)"
                  >
                    <option :value="null">Not recorded</option>
                    <option :value="GrimoireEventType.DEATH">Death</option>
                    <option :value="GrimoireEventType.EXECUTION">Execution</option>
                    <option :value="GrimoireEventType.REVIVE">Revival</option>
                    <option :value="GrimoireEventType.ROLE_CHANGE">Character switch</option>
                    <option :value="GrimoireEventType.ALIGNMENT_CHANGE">Alignment switch</option>
                  </Input>
                </label>
                <label>
                  <span class="block text-xs mb-[0.125rem]">Cause</span>
                  <Input mode="select" v-model="event.cause">
                    <option :value="null">Select cause</option>
                    <option :value="GrimoireEventCause.ABILITY">Ability</option>
                    <option
                      v-if="event.event_type === GrimoireEventType.EXECUTION"
                      :value="GrimoireEventCause.NOMINATION"
                    >
                      Nomination
                    </option>
                  </Input>
                </label>
                <label class="col-span-2">
                  <span class="block text-xs mb-[0.125rem]">Select target character</span>
                  <Input
                    mode="select"
                    :modelValue="getManualEventTargetSelection(event)"
                    @update:modelValue="
                      (value) => updateManualEventTargetSelection(event, value as any)
                    "
                  >
                    <option :value="null">No character selected</option>
                    <optgroup
                      v-if="playerCharacterOptions.length > 0"
                      label="Your Roles"
                    >
                      <option
                        v-for="option in playerCharacterOptions"
                        :key="option.value"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </option>
                    </optgroup>
                    <optgroup label="Custom">
                      <option value="custom">Set custom character</option>
                    </optgroup>
                  </Input>
                </label>
                <label class="col-span-2">
                  <span class="block text-xs mb-[0.125rem]">Select triggering character</span>
                  <Input
                    mode="select"
                    :modelValue="getManualEventSourceSelection(event)"
                    @update:modelValue="
                      (value) => updateManualEventSourceSelection(event, value as any)
                    "
                    :disabled="event.cause === null"
                  >
                    <option :value="null">No character selected</option>
                    <optgroup
                      v-if="sourcePlayerCharacterOptions(event).length > 0"
                      label="Your Roles"
                    >
                      <option
                        v-for="option in sourcePlayerCharacterOptions(event)"
                        :key="option.value"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </option>
                    </optgroup>
                    <optgroup label="Custom">
                      <option value="custom">Set custom character</option>
                    </optgroup>
                  </Input>
                </label>
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
                  :character="eventSourceCharacter(event)"
                  size="md"
                  class="cursor-pointer"
                  :class="{
                    'pointer-events-none opacity-50': !allowManualEventSourceRole(event),
                  }"
                  @clickRole="emit('open-role-dialog', event, 'source')"
                  hideRelated
                />
                <Token v-else outline size="md" class="font-sorts">
                  <button
                    type="button"
                    @click="emit('open-role-dialog', event, 'source')"
                    class="w-full h-full p-1 text-xs"
                    :disabled="!allowManualEventSourceRole(event)"
                  >
                    <template v-if="allowManualEventSourceRole(event)">
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
    </div>
    <Button type="button" size="sm" icon="plus-lg" @click="addManualEvent">
      Add Event
    </Button>
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
import {
  AUTO_MANUAL_GRIMOIRE_EVENT_PREFIX,
  createManualGrimoireEventParticipantId,
  isAutoManualGrimoireEventParticipant,
  isManualGrimoireEventParticipant,
} from "~/composables/manualGrimoireEvents";

type RoleSnapshot = {
  token_url: string;
  type: string;
  initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
};

type PlayerCharacterLike = {
  name: string;
  role_id: string | null;
  alignment: "GOOD" | "EVIL" | "NEUTRAL" | undefined;
  role?: RoleSnapshot;
};

type GrimoireEventLike = {
  grimoire_page: number;
  participant_id: string;
  player_name: string;
  event_type: GrimoireEventType | null;
  status_source?: string | null;
  cause: GrimoireEventCause | null;
  by_participant_id: string | null;
  by_role_id: string | null;
  role_id: string | null;
  old_role_id: string | null;
  new_role_id: string | null;
  old_alignment: "GOOD" | "EVIL" | "NEUTRAL" | null;
  new_alignment: "GOOD" | "EVIL" | "NEUTRAL" | null;
};

type RoleSelectionField = "target" | "source";

const props = defineProps<{
  editingMultipleGames?: boolean;
  scriptRoleIds: Set<string>;
  game: {
    player_characters: PlayerCharacterLike[];
    grimoire_events: GrimoireEventLike[];
  };
}>();

const emit = defineEmits<{
  (
    e: "open-role-dialog",
    event: GrimoireEventLike,
    field: RoleSelectionField
  ): void;
}>();

const allRoles = useRoles();
const customTargetEventIds = ref(new Set<string>());
const customSourceEventIds = ref(new Set<string>());

const manualEvents = computed(() =>
  props.game.grimoire_events.filter((event) =>
    isManualGrimoireEventParticipant(event.participant_id)
  )
);

const playerCharacterOptions = computed(() =>
  props.game.player_characters
    .map((character, index) => ({
      value: `player-character:${index}`,
      index,
      roleId: character.role_id,
      label: character.name || "Unknown role",
      character,
    }))
    .filter((option) => !!option.roleId && !!option.character.role)
);

function normalizedAlignment(value: PlayerCharacterLike["alignment"]) {
  return value ?? null;
}

function autoManualEventId(index: number, kind: "role" | "alignment") {
  return `${AUTO_MANUAL_GRIMOIRE_EVENT_PREFIX}your-roles-${index}-${kind}`;
}

function expectedAutomaticManualEvents() {
  const expected: GrimoireEventLike[] = [];

  for (let index = 1; index < props.game.player_characters.length; index += 1) {
    const previous = props.game.player_characters[index - 1];
    const current = props.game.player_characters[index];
    if (!previous || !current) continue;

    if (previous.role_id && current.role_id && previous.role_id !== current.role_id) {
      expected.push({
        grimoire_page: 0,
        participant_id: autoManualEventId(index, "role"),
        event_type: GrimoireEventType.ROLE_CHANGE,
        status_source: null,
        cause: null,
        by_participant_id: null,
        player_name: "",
        role_id: current.role_id,
        by_role_id: null,
        old_role_id: previous.role_id,
        new_role_id: current.role_id,
        old_alignment: normalizedAlignment(previous.alignment),
        new_alignment: normalizedAlignment(current.alignment),
      });
    }

    const previousAlignment = normalizedAlignment(previous.alignment);
    const currentAlignment = normalizedAlignment(current.alignment);
    if (
      previousAlignment &&
      currentAlignment &&
      previousAlignment !== currentAlignment
    ) {
      expected.push({
        grimoire_page: 0,
        participant_id: autoManualEventId(index, "alignment"),
        event_type: GrimoireEventType.ALIGNMENT_CHANGE,
        status_source: null,
        cause: null,
        by_participant_id: null,
        player_name: "",
        role_id: current.role_id,
        by_role_id: null,
        old_role_id: previous.role_id,
        new_role_id: current.role_id,
        old_alignment: previousAlignment,
        new_alignment: currentAlignment,
      });
    }
  }

  return expected;
}

function syncAutomaticManualEvents() {
  const expected = expectedAutomaticManualEvents();
  const expectedById = new Map(
    expected.map((event) => [event.participant_id, event])
  );

  for (let index = props.game.grimoire_events.length - 1; index >= 0; index -= 1) {
    const event = props.game.grimoire_events[index];
    if (!event) continue;
    if (!isAutoManualGrimoireEventParticipant(event.participant_id)) continue;
    if (expectedById.has(event.participant_id)) continue;
    props.game.grimoire_events.splice(index, 1);
  }

  for (const expectedEvent of expected) {
    const existing = props.game.grimoire_events.find(
      (event) => event.participant_id === expectedEvent.participant_id
    );
    if (!existing) {
      props.game.grimoire_events.push(expectedEvent);
      continue;
    }

    existing.grimoire_page = expectedEvent.grimoire_page;
    existing.event_type = expectedEvent.event_type;
    existing.status_source = expectedEvent.status_source;
    existing.player_name = expectedEvent.player_name;
    existing.role_id = expectedEvent.role_id;
    existing.old_role_id = expectedEvent.old_role_id;
    existing.new_role_id = expectedEvent.new_role_id;
    existing.old_alignment = expectedEvent.old_alignment;
    existing.new_alignment = expectedEvent.new_alignment;
  }
}

watch(
  () =>
    props.game.player_characters
      .map((character) =>
        [
          character.role_id ?? "",
          character.alignment ?? "",
        ].join(":")
      )
      .join("|"),
  syncAutomaticManualEvents,
  { immediate: true }
);

function sourceAllowedRoleIds(event: GrimoireEventLike) {
  const type = event.event_type ?? GrimoireEventType.NOT_RECORDED;
  const config: RoleIncludeConfig | undefined = GRIMOIRE_EVENT_ROLE_INCLUDES[type];
  if (!config) return null;
  const includes = [
    ...(config.base ?? []),
    ...(config.conditional ?? [])
      .filter((entry) =>
        entry.requires.every((required) => props.scriptRoleIds?.has(required) ?? false)
      )
      .map((entry) => entry.role),
  ];
  return includes.length > 0 ? new Set(includes) : null;
}

function sourcePlayerCharacterOptions(event: GrimoireEventLike) {
  const allowed = sourceAllowedRoleIds(event);
  if (!allowed) return playerCharacterOptions.value;
  return playerCharacterOptions.value.filter(
    (option) => !!option.roleId && allowed.has(option.roleId)
  );
}

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

function characterForRoleId(roleId: string | null) {
  if (!roleId) return blankCharacter();
  const role = allRoles.getRole(roleId);
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

function roleNameWithArticle(roleName: string) {
  if (!roleName) return "";
  if (roleName.startsWith("The ")) return roleName;
  if (["Legion", "Lil' Monsta", "Riot"].includes(roleName)) return roleName;
  return `the ${roleName}`;
}

function roleName(roleId: string | null) {
  return roleId ? allRoles.getRole(roleId)?.name || "" : "";
}

function eventTargetLabel(event: GrimoireEventLike) {
  return event.player_name || roleNameWithArticle(roleName(event.role_id)) || "Unknown player";
}

function eventSourceLabel(event: GrimoireEventLike) {
  return roleNameWithArticle(roleName(event.by_role_id));
}

function eventSummaryParts(event: GrimoireEventLike) {
  const targetName = eventTargetLabel(event);
  const sourceActor = eventSourceLabel(event);

  if (!event.event_type || event.event_type === GrimoireEventType.NOT_RECORDED) {
    return {
      before: "",
      action: "New event",
      after: "",
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
      after: sourceActor ? ` by ${sourceActor}` : "",
    };
  }
  if (event.event_type === GrimoireEventType.ROLE_CHANGE) {
    return {
      before: `${targetName} `,
      action: "changed character",
      after: sourceActor ? ` due to ${sourceActor}` : "",
    };
  }
  if (event.event_type === GrimoireEventType.ALIGNMENT_CHANGE) {
    return {
      before: `${targetName} `,
      action: "changed alignment",
      after: sourceActor ? ` due to ${sourceActor}` : "",
    };
  }
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

function eventTargetCharacter(event: GrimoireEventLike) {
  return characterForRoleId(event.role_id);
}

function eventSourceCharacter(event: GrimoireEventLike) {
  return characterForRoleId(event.by_role_id);
}

function eventSelectionKey(event: GrimoireEventLike) {
  return event.participant_id;
}

function getManualEventTargetSelection(event: GrimoireEventLike) {
  const key = eventSelectionKey(event);
  if (customTargetEventIds.value.has(key)) return "custom";
  const option = playerCharacterOptions.value.find(
    (candidate) => candidate.roleId === event.role_id
  );
  return option?.value ?? (event.role_id ? "custom" : null);
}

function getManualEventSourceSelection(event: GrimoireEventLike) {
  const key = eventSelectionKey(event);
  if (customSourceEventIds.value.has(key)) return "custom";
  const option = sourcePlayerCharacterOptions(event).find(
    (candidate) => candidate.roleId === event.by_role_id
  );
  return option?.value ?? (event.by_role_id ? "custom" : null);
}

function playerCharacterOption(value: string | null) {
  if (!value?.startsWith("player-character:")) return null;
  return playerCharacterOptions.value.find((option) => option.value === value) ?? null;
}

function updateManualEventTargetSelection(
  event: GrimoireEventLike,
  value: string | "custom" | null
) {
  const key = eventSelectionKey(event);
  if (value === "custom") {
    customTargetEventIds.value.add(key);
    return;
  }
  if (value === null) {
    event.role_id = null;
    event.player_name = "";
    customTargetEventIds.value.delete(key);
    return;
  }
  const option = playerCharacterOption(value);
  if (!option?.roleId) return;

  event.role_id = option.roleId;
  event.player_name = "";
  customTargetEventIds.value.delete(key);
}

function updateManualEventSourceSelection(
  event: GrimoireEventLike,
  value: string | "custom" | null
) {
  const key = eventSelectionKey(event);
  if (value === "custom") {
    customSourceEventIds.value.add(key);
    event.by_participant_id = null;
    return;
  }
  if (value === null) {
    event.by_role_id = null;
    event.by_participant_id = null;
    customSourceEventIds.value.delete(key);
    return;
  }
  const option = sourcePlayerCharacterOptions(event).find(
    (candidate) => candidate.value === value
  );
  if (!option?.roleId) return;

  event.by_role_id = option.roleId;
  event.by_participant_id = null;
  customSourceEventIds.value.delete(key);
}

function allowManualEventTargetRole(event: GrimoireEventLike) {
  return (
    playerCharacterOptions.value.length === 0 ||
    customTargetEventIds.value.has(eventSelectionKey(event)) ||
    getManualEventTargetSelection(event) === "custom"
  );
}

function allowManualEventSourceRole(event: GrimoireEventLike) {
  if (event.cause === null) return false;
  return (
    sourcePlayerCharacterOptions(event).length === 0 ||
    customSourceEventIds.value.has(eventSelectionKey(event)) ||
    getManualEventSourceSelection(event) === "custom"
  );
}

function onEventTypeChange(event: GrimoireEventLike) {
  if (!event.event_type || event.event_type === GrimoireEventType.NOT_RECORDED) {
    event.cause = null;
    event.by_role_id = null;
    event.by_participant_id = null;
    customSourceEventIds.value.delete(eventSelectionKey(event));
    return;
  }
  if (event.event_type !== GrimoireEventType.EXECUTION) {
    event.cause = GrimoireEventCause.ABILITY;
  }
  const allowed = sourceAllowedRoleIds(event);
  if (allowed && event.by_role_id && !allowed.has(event.by_role_id)) {
    event.by_role_id = null;
    event.by_participant_id = null;
    customSourceEventIds.value.delete(eventSelectionKey(event));
  }
}

function addManualEvent() {
  props.game.grimoire_events.push({
    grimoire_page: 0,
    participant_id: createManualGrimoireEventParticipantId(),
    event_type: null,
    status_source: null,
    cause: null,
    by_participant_id: null,
    player_name: "",
    role_id: null,
    by_role_id: null,
    old_role_id: null,
    new_role_id: null,
    old_alignment: null,
    new_alignment: null,
  });
}

function removeManualEvent(event: GrimoireEventLike) {
  const index = props.game.grimoire_events.indexOf(event);
  if (index < 0) return;
  props.game.grimoire_events.splice(index, 1);
}
</script>
