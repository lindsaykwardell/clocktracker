<template>
  <div id="grimoire" class="container m-auto" :style="`--m: ${tokens.length}`">
    <div v-for="(token, index) in orderedTokens" :style="`--i: ${index}`">
      <div
        class="token-seat relative flex flex-col"
        :class="{
          'z-50': token.order === focusedToken?.order,
        }"
      >
        <div class="reminder-tokens">
          <div
            v-for="(reminderToken, tokenIndex) in token.reminders"
            class="reminder-token"
            :style="`--ti: ${tokenIndex}`"
          >
            <button
              v-if="!readonly"
              type="button"
              class="z-50 absolute w-full h-full flex justify-center items-center rounded-full bg-black/25 opacity-0 hover:opacity-100 transition duration-200 cursor-pointer"
              @click="removeReminder(token, reminderToken)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 512 512"
              >
                <path
                  d="M400 113.3h-80v-20c0-16.2-13.1-29.3-29.3-29.3h-69.5C205.1 64 192 77.1 192 93.3v20h-80V128h21.1l23.6 290.7c0 16.2 13.1 29.3 29.3 29.3h141c16.2 0 29.3-13.1 29.3-29.3L379.6 128H400v-14.7zm-193.4-20c0-8.1 6.6-14.7 14.6-14.7h69.5c8.1 0 14.6 6.6 14.6 14.7v20h-98.7v-20zm135 324.6v.8c0 8.1-6.6 14.7-14.6 14.7H186c-8.1 0-14.6-6.6-14.6-14.7v-.8L147.7 128h217.2l-23.3 289.9z"
                  fill="currentColor"
                />
                <path d="M249 160h14v241h-14z" fill="currentColor" />
                <path d="M320 160h-14.6l-10.7 241h14.6z" fill="currentColor" />
                <path d="M206.5 160H192l10.7 241h14.6z" fill="currentColor" />
              </svg>
            </button>
            <ReminderToken :reminder="reminderToken"> </ReminderToken>
          </div>
          <Token
            v-if="!readonly"
            class="reminder-token opacity-0 hover:opacity-100 transition duration-200 cursor-pointer"
            :character="{ role: { token_url: '/1x1.png' } }"
            size="reminder"
            :style="`--ti: ${token.reminders?.length ?? 0}`"
            @click="openReminderDialog(token)"
          >
          </Token>
        </div>
        <button
          type="button"
          v-if="token.is_dead || token.used_ghost_vote"
          :disabled="readonly"
          class="absolute top-0 left-0 z-20 flex justify-center w-full duration-200"
          :class="{
            'cursor-default': readonly,
            'opacity-0': !token.used_ghost_vote,
            'hover:opacity-50 transition hover:-translate-y-2':
              !readonly && token.is_dead && !token.used_ghost_vote,
          }"
          @click.prevent="toggleUsedGhostVote(token)"
        >
          <img src="/img/token-bg-dead.webp" class="w-4 md:w-8" />
        </button>
        <button
          type="button"
          @click.prevent="toggleIsDead(token)"
          :disabled="props.readonly"
          class="absolute top-0 left-0 z-10 flex justify-center w-full duration-200"
          :class="{
            'cursor-default': props.readonly,
            'opacity-0': !token.is_dead,
            'hover:opacity-50 transition hover:-translate-y-2':
              !props.readonly && !token.is_dead,
          }"
        >
          <img src="/img/shroud.png" class="w-8 md:w-10" />
        </button>
        <a
          v-if="props.readonly && token.role_id"
          :href="`/roles/${token.role_id}`"
          target="_blank"
          class="hover:underline flex flex-col items-center"
        >
          <Token
            @clickRole="
              !props.readonly ? openRoleSelectionDialog(token, 'role') : null
            "
            @clickRelated="
              !props.readonly
                ? openRoleSelectionDialog(token, 'related_role')
                : null
            "
            @clickAlignment="toggleAlignment(token)"
            :character="token"
            size="md"
            :class="{ 'cursor-pointer': !props.readonly }"
            :alwaysShowAlignment="!props.readonly && !!token.role"
          />
        </a>
        <Token
          v-else
          @clickRole="
            !props.readonly ? openRoleSelectionDialog(token, 'role') : null
          "
          @clickRelated="
            !props.readonly
              ? openRoleSelectionDialog(token, 'related_role')
              : null
          "
          @clickAlignment="toggleAlignment(token)"
          :character="token"
          size="md"
          :class="{ 'cursor-pointer': !props.readonly }"
          :alwaysShowAlignment="!props.readonly && !!token.role"
        />
        <div v-if="!props.readonly" class="relative z-50">
          <ClientOnly>
            <GrimoireTaggedUserInput
              :users="filteredTaggablePlayers"
              @inputFocused="focusedToken = token"
              v-model:value="token.player_name"
            />
          </ClientOnly>
        </div>
        <nuxt-link
          v-else-if="token.player_id"
          :to="`/${
            token.player?.username
              ? `@${token.player.username}`
              : token.player_name
          }`"
          class="bg-green-800 rounded p-1 border-2 border-green-700 text-center text-ellipsis text-xs md:text-sm max-w-[5rem] md:max-w-[7rem] overflow-hidden whitespace-nowrap hover:bg-blue-800 hover:border-blue-700 transition duration-150 hover:underline"
        >
          {{ token.player_name }}
        </nuxt-link>
        <span
          v-else-if="token.player_name"
          class="bg-stone-600 rounded p-1 border-2 border-stone-500 text-center text-ellipsis text-xs md:text-sm max-w-[150px] overflow-hidden whitespace-nowrap"
        >
          {{ token.player_name }}
        </span>
      </div>
    </div>
  </div>
  <TokenDialog
    v-if="availableRoles"
    v-model:visible="showRoleSelectionDialog"
    :availableRoles="availableRoles as any"
    @selectRole="selectRoleForToken"
  />
  <ReminderDialog
    v-if="reminders.length > 0"
    v-model:visible="showReminderDialog"
    :reminders="reminders"
    @selectReminder="selectReminder"
  />
</template>

<script setup lang="ts">
import { RoleType } from "~/composables/useRoles";

type Token = {
  alignment: "GOOD" | "EVIL" | "NEUTRAL" | undefined;
  order: number;
  is_dead: boolean;
  used_ghost_vote: boolean;
  role_id: string | null;
  role?: {
    token_url: string;
    type: string;
    initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
    name?: string;
  };
  related_role_id: string | null;
  related_role?: { token_url: string; name?: string };
  reminders: { reminder: string; token_url: string }[];
  player_name: string;
  player_id?: string | null;
  player?: {
    username: string;
  };
};

const friends = useFriends();
const users = useUsers();
const user = useSupabaseUser();
const games = useGames();
const roles = useRoles();

const me = computed(() => {
  const meStatus = users.getUserById(user.value?.id);

  if (meStatus.status === Status.SUCCESS) {
    return meStatus.data;
  } else {
    return undefined;
  }
});

const communityMembersWhoArentFriends = computed(() =>
  friends.getCommunityMembers.filter(
    (member) =>
      !friends.getFriends.find((friend) => friend.user_id === member.user_id)
  )
);

const potentiallyTaggedPlayers = computed(() => {
  return [
    me.value,
    ...friends.getFriends,
    ...communityMembersWhoArentFriends.value,
  ].map((player) => ({
    ...player,
    username: `@${player?.username}`,
  }));
});

const filteredTaggablePlayers = computed(() => {
  return allTaggablePlayers.value.filter(
    (player) =>
      !player ||
      (!props.tokens.find((token) => token.player_name === player.username) &&
        !props.excludePlayers?.includes(player.username))
  );
});

const previouslyTaggedPlayers = computed(() => {
  return games
    .getPreviouslyTaggedByPlayer(me.value?.username)
    .map((player) => ({
      username: player,
      display_name: "",
      user_id: null,
      avatar: "/img/default.png",
    }));
});

const allTaggablePlayers = computed(() => {
  return [
    ...potentiallyTaggedPlayers.value,
    ...previouslyTaggedPlayers.value,
  ].filter(
    (player, index, array) =>
      player &&
      array.findIndex(
        (p) => p.user_id === player.user_id && p.username === player.username
      ) === index
  );
});

const props = defineProps<{
  tokens: Token[];
  availableRoles?: {
    type: RoleType;
    id: string;
    token_url: string;
    name: string;
    initial_alignment: "GOOD" | "EVIL" | "NEUTRAL" | undefined;
  }[];
  readonly?: boolean;
  excludePlayers?: string[];
}>();

const emit = defineEmits(["selectedMe"]);

const orderedTokens = computed(() =>
  props.tokens.sort((a, b) => a.order - b.order)
);

const reminders = computed(() => {
  const travelers = roles.getRoleByType(RoleType.TRAVELER);
  const fabled = roles.getRoleByType(RoleType.FABLED);
  return roles.getRemindersForRoles([
    ...(props.availableRoles?.map((r) => r.id) ?? []),
    ...travelers.map((r) => r.id),
    ...fabled.map((r) => r.id),
  ]);
});

const showRoleSelectionDialog = ref(false);
const showReminderDialog = ref(false);
const focusedToken = ref<Token | null>(null);
const tokenMode = ref<"role" | "related_role">("role");

function openRoleSelectionDialog(token: Token, mode: "role" | "related_role") {
  focusedToken.value = token;
  tokenMode.value = mode;
  showRoleSelectionDialog.value = true;
}

function selectRoleForToken(role: {
  type: RoleType;
  id: string;
  token_url: string;
  name: string;
  initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
}) {
  if (focusedToken.value) {
    if (tokenMode.value === "role") {
      if (role.id) {
        focusedToken.value.role = {
          token_url: role.token_url,
          initial_alignment: role.initial_alignment,
          type: role.type,
          name: role.name,
        };
        focusedToken.value.role_id = role.id;
        focusedToken.value.alignment = role.initial_alignment;
        focusedToken.value.related_role = {
          token_url: "/1x1.png",
        };
        focusedToken.value.related_role_id = null;
      } else {
        focusedToken.value.role = undefined;
        focusedToken.value.role_id = null;
        focusedToken.value.alignment = "NEUTRAL";
        focusedToken.value.related_role = undefined;
        focusedToken.value.related_role_id = null;
      }
    } else {
      if (role.id) {
        focusedToken.value.related_role = {
          token_url: role.token_url,
          name: role.name,
        };
        focusedToken.value.related_role_id = role.id;
      } else {
        focusedToken.value.related_role = {
          token_url: "/1x1.png",
        };
        focusedToken.value.related_role_id = null;
      }
    }
  }
  showRoleSelectionDialog.value = false;
}

function toggleAlignment(token: Token) {
  if (token.role) {
    token.alignment = token.alignment === "GOOD" ? "EVIL" : "GOOD";
  }
}

// watch the tokens, and when it changes check if each of them is a friend
watch(
  () => props.tokens,
  (tokens) => {
    tokens.forEach((token) => {
      checkIfPlayerNameIsFriend(token);
    });
  },
  { immediate: true, deep: true }
);

function checkIfPlayerNameIsFriend(token: Token) {
  if (props.readonly) {
    return;
  }

  if (token.player_name === null || token.player_name === undefined) {
    token.player_name = "";
  }

  if (token.player_name.startsWith("@")) {
    const player = potentiallyTaggedPlayers.value.find(
      (player) => player?.username.slice(1) === token.player_name.slice(1)
    );
    if (player) {
      if (token.player_id !== player.user_id) {
        token.player_name = player.display_name || token.player_name;
        token.player_id = player.user_id;
      }
    } else {
      if (token.player_id) {
        token.player_id = undefined;
      }
    }
  } else {
    if (token.player_id) {
      const player = potentiallyTaggedPlayers.value.find(
        (player) => player?.user_id === token.player_id
      );

      if (!player || player.display_name !== token.player_name) {
        token.player_id = undefined;
      }
    }
  }
}

function openReminderDialog(token: Token) {
  focusedToken.value = token;
  showReminderDialog.value = true;
}

function selectReminder(reminder: { reminder: string; token_url: string }) {
  if (focusedToken.value) {
    focusedToken.value.reminders.push({
      reminder: reminder.reminder,
      token_url: reminder.token_url,
    });
  }
  showReminderDialog.value = false;
}

function removeReminder(
  token: Token,
  reminder: { reminder: string; token_url: string }
) {
  token.reminders = token.reminders.filter(
    (r) =>
      r.reminder !== reminder.reminder && r.token_url !== reminder.token_url
  );
}

function toggleIsDead(token: Token) {
  token.is_dead = !token.is_dead;
  token.used_ghost_vote = false;
}

function toggleUsedGhostVote(token: Token) {
  token.used_ghost_vote = !token.used_ghost_vote;
  if (!token.used_ghost_vote) {
    token.is_dead = false;
  }
}

onMounted(() => {
  roles.fetchRoles();
});
</script>

<style scoped>
.container {
  --d: 7rem;
  --rel: calc(
    8 / (var(--m) * 2 - 5)
  ); /* how much extra space we want between images, 1 = one image size */
  --r: calc(
    0.5 * (1 + var(--rel)) * var(--d) / tan(pi / var(--m))
  ); /* circle radius */
  --s: calc(2 * var(--r) + var(--d) + 75px); /* container size */
  position: relative;
  z-index: 10;
  width: var(--s);
  height: var(--s);

  @media (max-width: 768px) {
    --d: 5rem;
  }
}

.container div.token-seat {
  position: absolute;
  top: 50%;
  left: 50%;
  margin: calc(-0.5 * var(--d));
  --offset: calc(1.25 + (0.25 * (var(--m) - 5)));
  width: var(--d);
  --az: calc((var(--i) - var(--offset)) * 1turn / var(--m));
  transform: rotate(var(--az)) translate(var(--r)) rotate(calc(-1 * var(--az)));
}

.container div.token-seat .reminder-tokens {
  position: absolute;
  --rd: 2rem;
  --distance: -7rem;
  @media (max-width: 768px) {
    --rd: 1.5rem;
    --distance: -6rem;
  }
  top: calc(50% - var(--rd));
  left: calc(50% - var(--rd));
  /* transform: translate(-50%, -50%); */
  transform: rotate(var(--az)) translate(var(--distance))
    rotate(calc(-1 * var(--az)));

  & .reminder-token {
    position: absolute;
    top: 0;
    left: 0;
    transform: rotate(var(--az)) translate(calc(var(--ti) * -2.25 * var(--rd)))
      rotate(calc(-1 * var(--az)));
  }
}

img {
  max-width: 100%;
}
</style>
