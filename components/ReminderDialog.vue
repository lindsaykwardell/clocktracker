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
      <form
        class="flex flex-col gap-2 p-4"
        @submit.prevent="
          $emit('selectReminder', {
            reminder: customReminder,
            token_url: tokenUrl,
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
import type { RoleReminder } from "@prisma/client";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/vue";

const props = defineProps<{
  visible: boolean;
  reminders: (RoleReminder & { token_url: string })[];
}>();

const emit = defineEmits(["update:visible", "selectReminder"]);
const customReminder = ref("");
const tokenUrl = ref<string | undefined>(undefined);

function setTokenUrlAndClose(url: string, close: () => void) {
  tokenUrl.value = url;
  close();
}

const availableTokenUrls = computed(() => {
  return [...new Set(props.reminders.map((reminder) => reminder.token_url))];
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
