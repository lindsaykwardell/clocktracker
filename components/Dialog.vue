<template>
  <dialog
    ref="dialog"
    class="bg-stone-900 shadow-xl border border-stone-700 rounded-lg text-white p-0 fixed"
    :class="{
      'w-11/12 md:w-1/3 lg:w-1/4 xl:w-[500px]': size === 'sm',
      'w-11/12 md:w-1/2 lg:w-1/2 xl:w-[750px]': size === 'md',
      'w-11/12 md:w-2/3 lg:w-3/4 xl:w-[900px]': size === 'lg',
      'w-11/12': size === 'xl',
    }"
  >
    <div ref="dialogContent" v-if="visible">
      <div
        class="flex justify-between items-top sticky top-0 bg-stone-900 z-20"
      >
        <div class="p-4 w-full">
          <slot name="title" />
        </div>
        <div class="flex-grow" />
        <div class="p-2">
          <Button
            type="button"
            @click="emit('update:visible', false)"
            title="Close dialog"
            color="neutral-on-dark"
            icon="x-lg"
            display="icon-only"
            circular
          >
            Close
          </Button>
        </div>
      </div>
      <slot />
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
const props = defineProps<{
  visible: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}>();

const emit = defineEmits(["update:visible"]);

const size = computed(() => props.size ?? "md");

const dialog = ref();
const dialogContent = ref();
const visible = computed(() => props.visible);
const close = () => emit("update:visible", false);

onClickOutside(dialogContent, close);

watch(visible, (val) => {
  if (val) {
    dialog.value.showModal();
  } else {
    dialog.value.close();
  }
});

onMounted(() => {
  dialog.value.addEventListener("close", close);
});
</script>
