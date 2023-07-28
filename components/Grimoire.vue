<template>
  <div
    class="container m-auto"
    :style="`--m: ${m}; --tan: ${+tan.toFixed(2)}; --offset: ${offset}`"
  >
    <div
      v-for="(token, i) in tokens"
      :style="i - has_mid >= 0 ? `--i: ${i}` : ''"
    >
      <div class="token-slot relative">
        <button
          @click.prevent="!readonly ? (token.is_dead = !token.is_dead) : null"
          class="absolute top-0 left-0 z-10 flex justify-center w-full duration-200"
          :class="{
            'cursor-default': readonly,
            'opacity-0 hover:opacity-50 transition': !readonly && !token.is_dead,
            'hover:-translate-y-2': !readonly,
          }"
        >
          <img src="/img/shroud.png" class="w-8 md:w-10" />
        </button>
        <Token
          @click="!readonly ? openRoleSelectionDialog(token) : null"
          :character="token"
          size="md"
          :class="{ 'cursor-pointer': !readonly }"
        />
      </div>
    </div>
  </div>
  <Dialog v-model:visible="showRoleSelectionDialog" size="lg">
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
        />
      </div>
    </template>
    <div class="flex flex-wrap justify-around gap-3 p-4">
      <div
        v-for="role in filteredAvailableRoles"
        class="flex flex-col items-center"
      >
        <Token
          @click="selectRoleForToken(role)"
          :character="formatRoleAsCharacter(role)"
          size="md"
          class="cursor-pointer"
        />
        {{ role.name }}
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { RoleType, Alignment } from "@prisma/client";

type Token = {
  alignment: "GOOD" | "EVIL" | "NEUTRAL" | undefined;
  order: number;
  is_dead: boolean;
  role_id?: string;
  role?: { token_url: string; type: string };
  related_role?: { token_url: string };
};

const props = defineProps<{
  tokens: Token[];
  availableRoles?: {
    type: RoleType;
    id: string;
    token_url: string;
    name: string;
    initial_alignment: Alignment;
  }[];
  readonly?: boolean;
}>();

const roleFilter = ref("");
const showRoleSelectionDialog = ref(false);
let focusedToken: Token | null = null;

const filteredAvailableRoles = computed(() => {
  if (!props.availableRoles) return [];
  return props.availableRoles.filter((role) =>
    role.name.toLowerCase().includes(roleFilter.value.toLowerCase())
  );
});

watch(
  () => showRoleSelectionDialog,
  () => {
    roleFilter.value = "";
  }
);

function openRoleSelectionDialog(token: Token) {
  focusedToken = token;
  showRoleSelectionDialog.value = true;
}

function selectRoleForToken(role: {
  type: RoleType;
  id: string;
  token_url: string;
  name: string;
  initial_alignment: Alignment;
}) {
  if (focusedToken) {
    focusedToken.role = {
      token_url: role.token_url,
      type: role.type,
    };
    focusedToken.role_id = role.id;
    focusedToken.alignment = role.initial_alignment;
  }
  showRoleSelectionDialog.value = false;
}

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

const tokenCount = computed(() => props.tokens.length);
const has_mid = 0; /* 0 if there's no item in the middle, 1 otherwise */
const m = computed(
  () => tokenCount.value - has_mid
); /* how many are ON the circle */
const tan = computed(() =>
  Math.tan(Math.PI / m.value)
); /* tangent of half the base angle */
const offset = computed(() => {
  const extra = 0.25 * (m.value - 5);

  return 1.25 + extra;
});
</script>

<style scoped>
.container {
  --d: 7rem; /* image size */
  --rel: calc(
    8 / (var(--m) * 2)
  ); /* how much extra space we want between images, 1 = one image size */
  --r: calc(0.5 * (1 + var(--rel)) * var(--d) / var(--tan)); /* circle radius */
  --s: calc(2 * var(--r) + var(--d)); /* container size */
  position: relative;
  width: var(--s);
  height: var(--s);
}

.container div.token-slot {
  position: absolute;
  top: 50%;
  left: 50%;
  margin: calc(-0.5 * var(--d));
  /* width: var(--d);
  height: var(--d); */
  --az: calc((var(--i) - var(--offset)) * 1turn / var(--m));
  transform: rotate(var(--az)) translate(var(--r)) rotate(calc(-1 * var(--az)));
}

img {
  max-width: 100%;
}
</style>
