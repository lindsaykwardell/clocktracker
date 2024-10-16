<template>
  <ClientOnly>
    <div class="relative">
      <Combobox v-model="value">
        <ComboboxInput
          @focus="emit('inputFocused')"
          @change="value = $event.target.value"
          class="block w-full border bg-stone-200 dark:bg-stone-600 disabled:bg-stone-300 dark:disabled:bg-stone-700 border-stone-100 dark:border-stone-500 rounded-md p-2 h-[2.5rem] text-lg"
          :class="inputClass"
          :placeholder="placeholder"
          aria-autocomplete="none"
          autocomplete="off"
        />
        <ComboboxOptions
          class="absolute text-sm bg-stone-200 dark:bg-stone-900 border border-stone-300 dark:border-stone-500 max-h-[150px] min-w-[200px] w-full overflow-y-scroll overflow-x-hidden z-10"
        >
          <ComboboxOption
            class="cursor-pointer p-1 flex gap-2 overflow-ellipsis whitespace-nowrap"
            v-for="tz in timeZones.filter((tz) =>
              tz.timeZoneName.toLowerCase().includes(value ?? '')
            )"
            :value="tz.timeZone"
          >
            <div class="flex flex-col gap-1">
              <span>
                {{ tz.timeZoneName }}
              </span>
            </div>
          </ComboboxOption>
        </ComboboxOptions>
      </Combobox>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/vue";

const props = defineProps<{
  value: string | null | undefined;
  inputClass?: string;
  placeholder?: string;
}>();

const emit = defineEmits(["inputFocused", "update:value"]);

const { timeZones, getTimeZoneName } = useTimeZones();

const value = computed({
  get: () =>
    getTimeZoneName.value(props.value ?? "").timeZoneName ?? props.value,
  set: (newValue: string | null | undefined) => {
    emit("update:value", newValue);
  },
});
</script>

<style scoped>
[data-headlessui-state="active"] {
  @apply bg-stone-300 dark:bg-stone-700;
}
</style>
