<template>
  <div class="relative">
    <Menu>
      <MenuButton>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 32 32"
        >
          <path
            fill="currentColor"
            d="M4 6h24v2H4zm0 18h24v2H4zm0-12h24v2H4zm0 6h24v2H4z"
          />
        </svg>
      </MenuButton>
      <transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-out"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <MenuItems
          class="absolute bottom-[100%] z-10 bg-stone-50 dark:bg-stone-950 p-2 rounded shadow-md whitespace-nowrap flex flex-col items-start"
        >
          <MenuItem v-for="option in options">
            <button
              @click="option.action"
              class="hover:text-stone-500 dark:hover:text-stone-300 w-full text-left"
            >
              {{ option.label }}
            </button>
          </MenuItem>
        </MenuItems>
      </transition>
    </Menu>
  </div>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";

const props = defineProps<{
  options: { label: string; action: () => void }[];
}>();
</script>
