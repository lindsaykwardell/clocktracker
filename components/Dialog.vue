<template>
  <dialog
    ref="dialog"
    class="bg-stone-900 shadow-xl border border-stone-700 rounded-lg text-white p-0 relative"
    :class="{
      'w-11/12 md:w-1/3 lg:w-1/4 xl:w-[500px]': size === 'sm',
      'w-11/12 md:w-1/2 lg:w-1/2 xl:w-[750px]': size === 'md',
      'w-11/12 md:w-2/3 lg:w-3/4 xl:w-[900px]': size === 'lg',
    }"
  >
    <template v-if="visible">
      <div class="flex justify-between items-center sticky top-0 bg-stone-900 z-10">
        <div class="p-4 w-full">
          <slot name="title" />
        </div>
        <div class="flex-grow" />
        <button
          type="button"
          class="p-4 hover:bg-stone-800"
          @click="emit('update:visible', false)"
        >
          Ⅹ
        </button>
      </div>
      <slot />
    </template>
  </dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean;
  size?: "sm" | "md" | "lg";
}>();

const emit = defineEmits(["update:visible"]);

const size = computed(() => props.size ?? "md");

const dialog = ref();
const visible = computed(() => props.visible);
const close = () => emit("update:visible", false);

watch(visible, (val) => {
  if (val) {
    // do something
    dialog.value.showModal();
  } else {
    dialog.value.close();
  }
});

onMounted(() => {
  dialog.value.addEventListener("close", close);
});
</script>
