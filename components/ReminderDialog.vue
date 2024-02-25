<template>
  <Dialog v-model:visible="show" slze="lg">
    <template #title>
      <div class="flex flex-col md:flex-row w-full gap-2">
        <h2 class="flex-grow text-2xl font-bold font-dumbledor">
          Select a Reminder
        </h2>
      </div>
    </template>
    <template v-if="show">
      <div class="flex flex-wrap justify-around gap-3 p-4">
        <button
          v-for="reminder in reminders"
          :key="reminder.id"
          type="button"
          class="flex flex-col items-center"
          @click="emit('selectReminder', reminder)"
        >
          <ReminderToken :reminder="reminder" />
        </button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import type { RoleReminder } from "@prisma/client";

const props = defineProps<{
  visible: boolean;
  reminders: (RoleReminder & { token_url: string })[];
}>();

const emit = defineEmits(["update:visible", "selectReminder"]);

const show = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});
</script>
