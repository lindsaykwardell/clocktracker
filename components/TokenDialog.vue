<template>
  <Dialog v-model:visible="show" size="lg">
    <template #title>
      <div class="flex flex-col md:flex-row w-full">
        <h2 class="flex-grow text-2xl font-bold font-dumbledor">
          Select a Role
        </h2>
        <input
          v-model="roleFilter"
          type="text"
          placeholder="Filter roles"
          class="p-2 mt-2 border border-gray-300 rounded-md text-black"
          aria-label="Filter roles"
        />
      </div>
    </template>
    <div v-if="show" class="flex flex-wrap justify-around gap-3 p-4">
      <button
        type="button"
        v-for="role in filteredRoles"
        class="flex flex-col items-center"
        @click="emit('selectRole', role)"
      >
        <Token :character="formatRoleAsCharacter(role)" size="md" />
        <span>{{ role.name }}</span>
      </button>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { Alignment, RoleType } from "@prisma/client";

const props = defineProps<{
  availableRoles: {
    type: RoleType;
    id: string;
    token_url: string;
    name: string;
    initial_alignment: Alignment;
  }[];
  visible: boolean;
}>();

const emit = defineEmits(["update:visible", "selectRole"]);

const travelerRoles = await $fetch("/api/roles/traveler");
const roleFilter = ref("");
const show = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

const filteredRoles = computed(() => {
  return [
    ...props.availableRoles.filter(
      (role) => role.type !== "FABLED" && role.type !== "TRAVELER"
    ),
    ...travelerRoles,
  ].filter((role) =>
    role.name.toLowerCase().includes(roleFilter.value.toLowerCase())
  );
});

function formatRoleAsCharacter(role: {
  type: RoleType;
  id: string;
  token_url: string;
  name: string;
  initial_alignment: Alignment;
}) {
  return {
    alignment: role.initial_alignment,
    role,
  };
}

watchEffect(() => {
  if (show.value) {
    roleFilter.value = "";
  }
});
</script>
