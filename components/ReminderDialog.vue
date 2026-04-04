<template>
  <Dialog v-model:visible="show" slze="lg">
    <template #title>
      <div class="flex flex-col md:flex-row w-full gap-2">
        <h2 class="flex-grow text-2xl font-bold font-sorts">
          Select a Reminder
        </h2>
      </div>
    </template>
    <template v-if="show">
      <div class="flex flex-col gap-4 p-4">
        <div class="text-sm text-stone-300 space-y-2">
          <p>ClockTracker keeps track of certain events in the game (deaths, character changes, ...).
          Certain reminder tokens can prefill these events; they are marked with
          <IconUI id="crosshair" /> in the list below.</p>
          <p>Additional reminders were also added to support this functionality; you can recognize them by their slightly brighter purple background.</p>
        </div>
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
              class="flex flex-col items-center"
              @click="emit('selectReminder', reminder)"
            >
              <ReminderToken
                :reminder="reminder"
                :isTrackingRelevant="isTrackingRelevantReminder(reminder)"
              />
            </button>
          </div>
        </div>
      </div>
      <form
        class="flex flex-col gap-2 p-4"
        @submit.prevent="
          $emit('selectReminder', {
            reminder: customReminder,
            token_url: tokenUrl,
            type: 'CUSTOM',
          })
        "
      >
        <label for="custom-reminder" class="text-lg font-bold">
          Custom Reminder
        </label>
        <div class="flex items-center gap-4">
          <Popover class="relative" v-slot="{ close }">
            <PopoverButton>
              <Token
                :character="{ role: { token_url: tokenUrl as string, type: '' } }"
                size="reminder"
                :reminderText="customReminder"
              />
            </PopoverButton>

            <PopoverPanel
              class="absolute z-10 bottom-0 max-h-[225px] w-[475px] overflow-y-scroll bg-stone-950 flex flex-row flex-wrap p-3"
            >
              <div>
                <button type="button" @click="setTokenUrlAndClose('', close)">
                  <Token
                    :character="{ role: { token_url: '', type: '' } }"
                    size="reminder"
                  />
                </button>
              </div>
              <div v-for="url in availableTokenUrls" :key="url">
                <button type="button" @click="setTokenUrlAndClose(url, close)">
                  <Token
                    :character="{ role: { token_url: url, type: '' } }"
                    size="reminder"
                  />
                </button>
              </div>
            </PopoverPanel>
          </Popover>
          <!-- @todo fix text color -->
          <Input type="text" v-model="customReminder" />
          <Button
            type="submit"
            :disabled="customReminder.length === 0"
            @click="
              $emit('selectReminder', {
                reminder: customReminder,
                token_url: tokenUrl,
                type: 'CUSTOM',
              })
            "
          >
            Add Custom Reminder
          </Button>
        </div>
      </form>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import type { RoleReminder } from "~/server/generated/prisma/client";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/vue";
import { RoleType, useRoles } from "~/composables/useRoles";
import { GRIMOIRE_REMINDER_EVENT_CONFIG } from "~/composables/grimoireReminderEventConfig";

const props = defineProps<{
  visible: boolean;
  reminders: (RoleReminder & { token_url: string })[];
}>();

const emit = defineEmits(["update:visible", "selectReminder"]);
const customReminder = ref("");
const tokenUrl = ref<string | undefined>(undefined);
const roles = useRoles();

function setTokenUrlAndClose(url: string, close: () => void) {
  tokenUrl.value = url;
  close();
}

const availableTokenUrls = computed(() => {
  return [...new Set(props.reminders.map((reminder) => reminder.token_url))];
});

function normalizeReminderName(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

const DEFAULT_TRACKING_REMINDERS = new Set(["dead", "executed", "alive"]);

function reminderMatchesTrackingConfig(
  reminder: RoleReminder & { token_url: string }
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
  reminder: RoleReminder & { token_url: string }
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
      reminders: [] as (RoleReminder & { token_url: string })[],
    },
    {
      key: RoleType.OUTSIDER,
      label: "Outsiders",
      reminders: [] as (RoleReminder & { token_url: string })[],
    },
    {
      key: RoleType.MINION,
      label: "Minions",
      reminders: [] as (RoleReminder & { token_url: string })[],
    },
    {
      key: RoleType.DEMON,
      label: "Demons",
      reminders: [] as (RoleReminder & { token_url: string })[],
    },
    {
      key: RoleType.TRAVELER,
      label: "Travelers",
      reminders: [] as (RoleReminder & { token_url: string })[],
    },
    {
      key: RoleType.FABLED,
      label: "Fabled",
      reminders: [] as (RoleReminder & { token_url: string })[],
    },
    {
      key: RoleType.LORIC,
      label: "Loric",
      reminders: [] as (RoleReminder & { token_url: string })[],
    },
    {
      key: "OTHER",
      label: "Other",
      reminders: [] as (RoleReminder & { token_url: string })[],
    },
  ];

  const byType = new Map(groups.map((group) => [group.key, group]));

  for (const reminder of props.reminders) {
    const role = roles.getRole(reminder.role_id);
    const roleType = role?.type;
    const targetGroup = byType.get(roleType ?? "OTHER") ?? byType.get("OTHER");
    if (!targetGroup) continue;
    targetGroup.reminders.push(reminder);
  }

  return groups.filter((group) => group.reminders.length > 0);
});

const show = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

watchEffect(() => {
  if (show.value) {
    customReminder.value = "";
  }
});
</script>
