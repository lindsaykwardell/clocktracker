<template>
  <Dialog v-model:visible="show" size="lg">
    <template #title>
      <!-- md:-mt-2: the dialog's close button sits higher (p-2) than the
           title (p-4); this centres the title row on it. -->
      <div class="flex flex-col md:flex-row md:items-center md:-mt-2 w-full gap-2">
        <h2 class="flex-grow text-2xl font-bold font-sorts">
          Select a Reminder
        </h2>
        <form @submit.prevent="selectFirstMatchingReminder">
          <input
            v-model="reminderFilter"
            ref="reminderFilterRef"
            type="search"
            placeholder="Filter reminders"
            class="w-full md:w-56 h-[2.5rem] p-2 rounded-md border border-stone-500 bg-stone-600 text-lg text-white placeholder:text-stone-300"
            aria-label="Filter reminders by character or reminder"
          />
        </form>
      </div>
      <div class="flex flex-col gap-1 pt-2">
        <div class="flex flex-wrap gap-x-6 gap-y-1">
          <label v-if="inPlayRoleIds && hasScript" class="inline-flex items-center gap-2">
            <input v-model="inPlayOnly" type="checkbox" />
            <span class="text-sm">In play only</span>
          </label>
          <label class="inline-flex items-center gap-2">
            <input v-model="showFabledLoric" type="checkbox" />
            <span class="text-sm">Show Fabled and Loric</span>
          </label>
          <label class="inline-flex items-center gap-2">
            <input v-model="showLegacyReminders" type="checkbox" />
            <span class="text-sm">Show legacy reminders</span>
          </label>
        </div>
        <p
          v-if="showTrackingReminders"
          class="flex items-center gap-1 text-xs text-stone-400"
        >
          <IconUI id="crosshair" color="muted" size="sm" />
          Records a game event. Hover, hold or tab to one to see how it's used.
        </p>
      </div>
    </template>
    <template v-if="show">
      <div class="flex flex-col gap-4 p-4">
        <p
          v-if="reminderFilter.trim() && reminderGroups.length === 0"
          class="text-center text-stone-400"
        >
          No reminders match "{{ reminderFilter.trim() }}"<template
            v-if="hiddenByOptions"
          >
            with these options</template>.
          <button
            type="button"
            class="block mx-auto mt-2 underline underline-offset-2 text-stone-200 hover:text-white"
            @click="startCustomReminder(reminderFilter.trim())"
          >
            Add "{{ reminderFilter.trim() }}" as a custom reminder
          </button>
        </p>
        <p
          v-else-if="reminderGroups.length === 0"
          class="text-center text-stone-400"
        >
          No reminders for the characters in play. Turn off "In play only" to
          see the others.
        </p>
        <div
          v-for="group in reminderGroups"
          :key="group.key"
        >
          <div class="mb-2">
            <h3 class="text-lg font-bold font-sorts text-center">
              {{ group.label }}
            </h3>
            <p v-if="group.description" class="text-xs text-center text-stone-500">{{ group.description }}</p>
          </div>
          
          <hr class="border-stone-700">
          <div class="flex flex-wrap justify-center gap-x-2 gap-y-4 py-4 px-2">
            <button
              v-for="reminder in group.reminders"
              :key="reminder.id"
              type="button"
              class="flex flex-col items-center select-none [-webkit-touch-callout:none]"
              :aria-label="reminderLabel(reminder)"
              :aria-describedby="
                activeHint?.reminderId === reminder.id ? hintElementId : undefined
              "
              @click="onReminderClick(reminder)"
              @focus="onReminderFocus($event, reminder)"
              @blur="onReminderBlur"
              @pointerdown="onReminderPointerDown($event, reminder)"
              @pointermove="onReminderPointerMove"
              @pointerup="cancelHintTimer"
              @pointercancel="cancelHintTimer"
              @pointerenter="onReminderPointerEnter($event, reminder)"
              @pointerleave="onReminderPointerLeave"
              @contextmenu="onReminderContextMenu($event, reminder)"
            >
              <ReminderToken
                :reminder="reminder"
                :isTrackingRelevant="
                  showTrackingReminders && isTrackingRelevantReminder(reminder)
                "
              />
            </button>
          </div>
        </div>
      </div>
      <div
        v-if="activeHint"
        :id="hintElementId"
        ref="hintElement"
        role="tooltip"
        class="fixed z-30 w-72 max-w-[calc(100vw-1rem)] rounded-md border border-stone-600 bg-stone-950 p-3 text-sm text-stone-200 shadow-xl"
        :style="hintPosition"
      >
        <p class="font-bold font-sorts text-base text-white">
          {{ activeHint.title }}
        </p>
        <p class="mt-1">{{ activeHint.text }}</p>
        <p class="mt-2 text-xs text-stone-400">
          Counted on the page where you add it. Leaving it on later pages adds nothing.
        </p>
      </div>
      <div v-if="!customOpen" class="px-4 pb-4">
        <Button
          type="button"
          size="sm"
          color="primary"
          icon="plus-lg"
          @click="startCustomReminder()"
        >
          Custom reminder
        </Button>
      </div>
      <form
        v-else
        class="flex flex-col gap-2 p-4"
        @submit.prevent="submitCustomReminder"
      >
        <label for="custom-reminder" class="text-lg font-bold">
          Custom Reminder
        </label>
        <div class="flex flex-wrap items-center gap-4">
          <Popover class="relative" v-slot="{ close }">
            <PopoverButton aria-label="Choose an icon">
              <Token
                :character="{ role: { token_url: tokenUrl as string, type: '' } }"
                size="reminder"
                :reminderText="customReminder"
              />
            </PopoverButton>

            <PopoverPanel
              class="absolute z-10 bottom-0 max-h-[225px] w-[min(475px,calc(100vw-3rem))] overflow-y-auto bg-stone-950 flex flex-row flex-wrap p-3"
            >
              <div>
                <button
                  type="button"
                  aria-label="No icon"
                  @click="setTokenUrlAndClose('', close)"
                >
                  <Token
                    :character="{ role: { token_url: '', type: '' } }"
                    size="reminder"
                  />
                </button>
              </div>
              <div v-for="(url, index) in availableTokenUrls" :key="url">
                <button
                  type="button"
                  :aria-label="`Icon ${index + 1}`"
                  @click="setTokenUrlAndClose(url, close)"
                >
                  <Token
                    :character="{ role: { token_url: url, type: '' } }"
                    size="reminder"
                  />
                </button>
              </div>
            </PopoverPanel>
          </Popover>
          <input
            id="custom-reminder"
            ref="customReminderRef"
            v-model="customReminder"
            type="text"
            required
            class="flex-1 min-w-40 h-[2.5rem] p-2 rounded-md border border-stone-500 bg-stone-600 text-lg text-white placeholder:text-stone-300"
          />
          <!-- The form's submit is the only place that adds it: a click
               handler here as well placed the reminder twice. Not disabled
               while empty (a disabled button is unreadable on this dark
               dialog); "required" makes the browser ask for the text. -->
          <div class="flex items-center gap-2">
            <Button type="submit" color="primary">Add Custom Reminder</Button>
            <button
              type="button"
              class="px-2 py-1 text-sm text-stone-300 underline-offset-2 hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-400 rounded"
              @click="cancelCustomReminder"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core";
import type { RoleReminder } from "~/server/generated/prisma/client";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/vue";
import { RoleType, useRoles } from "~/composables/useRoles";
import { GRIMOIRE_REMINDER_EVENT_CONFIG } from "~/composables/grimoireReminderEventConfig";
import { getReminderHint } from "~/composables/grimoireReminderHints";
import { SHOW_TRACKING_REMINDERS_KEY } from "~/composables/reminderDialogTracking";

const props = defineProps<{
  visible: boolean;
  reminders: (RoleReminder & { token_url: string; role_type?: RoleType | null })[];
  /**
   * The characters in play (on the grimoire page, incl. small tokens and the
   * game's Fabled and Loric). Without it, every character counts as in play.
   */
  inPlayRoleIds?: string[];
  /**
   * The game has a script. Without one, the dialog lists the grimoire's
   * characters plus every Traveller (as before), so "In play only" is hidden.
   */
  hasScript?: boolean;
}>();

const emit = defineEmits(["update:visible", "selectReminder"]);
const customReminder = ref("");
const tokenUrl = ref<string | undefined>(undefined);
const showLegacyReminders = ref(false);
const customOpen = ref(false);
const customReminderRef = ref<HTMLInputElement | null>(null);
// Remembered per browser. By default the dialog only lists the reminders of
// the characters in play ("In play only", with a script); Fabled and Loric
// that aren't in play stay hidden too, like in the role dialog.
const inPlayOnly = useLocalStorage("reminderDialogInPlayOnly", true);
const showFabledLoric = useLocalStorage("reminderDialogShowFabledLoric", false);
const inPlay = computed(() =>
  props.inPlayRoleIds ? new Set(props.inPlayRoleIds) : null
);
// Matches the role's name or the text on the reminder, so "imp" finds the
// Imp's reminders and "dead" finds every "Dead" reminder.
const reminderFilter = ref("");
const reminderFilterRef = ref<HTMLInputElement | null>(null);
// The extra reminders ClockTracker added for event tracking (not on the
// physical tokens). Turning them off leaves the official ones. The game editor
// shares one choice across the game's dialogs; elsewhere each dialog has its own.
const showTrackingReminders = inject(
  SHOW_TRACKING_REMINDERS_KEY,
  () => ref(true),
  true
);
const roles = useRoles();

function setTokenUrlAndClose(url: string, close: () => void) {
  tokenUrl.value = url;
  close();
}

const availableTokenUrls = computed(() => {
  return [...new Set(props.reminders.map((reminder) => reminder.token_url))];
});

function normalizeReminderName(value?: string | null) {
  const normalized = (value ?? "").trim().toLowerCase();
  // The Courtier's countdown ("Drunk 3", "Drunk 2", ...) counts as "Drunk",
  // the same as in the editor's event sync.
  if (/^drunk\s+\d+$/.test(normalized)) return "drunk";
  return normalized;
}

function isLegacyReminder(reminder: { type?: string | null }) {
  return (reminder.type ?? "").toUpperCase() === "LEGACY";
}

const DEFAULT_TRACKING_REMINDERS = new Set(["dead", "executed", "alive"]);

function reminderMatchesTrackingConfig(
  reminder: RoleReminder & { token_url: string; role_type?: RoleType | null }
) {
  const reminderName = normalizeReminderName(reminder.reminder);
  const roleId = (reminder.role_id ?? "").toLowerCase();
  if (!reminderName || !roleId) return false;

  return GRIMOIRE_REMINDER_EVENT_CONFIG.some(
    (config) =>
      normalizeReminderName(config.reminder) === reminderName &&
      config.sourceRoleIds.some((sourceRoleId) => sourceRoleId === roleId)
  );
}

function isTrackingRelevantReminder(
  reminder: RoleReminder & { token_url: string; role_type?: RoleType | null }
) {
  const normalizedReminder = normalizeReminderName(reminder.reminder);
  return (
    reminder.type === "TRACKING" ||
    DEFAULT_TRACKING_REMINDERS.has(normalizedReminder) ||
    reminderMatchesTrackingConfig(reminder)
  );
}

const reminderGroups = computed(() => {
  const groups = [
    {
      key: RoleType.TOWNSFOLK,
      label: "Townsfolk",
      reminders: [] as (RoleReminder & { token_url: string; role_type?: RoleType | null })[],
    },
    {
      key: RoleType.OUTSIDER,
      label: "Outsiders",
      reminders: [] as (RoleReminder & { token_url: string; role_type?: RoleType | null })[],
    },
    {
      key: RoleType.MINION,
      label: "Minions",
      reminders: [] as (RoleReminder & { token_url: string; role_type?: RoleType | null })[],
    },
    {
      key: RoleType.DEMON,
      label: "Demons",
      reminders: [] as (RoleReminder & { token_url: string; role_type?: RoleType | null })[],
    },
    {
      key: RoleType.TRAVELER,
      label: "Travelers",
      reminders: [] as (RoleReminder & { token_url: string; role_type?: RoleType | null })[],
    },
    {
      key: RoleType.FABLED,
      label: "Fabled",
      reminders: [] as (RoleReminder & { token_url: string; role_type?: RoleType | null })[],
    },
    {
      key: RoleType.LORIC,
      label: "Loric",
      reminders: [] as (RoleReminder & { token_url: string; role_type?: RoleType | null })[],
    },
    {
      key: "OTHER",
      label: "Other",
      reminders: [] as (RoleReminder & { token_url: string; role_type?: RoleType | null })[],
    },
  ];

  const byType = new Map(groups.map((group) => [group.key, group]));
  const filter = reminderFilter.value.trim().toLowerCase();

  for (const reminder of props.reminders) {
    if (!showLegacyReminders.value && isLegacyReminder(reminder)) continue;
    if (!showTrackingReminders.value && reminder.type === "TRACKING") continue;

    const role = roles.getRole(reminder.role_id);
    if (
      filter &&
      !reminder.reminder.toLowerCase().includes(filter) &&
      !(role?.name ?? reminder.role_id).toLowerCase().includes(filter)
    ) {
      continue;
    }
    const roleType = reminder.role_type ?? role?.type;
    const isInPlay = !inPlay.value || !reminder.role_id || inPlay.value.has(reminder.role_id);
    if (!isInPlay) {
      const fabledOrLoric = roleType === RoleType.FABLED || roleType === RoleType.LORIC;
      if (fabledOrLoric ? !showFabledLoric.value : props.hasScript && inPlayOnly.value) continue;
    }
    const targetGroup = byType.get(roleType ?? "OTHER") ?? byType.get("OTHER");
    if (!targetGroup) continue;
    targetGroup.reminders.push(reminder);
  }

  return groups.filter((group) => group.reminders.length > 0);
});

// Whether the filter text matches reminders that the options above hide, so
// the empty state can say so.
const hiddenByOptions = computed(() => {
  const filter = reminderFilter.value.trim().toLowerCase();
  if (!filter) return false;
  return props.reminders.some((reminder) => {
    const roleName = roles.getRole(reminder.role_id)?.name ?? reminder.role_id;
    return (
      reminder.reminder.toLowerCase().includes(filter) ||
      roleName.toLowerCase().includes(filter)
    );
  });
});

const show = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

watchEffect(() => {
  if (show.value) {
    customReminder.value = "";
    tokenUrl.value = undefined;
    customOpen.value = false;
    showLegacyReminders.value = false;
    reminderFilter.value = "";
  }
});

async function startCustomReminder(text = "") {
  if (text) customReminder.value = text;
  customOpen.value = true;
  await nextTick();
  customReminderRef.value?.focus();
}

function cancelCustomReminder() {
  customOpen.value = false;
  customReminder.value = "";
  tokenUrl.value = undefined;
}

function submitCustomReminder() {
  const reminder = customReminder.value.trim();
  if (!reminder) return;
  emit("selectReminder", {
    reminder,
    token_url: tokenUrl.value,
    type: "CUSTOM",
  });
}

watch(show, async (visible) => {
  // Only with a mouse: on a phone, focusing would open the keyboard over the
  // reminders.
  if (!visible || !window.matchMedia("(pointer: fine)").matches) return;
  await nextTick();
  reminderFilterRef.value?.focus();
});

// What a screen reader announces: whose reminder it is, and that it records
// an event (the crosshair).
function reminderLabel(reminder: DialogReminder) {
  const roleName = roles.getRole(reminder.role_id)?.name;
  const label = roleName ? `${roleName}: ${reminder.reminder}` : reminder.reminder;
  return showTrackingReminders.value && isTrackingRelevantReminder(reminder)
    ? `${label} (records a game event)`
    : label;
}

function selectFirstMatchingReminder() {
  // Enter places the first reminder shown, like the role dialog.
  const first = reminderGroups.value[0]?.reminders[0];
  if (first) onReminderClick(first);
}

// Hint popup: touch and hold a reminder (about half a second), or hover it
// with a mouse, to see how it's used.
type DialogReminder = RoleReminder & { token_url: string; role_type?: RoleType | null };

const HOLD_DELAY_MS = 450;
const HOVER_DELAY_MS = 350;
const HOLD_MOVE_TOLERANCE_PX = 10;

const hintElementId = useId();
const hintElement = ref<HTMLElement | null>(null);
const activeHint = ref<{
  reminderId: number;
  title: string;
  text: string;
  anchor: DOMRect;
} | null>(null);
const hintPosition = ref<Record<string, string>>({});
let hintTimer: ReturnType<typeof setTimeout> | null = null;
let holdStart: { x: number; y: number } | null = null;
let suppressNextClick = false;

function hintForReminder(reminder: DialogReminder) {
  // With tracking reminders hidden, the dialog shows no tracking at all.
  if (!showTrackingReminders.value) return null;
  return getReminderHint(reminder.role_id, reminder.reminder);
}

function cancelHintTimer() {
  if (hintTimer) clearTimeout(hintTimer);
  hintTimer = null;
  holdStart = null;
}

function closeHint() {
  cancelHintTimer();
  activeHint.value = null;
}

function openHint(reminder: DialogReminder, anchorElement: HTMLElement) {
  const text = hintForReminder(reminder);
  if (!text) return false;
  const roleName = roles.getRole(reminder.role_id)?.name;
  activeHint.value = {
    reminderId: reminder.id,
    title: roleName ? `${roleName}: ${reminder.reminder}` : reminder.reminder,
    text,
    anchor: anchorElement.getBoundingClientRect(),
  };
  return true;
}

function scheduleHint(
  reminder: DialogReminder,
  anchorElement: HTMLElement,
  delay: number,
  afterOpen?: () => void
) {
  cancelHintTimer();
  if (!hintForReminder(reminder)) return;
  hintTimer = setTimeout(() => {
    hintTimer = null;
    if (openHint(reminder, anchorElement)) afterOpen?.();
  }, delay);
}

function onReminderPointerDown(event: PointerEvent, reminder: DialogReminder) {
  if (event.pointerType === "mouse") return;
  suppressNextClick = false;
  if (activeHint.value && activeHint.value.reminderId !== reminder.id) {
    closeHint();
  }
  const anchorElement = event.currentTarget as HTMLElement;
  scheduleHint(reminder, anchorElement, HOLD_DELAY_MS, () => {
    // Letting go after a hold shouldn't also place the reminder.
    suppressNextClick = true;
  });
  holdStart = { x: event.clientX, y: event.clientY };
}

function onReminderPointerMove(event: PointerEvent) {
  if (event.pointerType === "mouse" || !holdStart) return;
  const moved = Math.hypot(event.clientX - holdStart.x, event.clientY - holdStart.y);
  // Moving the finger means scrolling, not holding.
  if (moved > HOLD_MOVE_TOLERANCE_PX) cancelHintTimer();
}

function onReminderPointerEnter(event: PointerEvent, reminder: DialogReminder) {
  if (event.pointerType !== "mouse") return;
  scheduleHint(reminder, event.currentTarget as HTMLElement, HOVER_DELAY_MS);
}

function onReminderPointerLeave(event: PointerEvent) {
  if (event.pointerType !== "mouse") return;
  closeHint();
}

// Keyboard users get the hint when they tab to a reminder; a mouse click or a
// tap focuses too, but those have their own hover and hold.
function onReminderFocus(event: FocusEvent, reminder: DialogReminder) {
  const element = event.currentTarget as HTMLElement;
  if (!element.matches(":focus-visible")) return;
  openHint(reminder, element);
}

function onReminderBlur() {
  if (activeHint.value) closeHint();
}

function onReminderContextMenu(event: MouseEvent, reminder: DialogReminder) {
  // A long press would otherwise open the browser's context menu (Android).
  if (hintForReminder(reminder)) event.preventDefault();
}

function onReminderClick(reminder: DialogReminder) {
  if (suppressNextClick) {
    suppressNextClick = false;
    return;
  }
  closeHint();
  emit("selectReminder", reminder);
}

function positionHint() {
  const hint = activeHint.value;
  const element = hintElement.value;
  if (!hint || !element) return;
  const margin = 8;
  const { anchor } = hint;
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  const left = Math.min(
    Math.max(anchor.left + anchor.width / 2 - width / 2, margin),
    window.innerWidth - width - margin
  );
  const fitsAbove = anchor.top - height - margin >= margin;
  const top = fitsAbove ? anchor.top - height - margin : anchor.bottom + margin;
  hintPosition.value = { left: `${left}px`, top: `${top}px` };
}

watch(activeHint, async (hint) => {
  if (!hint) return;
  hintPosition.value = { left: "-9999px", top: "0px" };
  await nextTick();
  positionHint();
});

function onDocumentPointerDown(event: PointerEvent) {
  if (!activeHint.value) return;
  const target = event.target as Node | null;
  if (target && hintElement.value?.contains(target)) return;
  closeHint();
}

function onDocumentScroll() {
  if (activeHint.value) closeHint();
}

watch(show, (visible) => {
  if (!visible) closeHint();
});

onMounted(() => {
  document.addEventListener("pointerdown", onDocumentPointerDown, true);
  document.addEventListener("scroll", onDocumentScroll, true);
});

onBeforeUnmount(() => {
  cancelHintTimer();
  document.removeEventListener("pointerdown", onDocumentPointerDown, true);
  document.removeEventListener("scroll", onDocumentScroll, true);
});
</script>
