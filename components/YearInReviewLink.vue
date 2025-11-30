<template>
  <NavLink
    v-if="isDecemberOrJanuary"
    id="year-in-review"
    to="/year-in-review"
    icon="fanggu"
    class="bg-purple-400 dark:bg-primary-darkest hover:bg-purple-300 dark:hover:bg-primary-dark rounded-full transition duration-200 text-lg relative"
  >
    <div
      class="absolute left-0 top-0 w-full h-full flex justify-center items-center"
    >
      Year in Review
    </div>
  </NavLink>
</template>

<script setup lang="ts">
import dayjs from "dayjs";

const isDecemberOrJanuary = computed(() => dayjs().month() === 0 || dayjs().month() === 11);
</script>
