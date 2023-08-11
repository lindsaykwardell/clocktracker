<template>
  <div id="grimoire" class="container m-auto">
    <div v-for="token in orderedTokens">
      <div class="token-seat relative flex flex-col items-center">
        <button
          type="button"
          @click.prevent="token.is_dead = !token.is_dead"
          :disabled="readonly"
          class="absolute top-0 left-0 z-10 flex justify-center w-full duration-200"
          :class="{
            'cursor-default': readonly,
            'opacity-0': !token.is_dead,
            'hover:opacity-50 transition hover:-translate-y-2':
              !readonly && !token.is_dead,
          }"
        >
          <img src="/img/shroud.png" class="w-8 md:w-10" />
        </button>
        <Token
          @clickRole="!readonly ? openRoleSelectionDialog(token, 'role') : null"
          @clickRelated="
            !readonly ? openRoleSelectionDialog(token, 'related_role') : null
          "
          @clickAlignment="toggleAlignment(token)"
          :character="token"
          size="md"
          :class="{ 'cursor-pointer': !readonly }"
          :alwaysShowAlignment="!readonly && !!token.role"
        />
        <input
          v-if="!readonly"
          v-model="token.player_name"
          @input="checkIfPlayerNameIsFriend(token)"
          type="text"
          class="w-28 bg-stone-600 rounded p-1 border-2 border-stone-500 text-center"
          :readonly="readonly"
          list="friends"
        />
        <a
          v-else-if="token.player_id"
          :href="`/${token.player_name}`"
          class="bg-green-800 rounded p-1 border-2 border-green-700 text-center text-ellipsis max-w-[150px] overflow-hidden whitespace-nowrap hover:bg-blue-800 hover:border-blue-700 transition duration-150 hover:underline"
        >
          {{ token.player_name }}
        </a>
        <span
          v-else-if="token.player_name"
          class="bg-stone-600 rounded p-1 border-2 border-stone-500 text-center text-ellipsis max-w-[150px] overflow-hidden whitespace-nowrap"
        >
          {{ token.player_name }}
        </span>
      </div>
    </div>
  </div>
  <datalist id="friends">
    <option
      v-for="friend in potentiallyTaggedPlayers"
      :value="`@${friend?.username}`"
    />
  </datalist>
  <TokenDialog
    v-if="availableRoles"
    v-model:visible="showRoleSelectionDialog"
    :availableRoles="availableRoles"
    @selectRole="selectRoleForToken"
  />
</template>

<script setup lang="ts">
import { RoleType, Alignment } from "@prisma/client";

type Token = {
  alignment: "GOOD" | "EVIL" | "NEUTRAL" | undefined;
  order: number;
  is_dead: boolean;
  role_id: string | null;
  role?: {
    token_url: string;
    type: string;
    initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
    name?: string;
  };
  related_role_id: string | null;
  related_role?: { token_url: string; name?: string };
  player_name: string;
  player_id?: string | null;
};

const friends = useFriends();
const users = useUsers();
const user = useSupabaseUser();

const me = computed(() => {
  const meStatus = users.getUserById(user.value?.id);

  if (meStatus.status === Status.SUCCESS) {
    return meStatus.data;
  } else {
    return undefined;
  }
});

const potentiallyTaggedPlayers = computed(() => {
  return [me.value, ...friends.getFriends].filter(
    (player) =>
      !player ||
      !props.tokens.find((token) => token.player_id === player.user_id)
  );
});

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

const orderedTokens = computed(() =>
  props.tokens.sort((a, b) => a.order - b.order)
);

const showRoleSelectionDialog = ref(false);
let focusedToken: Token | null = null;
const tokenMode = ref<"role" | "related_role">("role");

function openRoleSelectionDialog(token: Token, mode: "role" | "related_role") {
  focusedToken = token;
  tokenMode.value = mode;
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
    if (tokenMode.value === "role") {
      focusedToken.role = {
        token_url: role.token_url,
        initial_alignment: role.initial_alignment,
        type: role.type,
        name: role.name,
      };
      focusedToken.role_id = role.id;
      focusedToken.alignment = role.initial_alignment;
      focusedToken.related_role = {
        token_url: "/1x1.png",
        name: role.name,
      };
    } else {
      focusedToken.related_role = {
        token_url: role.token_url,
      };
      focusedToken.related_role_id = role.id;
    }
  }
  showRoleSelectionDialog.value = false;
}

function toggleAlignment(token: Token) {
  if (token.role) {
    token.alignment = token.alignment === "GOOD" ? "EVIL" : "GOOD";
  }
}

function checkIfPlayerNameIsFriend(token: Token) {
  if (token.player_name.startsWith("@")) {
    const player = potentiallyTaggedPlayers.value.find(
      (player) => player?.username === token.player_name.slice(1)
    );
    if (player) {
      token.player_id = player.user_id;
    } else {
      token.player_id = undefined;
    }
  }
}
</script>

<style scoped>
.container {
  --d: 7rem; /* image size */
  --rel: calc(
    8 / (var(--m) * 2)
  ); /* how much extra space we want between images, 1 = one image size */
  --r: calc(
    0.5 * (1 + var(--rel)) * var(--d) / tan(pi / var(--m))
  ); /* circle radius */
  --s: calc(2 * var(--r) + var(--d) + 75px); /* container size */
  position: relative;
  width: var(--s);
  height: var(--s);
}

.container div.token-seat {
  position: absolute;
  top: 50%;
  left: 50%;
  margin: calc(-0.5 * var(--d));
  --offset: calc(1.25 + (0.25 * (var(--m) - 5)));
  /* width: var(--d);
  height: var(--d); */
  --az: calc((var(--i) - var(--offset)) * 1turn / var(--m));
  transform: rotate(var(--az)) translate(var(--r)) rotate(calc(-1 * var(--az)));
}

img {
  max-width: 100%;
}

.container:has(:nth-child(1)) {
  --m: 1;
}

.container:has(:nth-child(2)) {
  --m: 2;
}

.container:has(:nth-child(3)) {
  --m: 3;
}

.container:has(:nth-child(4)) {
  --m: 4;
}

.container:has(:nth-child(5)) {
  --m: 5;
}

.container:has(:nth-child(6)) {
  --m: 6;
}

.container:has(:nth-child(7)) {
  --m: 7;
}

.container:has(:nth-child(8)) {
  --m: 8;
}

.container:has(:nth-child(9)) {
  --m: 9;
}

.container:has(:nth-child(10)) {
  --m: 10;
}

.container:has(:nth-child(11)) {
  --m: 11;
}

.container:has(:nth-child(12)) {
  --m: 12;
}

.container:has(:nth-child(13)) {
  --m: 13;
}

.container:has(:nth-child(14)) {
  --m: 14;
}

.container:has(:nth-child(15)) {
  --m: 15;
}

.container:has(:nth-child(16)) {
  --m: 16;
}

.container:has(:nth-child(17)) {
  --m: 17;
}

.container:has(:nth-child(18)) {
  --m: 18;
}

.container:has(:nth-child(19)) {
  --m: 19;
}

.container:has(:nth-child(20)) {
  --m: 20;
}

.container > div:nth-child(1) {
  --i: 0;
}

.container > div:nth-child(2) {
  --i: 1;
}

.container > div:nth-child(3) {
  --i: 2;
}

.container > div:nth-child(4) {
  --i: 3;
}

.container > div:nth-child(5) {
  --i: 4;
}

.container > div:nth-child(6) {
  --i: 5;
}

.container > div:nth-child(7) {
  --i: 6;
}

.container > div:nth-child(8) {
  --i: 7;
}

.container > div:nth-child(9) {
  --i: 8;
}

.container > div:nth-child(10) {
  --i: 9;
}

.container > div:nth-child(11) {
  --i: 10;
}

.container > div:nth-child(12) {
  --i: 11;
}

.container > div:nth-child(13) {
  --i: 12;
}

.container > div:nth-child(14) {
  --i: 13;
}

.container > div:nth-child(15) {
  --i: 14;
}

.container > div:nth-child(16) {
  --i: 15;
}

.container > div:nth-child(17) {
  --i: 16;
}

.container > div:nth-child(18) {
  --i: 17;
}

.container > div:nth-child(19) {
  --i: 18;
}

.container > div:nth-child(20) {
  --i: 19;
}
</style>
