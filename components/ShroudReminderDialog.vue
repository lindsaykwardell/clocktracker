<template>
  <Dialog v-model:visible="show" size="sm">
    <template #title>
      <h2 class="text-2xl font-bold font-sorts">{{ title }}</h2>
    </template>
    <div v-if="show" class="flex flex-col gap-4 p-4">
      <p class="text-sm text-stone-300">
        {{
          mode === "death"
            ? "Add the reminder that explains this death, or skip."
            : "Add the reminder that explains this return, or skip."
        }}
      </p>
      <div class="flex flex-wrap justify-center gap-x-2 gap-y-4">
        <button
          v-if="mode === 'death'"
          type="button"
          class="flex flex-col items-center"
          title="A normal execution, not caused by an ability"
          @click="emit('executed')"
        >
          <ReminderToken
            :reminder="{ reminder: 'Executed', token_url: '', type: 'CUSTOM' }"
          >
            <template #image>
              <svg
                class="w-3/5 h-3/5 text-stone-200"
                viewBox="0 0 512 512"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M416 427.4c58.5-44 96-111.6 96-187.4 0-132.5-114.6-240-256-240S0 107.5 0 240c0 75.8 37.5 143.4 96 187.4L96 464c0 26.5 21.5 48 48 48l32 0 0-40c0-13.3 10.7-24 24-24s24 10.7 24 24l0 40 64 0 0-40c0-13.3 10.7-24 24-24s24 10.7 24 24l0 40 32 0c26.5 0 48-21.5 48-48l0-36.6zM96 256a64 64 0 1 1 128 0 64 64 0 1 1 -128 0zm256-64a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"
                />
              </svg>
            </template>
          </ReminderToken>
        </button>
        <button
          v-for="reminder in suggestions"
          :key="reminder.id"
          type="button"
          class="flex flex-col items-center"
          :title="roleName(reminder.role_id)"
          @click="emit('selectReminder', reminder)"
        >
          <ReminderToken
            :reminder="reminder"
            :isTrackingRelevant="showTrackingReminders"
          />
        </button>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          size="sm"
          @click="emit('otherReminders')"
        >
          Other reminders
        </Button>
        <Button type="button" size="sm" @click="show = false">Skip</Button>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import type { RoleReminder } from "~/server/generated/prisma/client";
import { SHOW_TRACKING_REMINDERS_KEY } from "~/composables/reminderDialogTracking";

// Shown when a shroud is placed or removed by hand, like the official app:
// suggests the reminders that could explain the death (or the return) from
// the characters in play.
const props = defineProps<{
  visible: boolean;
  mode: "death" | "revive";
  playerName: string;
  suggestions: (RoleReminder & { token_url: string })[];
}>();

const emit = defineEmits([
  "update:visible",
  "selectReminder",
  "executed",
  "otherReminders",
]);

const roles = useRoles();
const showTrackingReminders = inject(
  SHOW_TRACKING_REMINDERS_KEY,
  () => ref(true),
  true
);

const show = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

const title = computed(() => {
  const name = props.playerName.trim() || "this player";
  return props.mode === "death" ? `Why did ${name} die?` : `How did ${name} come back?`;
});

function roleName(roleId: string) {
  return roles.getRole(roleId)?.name ?? roleId;
}
</script>
