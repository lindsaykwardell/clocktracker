<template>
  <Dialog v-model:visible="show" size="lg">
    <template #title>
      <div class="flex flex-col md:flex-row w-full gap-2">
        <h2 class="flex-grow text-2xl font-bold font-sorts">Select a Role</h2>
        <label v-if="!hideAllRolesToggle" class="flex items-center">
          <input v-model="showAllRoles" type="checkbox" class="mr-2" />
          <span>All Roles</span>
        </label>
        <label v-if="!alwaysShowFabled" class="flex items-center">
          <input v-model="showFabled" type="checkbox" class="mr-2" />
          <span>Show Fabled and Loric</span>
        </label>
        <form @submit.prevent="selectMatchingRole">
          <input
            v-model="roleFilter"
            ref="roleFilterRef"
            type="text"
            placeholder="Filter roles"
            class="p-2 mt-2 border border-gray-300 rounded-md text-black"
            aria-label="Filter roles"
          />
        </form>
      </div>
    </template>
    <div v-if="show">
      <div v-for="roleGroup in roleGroups">
        <template v-if="roleGroup.roles.length">
          <h3 class="mt-4 mb-2 mx-4 text-xl font-bold font-sorts">
            {{ roleGroup.name }}
          </h3>
          <div class="flex flex-wrap justify-around gap-3 p-4">
            <button
              type="button"
              v-for="role in roleGroup.roles"
              class="flex flex-col items-center"
              @click="emit('selectRole', role)"
            >
              <Token
                :character="formatRoleAsCharacter(role as any)"
                size="md"
              />
            </button>
          </div>
        </template>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
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
    initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
  }[];
  visible: boolean;
  alwaysShowAllRoles?: boolean;
  alwaysShowFabled?: boolean;
  hideTravelers?: boolean;
}>();

const emit = defineEmits(["update:visible", "selectRole"]);

const blankRole = computed(() => ({
  type: RoleType.TOWNSFOLK,
  id: "",
  token_url: "",
  name: "",
  initialAlignment: "NEUTRAL",
}));

const showAllRoles = ref(props.alwaysShowAllRoles || false);
const hideAllRolesToggle = computed(
  () =>
    props.alwaysShowAllRoles ||
    props.availableRoles.length === roles.getAllRoles().length
);
const showFabled = ref(false);

const allRoles = computed(() => roles.getAllRoles());
const travelerRoles = computed(() =>
  roles
    .getRoleByType(RoleType.TRAVELER)
    .map((role) => ({ ...role, initial_alignment: "NEUTRAL" }))
);
const fabledRoles = computed(() => [
  ...roles.getRoleByType(RoleType.FABLED),
  ...roles.getRoleByType(RoleType.LORIC),
]);

const roleFilter = ref("");
const roleFilterRef = ref<HTMLInputElement | null>();
const show = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

const providedRolesIncludesTravelers = computed(() => {
  return props.availableRoles.some((role) => role.type === "TRAVELER");
});

const filteredRoles = computed(() => {
  return naturalOrder(
    [
      ...(showAllRoles.value ? allRoles.value : props.availableRoles).filter(
        (role) => role.type !== "FABLED" && role.type !== "LORIC"
      ),
      ...(providedRolesIncludesTravelers.value ? [] : travelerRoles.value),
      ...(showFabled.value || props.alwaysShowFabled ? fabledRoles.value : []),
    ].filter(
      (role, index, array) =>
        array.findIndex((r) => r.id === role.id) === index &&
        role.name.toLowerCase().includes(roleFilter.value.toLowerCase()) &&
        (props.hideTravelers && !showAllRoles.value
          ? role.type !== "TRAVELER"
          : true)
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

const blank = computed(() => [blankRole.value as any as Role]);

const travelers = computed(() => {
  return filteredRoles.value.filter((role) => role.type === "TRAVELER");
});

const fabled = computed(() => {
  return filteredRoles.value.filter((role) => role.type === "FABLED");
});

const loric = computed(() => {
  return filteredRoles.value.filter(role => role.type === "LORIC")
})

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
      name: "Blank",
      roles: blank.value,
    },
    {
      name: "Travelers",
      roles: travelers.value,
    },
    {
      name: "Fabled",
      roles: fabled.value,
    },
    {
      name: "Loric",
      roles: loric.value,
    }
  ];
});

function formatRoleAsCharacter(
  role: Omit<Role, "alignment"> & { alignment: "GOOD" | "EVIL" | "NEUTRAL" }
) {
  return {
    alignment: role.initial_alignment,
    role,
  };
}

function selectMatchingRole() {
  // Select the first role shown
  if (filteredRoles.value.length) {
    emit("selectRole", filteredRoles.value[0]);
  } else {
    emit("selectRole", blankRole.value);
  }
}

watchEffect(() => {
  if (show.value) {
    roleFilter.value = "";
    roleFilterRef.value?.focus();
  }
});

onMounted(() => {
  roles.fetchRoles();
});
</script>
