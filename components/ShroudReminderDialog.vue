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
          />
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
          <span class="mt-1 text-xs text-stone-400">
            {{ roleName(reminder.role_id) }}
          </span>
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
