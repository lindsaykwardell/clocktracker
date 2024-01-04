<template>
  <Dialog v-model:visible="show" size="lg">
    <template #title>
      <div class="flex flex-col md:flex-row w-full gap-2">
        <h2 class="flex-grow text-2xl font-bold font-dumbledor">
          Select a Role
        </h2>
        <label v-if="!hideAllRolesToggle" class="flex items-center">
          <input v-model="showAllRoles" type="checkbox" class="mr-2" />
          <span>All Roles</span>
        </label>
        <label class="flex items-center">
          <input v-model="showFabled" type="checkbox" class="mr-2" />
          <span>Show Fabled</span>
        </label>
        <input
          v-model="roleFilter"
          type="text"
          placeholder="Filter roles"
          class="p-2 mt-2 border border-gray-300 rounded-md text-black"
          aria-label="Filter roles"
        />
      </div>
    </template>
    <div v-if="show">
      <div v-for="roleGroup in roleGroups">
        <template v-if="roleGroup.roles.length">
          <h3 class="mt-4 mb-2 mx-4 text-xl font-bold font-dumbledor">
            {{ roleGroup.name }}
          </h3>
          <div class="flex flex-wrap justify-around gap-3 p-4">
            <button
              type="button"
              v-for="role in roleGroup.roles"
              class="flex flex-col items-center"
              @click="emit('selectRole', role)"
            >
              <Token :character="formatRoleAsCharacter(role)" size="md" />
              <span>{{ role.name }}</span>
            </button>
          </div>
        </template>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { Alignment } from "@prisma/client";
import type { Role } from "@prisma/client";
import naturalOrder from "natural-order";
import { RoleType } from "~/composables/useRoles";

const roles = useRoles();

const props = defineProps<{
  availableRoles: {
    type: RoleType;
    id: string;
    token_url: string;
    name: string;
    initial_alignment: Alignment;
  }[];
  visible: boolean;
  alwaysShowAllRoles?: boolean;
}>();

const emit = defineEmits(["update:visible", "selectRole"]);

const showAllRoles = ref(props.alwaysShowAllRoles || false);
const hideAllRolesToggle = computed(
  () =>
    props.alwaysShowAllRoles ||
    props.availableRoles.length === roles.getAllRoles.length
);
const showFabled = ref(false);

const allRoles = computed(() => roles.getAllRoles);
const travelerRoles = computed(() => roles.getRoleByType(RoleType.TRAVELER));
const fabledRoles = computed(() => roles.getRoleByType(RoleType.FABLED));

const roleFilter = ref("");
const show = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

const filteredRoles = computed(() => {
  return naturalOrder(
    [
      ...(showAllRoles.value ? allRoles.value : props.availableRoles).filter(
        (role) => role.type !== "FABLED" && role.type !== "TRAVELER"
      ),
      ...travelerRoles.value,
      ...(showFabled.value ? fabledRoles.value : []),
    ].filter((role) =>
      role.name.toLowerCase().includes(roleFilter.value.toLowerCase())
    )
  )
    .orderBy("asc")
    .sort(["name"]);
});

const townsfolk = computed(() => {
  return filteredRoles.value.filter((role) => role.type === "TOWNSFOLK");
});

const outsiders = computed(() => {
  return filteredRoles.value.filter((role) => role.type === "OUTSIDER");
});

const minions = computed(() => {
  return filteredRoles.value.filter((role) => role.type === "MINION");
});

const demons = computed(() => {
  return filteredRoles.value.filter((role) => role.type === "DEMON");
});

const travelers = computed(() => {
  return filteredRoles.value.filter((role) => role.type === "TRAVELER");
});

const fabled = computed(() => {
  return filteredRoles.value.filter((role) => role.type === "FABLED");
});

const roleGroups = computed(() => {
  return [
    {
      name: "Townsfolk",
      roles: townsfolk.value,
    },
    {
      name: "Outsiders",
      roles: outsiders.value,
    },
    {
      name: "Minions",
      roles: minions.value,
    },
    {
      name: "Demons",
      roles: demons.value,
    },
    {
      name: "Travelers",
      roles: travelers.value,
    },
    {
      name: "Fabled",
      roles: fabled.value,
    },
  ];
});

function formatRoleAsCharacter(role: Role) {
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

onMounted(() => {
  roles.fetchRoles();
});
</script>
