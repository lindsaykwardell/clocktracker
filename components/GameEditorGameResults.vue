<template>
  <fieldset
    id="game-results"
    class="flex flex-col gap-5 border rounded border-stone-500 p-4 my-3"
  >
    <legend>Game Results</legend>
    <fieldset class="flex gap-4 flex-wrap">
      <label class="flex gap-2 items-center">
        <input
          type="radio"
          v-model="game.win_v2"
          :value="WinStatus_V2.GOOD_WINS"
          class="border border-stone-500"
        />
        <span class="block whitespace-nowrap"> Good wins </span>
      </label>
      <label class="flex gap-2 items-center">
        <input
          type="radio"
          v-model="game.win_v2"
          :value="WinStatus_V2.EVIL_WINS"
          class="border border-stone-500"
        />
        <span class="block whitespace-nowrap"> Evil wins </span>
      </label>
      <label class="flex gap-2 items-center">
        <input
          type="radio"
          v-model="game.win_v2"
          :value="WinStatus_V2.NOT_RECORDED"
          class="border border-stone-500"
        />
        <span class="block whitespace-nowrap"> Not recorded </span>
      </label>
      <label v-if="editingMultipleGames" class="flex gap-2 items-center">
        <input
          type="radio"
          v-model="game.win_v2"
          :value="undefined"
          class="border border-stone-500"
        />
        <span class="block whitespace-nowrap"> Not updated </span>
      </label>
      <label v-if="!editingMultipleGames" class="flex gap-2 items-center">
        <input type="checkbox" v-model="game.ignore_for_stats" />
        <span class="block whitespace-nowrap">Ignore for stats</span>
      </label>
    </fieldset>

    <fieldset class="flex flex-col gap-3 w-full md:w-auto">
      <label>
        <span class="block">Game end trigger</span>
        <Input mode="select" v-model="game.end_trigger">
          <option v-if="editingMultipleGames" :value="undefined">
            Not updated
          </option>
          <option :value="GameEndTrigger.NOT_RECORDED">
            Not recorded
          </option>
          <option :value="GameEndTrigger.NO_LIVING_DEMON">
            No living demon remained (Execution, Slayer, Pit-Hag, etc.)
          </option>
          <option :value="GameEndTrigger.ADDITIONAL_WIN_CONDITION">
            Additional win condition (Saint, Goblin, etc.)
          </option>
          <option :value="GameEndTrigger.TWO_PLAYERS_LEFT_ALIVE">
            Two players left alive (Execution, Imp, Mutant, etc.)
          </option>
          <option :value="GameEndTrigger.GAME_ENDED_EARLY">
            Game ended early
          </option>
          <option :value="GameEndTrigger.OTHER">Other</option>
        </Input>
      </label>
      <div
        v-if="shouldShowEndTriggerCharacterSection"
        class="flex gap-4 border border-stone-600 rounded bg-stone-300/50 dark:bg-stone-900/60 p-4"
      >
        <div class="flex-1 grid grid-cols-2 gap-2">
          <label v-if="shouldShowEndTriggerType" class="block">
            <span class="block text-xs mb-[0.125rem]">Trigger type</span>
            <Input
              mode="select"
              v-model="game.end_trigger_type"
              :disabled="hasSingleEndTriggerTypeOption"
            >
              <option :value="null">Not recorded</option>
              <option
                v-for="option in endTriggerTypeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </Input>
          </label>
          <label v-if="shouldShowEndTriggerCause" class="block">
            <span class="block text-xs mb-[0.125rem]">Cause</span>
            <Input
              mode="select"
              v-model="game.end_trigger_cause"
              :disabled="hasSingleEndTriggerCauseOption"
            >
              <option :value="null">{{ endTriggerCausePlaceholder }}</option>
              <option
                v-for="option in endTriggerCauseOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </Input>
          </label>
          <label
            v-if="shouldShowEndTriggerCharacter"
            class="block col-span-2"
          >
            <span class="block text-xs mb-[0.125rem]">Select triggering character</span>
            <Input
              mode="select"
              v-model="endTriggerSeatSelection"
              @change="selectEndTriggerSeat"
              :disabled="!shouldShowEndTriggerCharacter"
            >
              <option :value="null">No character selected</option>
              <optgroup
                v-for="group in endTriggerSeatOptionGroups"
                :key="group.label"
                :label="group.label"
              >
                <option
                  v-for="seat in group.options"
                  :key="seat.participant_id"
                  :value="seat.participant_id"
                >
                  {{ seat.label }}
                </option>
              </optgroup>
              <optgroup label="Custom">
                <option value="custom">Set custom character</option>
              </optgroup>
            </Input>
            <Alert
              v-if="shouldShowEndTriggerCharacter && endTriggerSeatOptions.length === 0"
              color="info"
              class="mt-1"
            >
              No eligible characters for this trigger found, but you can add a custom character.
            </Alert>
            <p
              v-else-if="shouldShowEndTriggerCharacter"
              class="text-xs text-stone-600 mt-1"
            >
              <template v-if="advancedModeEnabled">
                Select a character from the last grimoire page or add custom character.
              </template>
              <template v-else>
                Select the last character from your roles or add custom character.
              </template>
            </p>
            <p v-else class="text-xs text-stone-400 mt-1">
              Choose the trigger type and cause first.
            </p>
          </label>
          <label
            v-if="shouldShowEndTriggerSubtype"
            class="block col-span-2"
          >
            <span class="block text-xs mb-[0.125rem]">End Trigger Ability Detail</span>
            <Input mode="select" v-model="endTriggerSubtypeSelection">
              <option :value="null">Not recorded</option>
              <option
                v-for="option in endTriggerSubtypeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </Input>
          </label>
        </div>
        <div
          v-if="shouldShowEndTriggerCharacter"
          class="flex gap-3 flex-wrap items-center"
        >
          <div class="relative flex justify-center items-center aspect-square">
            <Button
              v-if="game.end_trigger_role"
              type="button"
              @click="clearEndTriggerRole"
              class="absolute top-1 right-1 z-10"
              color="contrast"
              size="sm"
              icon="x-lg"
              display="icon-only"
              circular
              title="Clear triggering character"
            >
              Clear
            </Button>
            <Token
              v-if="game.end_trigger_role"
              :character="endTriggerCharacter"
              size="md"
              class="cursor-pointer"
              :class="{
                'pointer-events-none opacity-50':
                  !allowManualEndTriggerRole || !shouldShowEndTriggerCharacter,
              }"
              @clickRole="emit('open-role-dialog')"
              hideRelated
            />
            <Token v-else outline size="md" class="font-sorts">
              <button
                type="button"
                @click="emit('open-role-dialog')"
                class="w-full h-full p-1 text-sm"
                :disabled="!allowManualEndTriggerRole || !shouldShowEndTriggerCharacter"
              >
                <template v-if="allowManualEndTriggerRole">
                  Add Character
                </template>
                <template v-else>
                  No Character Selected
                </template>
              </button>
            </Token>
          </div>
        </div>
      </div>
      <label
        v-if="
          game.end_trigger === GameEndTrigger.GAME_ENDED_EARLY ||
          game.end_trigger === GameEndTrigger.OTHER
        "
        class="block"
      >
        <span class="block">Reason</span>
        <Input type="text" v-model="game.end_trigger_note" />
      </label>
    </fieldset>
  </fieldset>
</template>

<script setup lang="ts">
import {
  GameEndTrigger,
  GameEndTriggerCause,
  GameEndTriggerType,
  WinStatus_V2,
} from "~/composables/useGames";
import {
  ADDITIONAL_WIN_CONDITION_ROLE_INCLUDES,
  END_TRIGGER_ROLE_INCLUDES,
} from "~/composables/gameEndTriggerConfig";
import {
  getEndTriggerSubtypeOptions,
  parseEndTriggerSubtype,
} from "~/composables/endTriggerSubtypeConfig";
import { WILDCARD_ROLE_IDS } from "~/composables/grimoireRoleGroups";

const wildcardRoleIds = new Set(WILDCARD_ROLE_IDS);

type EndTriggerSeatToken = {
  order: number;
  player_name: string;
  role_id: string | null;
  grimoire_participant_id?: string | null;
  role?: {
    name?: string;
    token_url: string;
    type: string;
    initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
  };
};

type EndTriggerPage = {
  tokens: EndTriggerSeatToken[];
};

type EndTriggerPlayerCharacter = {
  name: string;
  role_id: string | null;
  role?: {
    token_url: string;
    type: string;
    initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
  };
};

type EndTriggerSeatOption = {
  source: "grimoire" | "player_character";
  order: number;
  participant_id: string;
  role_id: string | null;
  label: string;
  role: {
    name: string;
    token_url: string;
    type: string;
    initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
  } | null;
  token?: EndTriggerSeatToken;
};

const props = defineProps<{
  editingMultipleGames?: boolean;
  advancedModeEnabled: boolean;
  scriptRoleIds: Set<string>;
  game: {
    win_v2: WinStatus_V2 | undefined;
    ignore_for_stats: boolean;
    end_trigger: GameEndTrigger | undefined;
    end_trigger_type: GameEndTriggerType | null;
    end_trigger_cause: GameEndTriggerCause | null;
    end_trigger_role_id: string | null;
    end_trigger_subtype: string;
    end_trigger_note: string;
    end_trigger_participant_id: string | null;
    end_trigger_role?: {
      token_url: string;
      type: string;
      initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
      name: string;
    } | null;
    player_characters: EndTriggerPlayerCharacter[];
    grimoire: EndTriggerPage[];
  };
}>();

const emit = defineEmits<{
  (e: "open-role-dialog"): void;
}>();

const endTriggerCharacter = computed(() => {
  const role = props.game.end_trigger_role;
  if (!role) {
    return {
      name: "",
      alignment: "NEUTRAL",
      role: {
        token_url: "/1x1.png",
        type: "",
        initial_alignment: "NEUTRAL",
      },
    };
  }

  return {
    name: role.name,
    alignment: role.initial_alignment,
    role: {
      token_url: role.token_url,
      type: role.type,
      initial_alignment: role.initial_alignment,
    },
  };
});

const endTriggerSeatTokens = computed(() => {
  if (!props.game.grimoire.length) return [];
  return props.game.grimoire[Math.max(0, props.game.grimoire.length - 1)]?.tokens ?? [];
});

const shouldShowEndTriggerCharacterSection = computed(
  () =>
    props.game.end_trigger === GameEndTrigger.ADDITIONAL_WIN_CONDITION ||
    props.game.end_trigger === GameEndTrigger.NO_LIVING_DEMON ||
    props.game.end_trigger === GameEndTrigger.TWO_PLAYERS_LEFT_ALIVE
);

const shouldShowEndTriggerType = computed(
  () =>
    shouldShowEndTriggerCharacterSection.value &&
    props.game.end_trigger !== GameEndTrigger.ADDITIONAL_WIN_CONDITION
);

const shouldShowEndTriggerCause = computed(() => {
  if (props.game.end_trigger === GameEndTrigger.ADDITIONAL_WIN_CONDITION) return true;
  if (!shouldShowEndTriggerType.value) return false;
  return props.game.end_trigger_type !== null;
});

const shouldShowEndTriggerCharacter = computed(() => {
  if (!shouldShowEndTriggerCharacterSection.value) return false;
  if (shouldShowEndTriggerType.value && props.game.end_trigger_type === null) {
    return false;
  }
  return props.game.end_trigger_cause !== null;
});

const shouldShowEndTriggerFieldsAfterType = computed(() => {
  if (!shouldShowEndTriggerCharacterSection.value) return false;
  if (props.game.end_trigger === GameEndTrigger.ADDITIONAL_WIN_CONDITION) {
    return props.game.end_trigger_cause !== null;
  }
  if (!shouldShowEndTriggerType.value) return true;
  return props.game.end_trigger_type !== null;
});

const endTriggerCausePlaceholder = "Not recorded";

const endTriggerSubtypeOptions = computed(() => {
  if (
    props.game.end_trigger !== GameEndTrigger.ADDITIONAL_WIN_CONDITION ||
    props.game.end_trigger_cause !== GameEndTriggerCause.ABILITY
  ) {
    return [];
  }

  return getEndTriggerSubtypeOptions(props.game.end_trigger_role_id);
});

const shouldShowEndTriggerSubtype = computed(
  () =>
    shouldShowEndTriggerFieldsAfterType.value &&
    endTriggerSubtypeOptions.value.length > 0
);

const endTriggerSubtypeSelection = computed<string | null>({
  get() {
    if (!shouldShowEndTriggerSubtype.value) return null;
    const parsedSubtype =
      parseEndTriggerSubtype(props.game.end_trigger_subtype) ??
      parseEndTriggerSubtype(props.game.end_trigger_note);
    if (!parsedSubtype) return null;

    return endTriggerSubtypeOptions.value.some(
      (option) => option.value === parsedSubtype
    )
      ? parsedSubtype
      : null;
  },
  set(value) {
    props.game.end_trigger_subtype = value ?? "";
  },
});

const endTriggerTypeOptions = computed(() => {
  if (!shouldShowEndTriggerType.value) return [];
  return [
    { value: GameEndTriggerType.DEATH, label: "Death" },
    { value: GameEndTriggerType.EXECUTION, label: "Execution" },
    { value: GameEndTriggerType.CHARACTER_CHANGE, label: "Character change" },
    { value: GameEndTriggerType.OTHER, label: "Other" },
  ];
});

const hasSingleEndTriggerTypeOption = computed(
  () =>
    endTriggerTypeOptions.value.length === 1 &&
    props.game.end_trigger !== GameEndTrigger.ADDITIONAL_WIN_CONDITION
);

const endTriggerCauseOptions = computed(() => {
  if (props.game.end_trigger === GameEndTrigger.ADDITIONAL_WIN_CONDITION) {
    return [{ value: GameEndTriggerCause.ABILITY, label: "Ability" }];
  }

  if (!shouldShowEndTriggerType.value) return [];

  switch (props.game.end_trigger_type) {
    case GameEndTriggerType.DEATH:
      return [{ value: GameEndTriggerCause.ABILITY, label: "Ability" }];
    case GameEndTriggerType.EXECUTION:
      return [
        { value: GameEndTriggerCause.ABILITY, label: "Ability" },
        { value: GameEndTriggerCause.NOMINATION, label: "Nomination" },
      ];
    case GameEndTriggerType.CHARACTER_CHANGE:
      return [{ value: GameEndTriggerCause.ABILITY, label: "Ability" }];
    case GameEndTriggerType.OTHER:
      return [
        { value: GameEndTriggerCause.FAILED_ABILITY, label: "Failed ability" },
        { value: GameEndTriggerCause.ABILITY, label: "Ability" },
      ];
    default:
      return [];
  }
});

const hasSingleEndTriggerCauseOption = computed(
  () =>
    endTriggerCauseOptions.value.length === 1 &&
    props.game.end_trigger !== GameEndTrigger.ADDITIONAL_WIN_CONDITION
);

const endTriggerRoleConfig = computed(() => {
  if (
    props.game.end_trigger === GameEndTrigger.ADDITIONAL_WIN_CONDITION &&
    props.game.end_trigger_cause === GameEndTriggerCause.ABILITY
  ) {
    return ADDITIONAL_WIN_CONDITION_ROLE_INCLUDES;
  }

  if (
    !props.game.end_trigger ||
    !props.game.end_trigger_type ||
    !props.game.end_trigger_cause
  ) {
    return null;
  }
  return (
    END_TRIGGER_ROLE_INCLUDES[props.game.end_trigger]?.[
      props.game.end_trigger_type
    ]?.[props.game.end_trigger_cause] ?? null
  );
});

const endTriggerIncludeRoleIds = computed(() => {
  const config = endTriggerRoleConfig.value;
  if (!config) return [];

  const includes = [
    ...(config.base ?? []),
    ...(config.conditional ?? [])
      .filter((entry) =>
        entry.requires.every((required) => props.scriptRoleIds?.has(required) ?? false)
      )
      .map((entry) => entry.role),
  ];

  return Array.from(new Set(includes));
});

const endTriggerSeatOptions = computed(() => {
  const allowed = endTriggerRoleConfig.value
    ? new Set(endTriggerIncludeRoleIds.value)
    : null;

  if (!props.advancedModeEnabled) {
    const lastCharacter = props.game.player_characters.at(-1);
    if (!lastCharacter?.role_id || !lastCharacter.role) {
      return [];
    }

    return [
      {
        source: "player_character",
        order: props.game.player_characters.length - 1,
        participant_id: "player-character-last",
        role_id: lastCharacter.role_id,
        label: `${lastCharacter.name || "Unknown role"}`,
        role: {
          name: lastCharacter.name,
          token_url: lastCharacter.role.token_url,
          type: lastCharacter.role.type,
          initial_alignment: lastCharacter.role.initial_alignment,
        },
      },
    ] satisfies EndTriggerSeatOption[];
  }

  return endTriggerSeatTokens.value.map((token) => ({
    source: "grimoire",
    order: token.order,
    participant_id: token.grimoire_participant_id || `seat-${token.order}`,
    role_id: token.role_id,
    label: `${token.role?.name || "Unknown role"} - ${token.player_name?.trim() || `Seat ${token.order + 1}`}`,
    role: token.role
      ? {
          name: token.role.name ?? "",
          token_url: token.role.token_url,
          type: token.role.type,
          initial_alignment: token.role.initial_alignment,
        }
      : null,
    token,
  })) satisfies EndTriggerSeatOption[];
});

const endTriggerSeatOptionGroups = computed(() => {
  const allowed = endTriggerRoleConfig.value
    ? new Set(endTriggerIncludeRoleIds.value)
    : null;
  const eligibleOptions = endTriggerSeatOptions.value.filter((option) => {
    if (allowed && (!option.role_id || !allowed.has(option.role_id))) return false;
    return !option.role_id || !wildcardRoleIds.has(option.role_id);
  });
  const wildcardOptions = endTriggerSeatOptions.value.filter((option) => {
    if (!option.role_id) return false;
    if (allowed && !allowed.has(option.role_id)) return false;
    return wildcardRoleIds.has(option.role_id);
  });
  const otherOptions = endTriggerSeatOptions.value.filter((option) => {
    if (!allowed) return false;
    if (!option.role_id) return true;
    return !allowed.has(option.role_id);
  });

  return [
    {
      label: props.advancedModeEnabled ? "Eligible Characters" : "Your Roles",
      options: eligibleOptions,
    },
    { label: "Wildcard Characters", options: wildcardOptions },
    { label: "Other Characters", options: otherOptions },
  ].filter((group) => group.options.length > 0);
});

const endTriggerSeatSelection = ref<string | "custom" | null>(
  props.game.end_trigger_participant_id ?? null
);

watch(
  () => props.game.end_trigger_participant_id,
  (value) => {
    if (value === null || value === undefined) {
      endTriggerSeatSelection.value = null;
    } else {
      endTriggerSeatSelection.value = value as string;
    }
  }
);

watch(
  () => endTriggerSeatOptions.value.length,
  (length) => {
    if (length === 0) {
      endTriggerSeatSelection.value = "custom";
    } else if (endTriggerSeatSelection.value === "custom") {
      if (props.game.end_trigger_participant_id === null) {
        endTriggerSeatSelection.value = null;
      }
    }
  },
  { immediate: true }
);

const allowManualEndTriggerRole = computed(() => {
  if (endTriggerSeatOptions.value.length === 0) return true;
  return endTriggerSeatSelection.value === "custom";
});

function selectEndTriggerSeat() {
  if (!shouldShowEndTriggerCharacter.value) {
    props.game.end_trigger_participant_id = null;
    return;
  }

  const selection = endTriggerSeatSelection.value;

  if (selection === "custom") {
    props.game.end_trigger_participant_id = null;
    return;
  }

  if (selection === null) {
    props.game.end_trigger_participant_id = null;
    return;
  }

  props.game.end_trigger_participant_id = selection;
  const seat = endTriggerSeatOptions.value.find(
    (option) => option.participant_id === selection
  );
  if (!seat) return;

  props.game.end_trigger_participant_id =
    seat.source === "grimoire" ? selection : null;

  if (seat.role_id) {
    props.game.end_trigger_role_id = seat.role_id;
    if (seat.role) {
      props.game.end_trigger_role = {
        token_url: seat.role.token_url,
        type: seat.role.type,
        initial_alignment: seat.role.initial_alignment,
        name: seat.role.name,
      };
    } else {
      props.game.end_trigger_role = null;
    }
  } else {
    props.game.end_trigger_role_id = null;
    props.game.end_trigger_role = null;
  }
}

function clearEndTriggerRole() {
  props.game.end_trigger_role_id = null;
  props.game.end_trigger_role = null;
  props.game.end_trigger_participant_id = null;
  endTriggerSeatSelection.value = null;
}

function getRestrictRoleIds() {
  return endTriggerIncludeRoleIds.value.length > 0 ? endTriggerIncludeRoleIds.value : null;
}

watch(
  () => props.game.end_trigger,
  (value) => {
    if (value === undefined) return;

    props.game.end_trigger_role_id = null;
    props.game.end_trigger_role = null;
    props.game.end_trigger_participant_id = null;
    props.game.end_trigger_subtype = "";

    if (
      value !== GameEndTrigger.NO_LIVING_DEMON &&
      value !== GameEndTrigger.TWO_PLAYERS_LEFT_ALIVE
    ) {
      props.game.end_trigger_type = null;
    }

    if (value === GameEndTrigger.ADDITIONAL_WIN_CONDITION) {
      props.game.end_trigger_type = null;
      props.game.end_trigger_cause = null;
    } else if (
      props.game.end_trigger_type === GameEndTriggerType.EXTRA_WIN_CONDITION
    ) {
      props.game.end_trigger_type = null;
      props.game.end_trigger_cause = null;
    } else {
      props.game.end_trigger_cause = null;
    }

    if (
      value !== GameEndTrigger.GAME_ENDED_EARLY &&
      value !== GameEndTrigger.OTHER
    ) {
      props.game.end_trigger_note = "";
    }
  }
);

watch(
  () => props.game.end_trigger_type,
  (value) => {
    if (!shouldShowEndTriggerType.value) return;

    props.game.end_trigger_role_id = null;
    props.game.end_trigger_role = null;
    props.game.end_trigger_participant_id = null;
    props.game.end_trigger_cause = null;
    props.game.end_trigger_subtype = "";

    if (value === null) return;

    if (endTriggerCauseOptions.value.length === 1) {
      props.game.end_trigger_cause = endTriggerCauseOptions.value[0].value;
    }
  }
);

watch(
  () => endTriggerTypeOptions.value,
  (options) => {
    if (props.game.end_trigger === GameEndTrigger.ADDITIONAL_WIN_CONDITION) return;
    if (options.length !== 1) return;
    const [onlyOption] = options;
    if (props.game.end_trigger_type === onlyOption.value) return;
    props.game.end_trigger_type = onlyOption.value;
  },
  { immediate: true }
);

watch(
  () => endTriggerCauseOptions.value,
  (options) => {
    if (props.game.end_trigger === GameEndTrigger.ADDITIONAL_WIN_CONDITION) return;
    if (options.length !== 1) return;
    const [onlyOption] = options;
    if (props.game.end_trigger_cause === onlyOption.value) return;
    props.game.end_trigger_cause = onlyOption.value;
  },
  { immediate: true }
);

watch(
  () => props.game.end_trigger_cause,
  (value, oldValue) => {
    if (value === oldValue) return;
    props.game.end_trigger_role_id = null;
    props.game.end_trigger_role = null;
    props.game.end_trigger_participant_id = null;
    props.game.end_trigger_subtype = "";
  }
);

watch(
  () => [
    shouldShowEndTriggerSubtype.value,
    endTriggerSubtypeOptions.value.map((option) => option.value).join("|"),
    props.game.end_trigger_subtype,
  ],
  () => {
    if (!shouldShowEndTriggerSubtype.value) {
      props.game.end_trigger_subtype = "";
      return;
    }

    const subtype = parseEndTriggerSubtype(props.game.end_trigger_subtype);
    if (!subtype) return;

    const isValidSubtype = endTriggerSubtypeOptions.value.some(
      (option) => option.value === subtype
    );
    if (!isValidSubtype) props.game.end_trigger_subtype = "";
  },
  { immediate: true }
);

defineExpose({
  getRestrictRoleIds,
});
</script>
