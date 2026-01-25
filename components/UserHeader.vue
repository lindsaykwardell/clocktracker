<template>
  <div class="bg-stone-200 dark:bg-stone-950 shadow-lg">
    <div
      class="flex flex-col items-center md:items-start w-full lg:w-2/3 m-auto pt-4 px-8 lg:px-0 gap-4"
    >
      <div
        class="flex flex-col md:flex-row gap-4 md:gap-2 lg:gap-3 xl:gap-4 items-center w-full"
      >
        <Avatar
          :value="player.avatar || ''"
          class="border-2 shadow-xl flex-shrink row-span-3"
          size="lg"
        />
        <div class="flex-grow flex flex-col justify-start gap-3 w-full">
          <div class="flex flex-col items-center md:items-start gap-2">
            <div>
              <h1 class="font-sorts text-2xl xl:text-3xl text-center md:text-start break-all">
                {{ player.display_name }}
              </h1>
              <p class="text-sm text-center md:text-start">
                @{{ player.username }}
                <template v-if="player.pronouns">
                  <span> - {{ player.pronouns }}</span>
                </template>
              </p>
            </div>
            <div
              v-if="player.location"
              class="md:text-lg dark:text-stone-400 flex gap-2 items-center"
            >
              <IconUI id="location" />
              <span class="sr-only">Location: </span><span>{{ player.location }}</span>
            </div>
            <div
              v-if="player.kofi_level"
              class="md:text-lg dark:text-stone-400 flex gap-2 items-center"
            >
              <IconUI id="kofi" />
              <span v-if="player.kofi_level === 'ONE_TIME'">Supporter</span>
              <span v-else-if="player.kofi_level === 'SUBSCRIBER'">
                Subscriber
              </span>
            </div>
            <div class="flex gap-2 items-center">
              <div
                v-if="gamesAsStoryteller.length"
                class="flex gap-1 items-center h-6 overflow-y-hidden"
                v-tooltip="`Storyteller in ${gamesAsStoryteller.length} games`"
              >
                <img
                  :src="`/img/role/storyteller_inv.png`"
                  alt="Storyteller Count"
                  class="hidden dark:block w-8"
                />
                <img
                  :src="`/img/role/storyteller.png`"
                  alt="Storyteller Count"
                  class="block dark:hidden w-8"
                />
                <div class="flex gap-2">
                  {{ gamesAsStoryteller.length }}
                </div>
              </div>
              <div
                v-if="gamesAsPlayer.length"
                class="flex gap-1 items-center h-6 overflow-y-hidden"
                v-tooltip="
                  `Player in ${gamesAsPlayer.length} games (Most played: ${
                    mostCommonCharacter?.name || ''
                  })`
                "
              >
                <img
                  :src="
                    mostCommonCharacter?.token_url || `/img/role/amnesiac.png`
                  "
                  alt="Player Count"
                  class="w-8"
                />
                <div class="flex gap-2">
                  {{ gamesAsPlayer.length }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex-none">
          <FriendButton
            v-if="user && !isUser"
            :username="player.username"
            :user_id="player.user_id"
          />
          <Button
            component="nuxt-link"
            v-if="isUser"
            :to="`/settings`"
            icon="edit"
            color="primary"
          >
            Edit profile
          </Button>
        </div>
      </div>
      <div v-if="player.communities?.length" class="flex flex-col gap-1">
        <h2 class="text-xs text-stone-600 text-center md:text-start uppercase">Communities</h2>
        <div
          class="flex flex-wrap justify-start gap-[0.125rem]"
        >
          <nuxt-link
            v-for="community in player.communities"
            :to="`/community/${community.slug}`"
          >
            <Avatar
              :value="community.icon"
              size="xs"
              class="flex-shrink bg-stone-300 dark:bg-stone-950"
              v-tooltip="community.name"
            />
          </nuxt-link>
        </div>
      </div>
      <hr v-if="player.bio" class="border-stone-100 w-full" />
      <p class="whitespace-pre-wrap w-full text-center md:text-start text-sm md:text-base text-balance max-w-[80ch]">
        {{ player.bio }}
      </p>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser();
const games = useGames();
const roles = useRoles();

const props = defineProps<{
  player: {
    username: string;
    user_id: string;
    display_name: string;
    avatar: string | null;
    pronouns: string | null;
    bio: string;
    location: string | null;
    kofi_level: string | null;
    communities?: {
      name: string;
      slug: string;
      icon: string;
    }[];
  };
}>();

const isUser = computed(() => user.value?.id === props.player.user_id);

const allGames = computed(() => {
  return games.getByPlayer(props.player.username);
});

const gamesAsStoryteller = computed(() => {
  if (allGames.value.status !== Status.SUCCESS) return [];

  return allGames.value.data.filter(
    (game) =>
      game.is_storyteller ||
      game.co_storytellers.includes(props.player.username)
  );
});

const gamesAsPlayer = computed(() => {
  if (allGames.value.status !== Status.SUCCESS) return [];

  return allGames.value.data.filter(
    (game) =>
      !(
        game.is_storyteller ||
        game.co_storytellers.includes(props.player.username)
      )
  );
});

const mostCommonCharacter = computed(() => {
  if (allGames.value.status !== Status.SUCCESS) return undefined;

  const characterCounts = gamesAsPlayer.value
    .filter((game) => !game.ignore_for_stats)
    .reduce((acc, game) => {
      // Count each distinct playable role_id once per game to avoid double-counting swaps.
      const roleIds = new Set(
        game.player_characters
          .filter(
            (character) =>
              character?.role_id &&
              character.role?.type !== "FABLED" &&
              character.role?.type !== "LORIC"
          )
          .map((character) => character.role_id as string)
      );

      for (const roleId of roleIds) {
        acc[roleId] = (acc[roleId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

  const sortedCharacters = Object.entries(characterCounts).sort(
    (a, b) => b[1] - a[1]
  );

  const role = roles.getRole(sortedCharacters?.[0]?.[0]);

  return role;
});
</script>
