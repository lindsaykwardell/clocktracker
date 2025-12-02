<template>
  <span
    :class="[
      'inline-flex items-center justify-center',
      props.size,
      props.rounded &&
        'rounded-full bg-white text-black dark:bg-black dark:text-white hover:bg-purple-600 transition-colors duration-200 ease-in-out z-10'
    ]"
  >
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="16" 
      height="16" 
      fill="currentColor" 
      viewBox="0 0 16 16"
      aria-hidden="true"
      class="ui-icon"
      :class="[
        props.class,
        props.size
      ]"
    >
      <!-- Edit -->
      <template v-if="props.id === 'edit'">
        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
      </template>

      <!-- X icon (close/delete) -->
      <template v-else-if="props.id === 'x'">
        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
      </template>

      <!-- X icon large (close/delete) -->
      <template v-else-if="props.id === 'x-lg'">
        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
      </template>

      <!-- FALLBACK (optional) -->
      <template v-else>
        <circle cx="12" cy="12" r="10" />
      </template>
    </svg>
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  id: string;
  class?: string;
  rounded?: boolean;
  size?: 'sm' | 'md' | 'lg';
}>();
</script>

<style scoped>
span {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  block-size: 2rem;
  inline-size: 2rem;

  &.sm {
    block-size: 1.5rem;
    inline-size: 1.5rem;
  }
}

svg {
  inline-size: auto;
  block-size: 1.125rem;

  &.sm {
    block-size: .875rem;
  }
}
</style>
