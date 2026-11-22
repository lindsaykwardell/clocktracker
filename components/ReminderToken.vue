<template>
  <div class="relative">
    <Token
      :class="reminderTypeClass"
      :character="{ role: { token_url: reminder.token_url, type: '' } }"
      :size="size ?? 'reminder'"
      :reminderText="reminder.reminder"
      :fullSizeReminderText="fullSizeText"
    >
      <template v-if="$slots.image" #image>
        <slot name="image" />
      </template>
    </Token>
    <span
      v-if="isTrackingRelevant"
      class="pointer-events-none absolute -bottom-4 left-[50%] translate-x-[-50%]"
    >
      <IconUI id="crosshair" color="muted" />
      <div class="sr-only">Tracking Reminder</div>
    </span>
  </div>
</template>

<script setup lang="ts">
import { reminderDisplayType, type ReminderTypeName } from "~/utils/reminderType";

const props = defineProps<{
  reminder: {
    token_url: string;
    reminder: string;
    type?: ReminderTypeName | null;
    role_reminder?: { type: ReminderTypeName } | null;
    is_custom?: boolean | null;
  };
  size?: "sm-reminder" | "reminder";
  fullSizeText?: boolean;
  isTrackingRelevant?: boolean;
}>();

const reminderTypeClass = computed(
  () =>
    `reminder--${(reminderDisplayType(props.reminder) ?? "OFFICIAL").toLowerCase()}`
);

const isTrackingRelevant = computed(() => props.isTrackingRelevant ?? false);
</script>
