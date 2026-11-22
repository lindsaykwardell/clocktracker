<template>
  <Dialog v-model:visible="show" size="lg">
    <template #title>
      <!-- Same header as the reminder dialog. md:-mt-2: the dialog's close
           button sits higher (p-2) than the title (p-4); this centres the
           title row on it. -->
      <div class="flex flex-col md:flex-row md:items-center md:-mt-2 w-full gap-2">
        <h2 class="flex-grow text-2xl font-bold font-sorts">Select a Role</h2>
        <form @submit.prevent="selectMatchingRole">
          <input
            v-model="roleFilter"
            ref="roleFilterRef"
            type="search"
            placeholder="Filter roles"
            class="w-full md:w-56 h-[2.5rem] p-2 rounded-md border border-stone-500 bg-stone-600 text-lg text-white placeholder:text-stone-300"
            aria-label="Filter roles"
          />
        </form>
      </div>
      <div class="flex flex-wrap gap-x-6 gap-y-1 pt-2">
        <label
          v-if="showExcludeIrrelevantToggle"
          class="inline-flex items-center gap-2"
        >
          <input v-model="excludeIrrelevant" type="checkbox" />
          <span class="text-sm">Exclude irrelevant roles</span>
        </label>
        <label v-if="!hideAllRolesToggle" class="inline-flex items-center gap-2">
          <input v-model="showAllRoles" type="checkbox" />
          <span class="text-sm">All Roles</span>
        </label>
        <label v-if="!alwaysShowFabled" class="inline-flex items-center gap-2">
          <input v-model="showFabled" type="checkbox" />
          <span class="text-sm">Show Fabled and Loric</span>
        </label>
      </div>
    </template>
    <div v-if="show" class="px-4">
      <p
        v-if="roleFilter.trim() && !filteredRoles.length"
        class="pt-4 text-center text-stone-400"
      >
        No roles match "{{ roleFilter.trim() }}". Enter picks a blank token.
      </p>
      <div v-for="roleGroup in roleGroups">
        <template v-if="roleGroup.roles.length">
          <h3 class="mt-4 mb-2 mx-4 text-xl font-bold font-sorts text-center">
            {{ roleGroup.name }}
          </h3>
          <hr class="border-stone-700" />
          <div class="flex flex-wrap justify-center gap-3 p-4">
            <button
              type="button"
              v-for="role in roleGroup.roles"
              class="flex flex-col items-center"
              :aria-label="role.name || 'Blank token'"
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
import type { Role } from "~/server/generated/prisma/client";
import naturalOrder from "natural-order";
import { useLocalStorage } from "@vueuse/core";
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
  hideBlankRole?: boolean;
  restrictRoleIds?: string[] | null;
  showExcludeIrrelevantToggle?: boolean;
  excludeIrrelevant?: boolean;
}>();

const emit = defineEmits(["update:visible", "selectRole", "update:excludeIrrelevant"]);

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
// Remembered per browser, like the reminder dialog's options.
const showFabled = useLocalStorage("roleDialogShowFabledLoric", false);
const excludeIrrelevant = computed({
  get: () => props.excludeIrrelevant ?? false,
  set: (value) => emit("update:excludeIrrelevant", value),
});

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
  const restrictIds =
    excludeIrrelevant.value && props.restrictRoleIds?.length
      ? new Set(props.restrictRoleIds)
      : null;

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
          : true) &&
        (!restrictIds || role.id === "" || restrictIds.has(role.id))
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
  const groups = [
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
    {
      name: "Loric",
      roles: loric.value,
    }
  ];

  if (!props.hideBlankRole) {
    groups.splice(4, 0, {
      name: "Blank",
      roles: blank.value,
    });
  }

  return groups;
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
  if (show.value) roleFilter.value = "";
});

watch(show, async (visible) => {
  // Only with a mouse: on a phone, focusing would open the keyboard over the
  // characters.
  if (!visible || !window.matchMedia("(pointer: fine)").matches) return;
  await nextTick();
  roleFilterRef.value?.focus();
});

onMounted(() => {
  roles.fetchRoles();
});
</script>
