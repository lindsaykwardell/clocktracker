<template>
  <div class="relative">
    <Menu>
      <MenuButton>
        <IconUI id="dots" :rounded="true" shadow />
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
          class="ct-contextual-links top-full"
        >
          <MenuItem v-for="option in options">
            <ButtonSubmenu
              @click="option.action"
            >
              {{ option.label }}
            </ButtonSubmenu>
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
