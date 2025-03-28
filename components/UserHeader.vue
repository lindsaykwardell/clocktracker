<template>
  <div class="bg-stone-200 dark:bg-stone-950 shadow-lg">
    <div
      class="flex flex-col items-center w-full md:w-3/4 lg:w-2/3 xl:w-1/2 m-auto pt-4"
    >
      <div
        class="grid grid-cols-[8rem_1fr_8rem] md:grid-cols-[10rem_1fr_10rem] gap-4 w-full"
      >
        <Avatar
          :value="player.avatar || ''"
          class="border-2 shadow-xl flex-shrink row-span-3"
          size="lg"
        />
        <h3 class="font-sorts text-2xl xl:text-3xl col-span-2">
          {{ player.display_name }}
        </h3>
        <div class="row-start-2 col-start-2">
          <div class="md:text-lg dark:text-stone-400">
            <h4>{{ player.username }}</h4>
            <template v-if="player.pronouns">
              <span>{{ player.pronouns }}</span>
            </template>
          </div>
          <div
            v-if="player.location"
            class="md:text-lg dark:text-stone-400 flex gap-2 items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 32 32"
            >
              <path
                fill="currentColor"
                d="M16 2a14 14 0 1 0 14 14A14.016 14.016 0 0 0 16 2ZM4.02 16.394l1.338.446L7 19.303v1.283a1 1 0 0 0 .293.707L10 24v2.377a11.994 11.994 0 0 1-5.98-9.983ZM16 28a11.968 11.968 0 0 1-2.572-.285L14 26l1.805-4.512a1 1 0 0 0-.097-.926l-1.411-2.117a1 1 0 0 0-.832-.445h-4.93l-1.248-1.873L9.414 14H11v2h2v-2.734l3.868-6.77l-1.736-.992L14.277 7h-2.742L10.45 5.371A11.861 11.861 0 0 1 20 4.7V8a1 1 0 0 0 1 1h1.465a1 1 0 0 0 .832-.445l.877-1.316A12.033 12.033 0 0 1 26.894 11H22.82a1 1 0 0 0-.98.804l-.723 4.47a1 1 0 0 0 .54 1.055L25 19l.685 4.056A11.98 11.98 0 0 1 16 28Z"
              />
            </svg>
            <span>{{ player.location }}</span>
          </div>
          <div
            v-if="player.kofi_level"
            class="md:text-lg dark:text-stone-400 flex gap-2 items-center"
          >
            <KoFi />
            <span v-if="player.kofi_level === 'ONE_TIME'">Supporter</span>
            <span v-else-if="player.kofi_level === 'SUBSCRIBER'">
              Subscriber
            </span>
          </div>
          <div class="flex gap-2 items-center">
            <div
              v-if="gamesAsStoryteller.length"
              class="flex gap-1 items-center"
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
              class="flex gap-1 items-center"
              v-tooltip="
                `Player in ${gamesAsPlayer.length} games (Most common role: ${
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
        <FriendButton
          v-if="user && !isUser"
          :username="player.username"
          :user_id="player.user_id"
          class="row-start-2 col-start-3"
        />
        <div
          v-if="player.communities?.length"
          class="flex flex-wrap justify-start row-start-4 col-span-3"
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
      <hr v-if="player.bio" class="border-stone-100 w-full my-4" />
      <p class="whitespace-pre-wrap text-left w-full p-4">
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

  const allPlayedCharacters = gamesAsPlayer.value
    .filter((game) => !game.ignore_for_stats)
    .flatMap((game) => game.player_characters)
    .filter((character) => character?.role_id);

  const characterCounts = allPlayedCharacters.reduce((acc, character) => {
    if (!character?.role_id) return acc;

    if (acc[character.role_id]) {
      acc[character.role_id]++;
    } else {
      acc[character.role_id] = 1;
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
