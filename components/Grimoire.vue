<template>
  <div class="container m-auto" :style="`--m: ${m}; --tan: ${+tan.toFixed(2)}`">
    <div
      v-for="(token, i) in tokens"
      :style="i - has_mid >= 0 ? `--i: ${i}` : ''"
    >
      <div class="token-slot">
        <Token
          @click="openRoleSelectionDialog(token)"
          :character="token"
          size="md"
          class="cursor-pointer"
        />
        <label class="m-auto block text-center">
          <input type="checkbox" v-model="token.is_dead" :readonly="readonly" /> Dead?
        </label>
      </div>
    </div>
  </div>
  <Dialog v-model:visible="showRoleSelectionDialog" size="lg">
    <template #title>
      <h2 class="text-2xl font-bold font-dumbledor">Select a Role</h2>
    </template>
    <div class="flex flex-wrap justify-around gap-3 p-4">
      <div v-for="role in availableRoles" class="flex flex-col items-center">
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

const showRoleSelectionDialog = ref(false);
let focusedToken: Token | null = null;

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
  width: var(--d);
  height: var(--d);
  --az: calc(var(--i) * 1turn / var(--m));
  transform: rotate(var(--az)) translate(var(--r)) rotate(calc(-1 * var(--az)));
}

img {
  max-width: 100%;
}
</style>
