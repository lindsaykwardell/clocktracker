<template>
  <ul 
    class="grid bg-stone-300/30 dark:bg-stone-700/30"
    :class="{
      'grid-cols-[repeat(auto-fill,_minmax(260px,_1fr))] md:grid-cols-[repeat(auto-fill,_minmax(360px,_1fr))]': !showSingleGame
    }"
    >
    <li
      :key="game.id"
      v-for="game in games"
      class="border border-black transition duration-150 ease-in-out"
      :class="
        (selectMultipleGames.selectedGames.includes(game.id) ? ' selected' : '')
      "
    >
      <div class="relative">
        <button
          v-if="selectMultipleGames.enabled"
          class="absolute top-0 left-0 w-full h-full z-50 cursor-pointer"
          @click="selectMultipleGames.toggleGame(game.id)"
        ></button>
          <component
            :is="cardComponent(game)"
            @click="handleCardClick(game)"
            :to="canViewGame(game) ? getGameLink(game) : undefined"
            :title="cardTitle(game)"
            class="w-full bg-stone-900 flex flex-col items-center overflow-hidden text-black h-48 md:h-72 bg-cover bg-center script-bg"
            :style="
              game.associated_script?.background
                ? {
                    '--bg-image-url': `url(${game.associated_script.background})`,
                  }
                : {}
            "
            :class="{
              'cursor-pointer':
                canViewGame(game) ||
                !!props.onCardClick ||
                selectMultipleGames.enabled,
              'cursor-not-allowed': !canViewGame(game),
              ...scripts.scriptBgClasses(
                game.script,
                !!game.associated_script?.background
              ),
            }"
        >
          <img
            v-if="game.image_urls[0]"
            :src="fullImageUrl(game.image_urls[0])"
            class="absolute bottom-0 w-full h-full object-cover blur-sm"
            crossorigin="anonymous"
            loading="lazy"
            decoding="async"
          />
          <div
            class="absolute z-10 top-0 left-0 text-white md:text-lg bg-gradient-to-br from-black/75 via-black/50 to-black-0 p-1 flex gap-2 items-center"
          >
            <div>{{ formatDate(game.date) }}</div>
            <Badge v-if="game.ignore_for_stats" size="xs" icon="disabled" variant="overlay" color="negative" bold>
              <span class="sr-only">Ignored for </span>Stats
            </Badge>
            <Badge 
              v-if="game.privacy === 'PRIVATE' || game.privacy === 'FRIENDS_ONLY'"
              size="xs"
              icon="eye-slash" 
              color="negative"
              variant="overlay"
              bold
            >
              <span class="sr-only">Visibility: </span>
              <template v-if="game.privacy === 'PRIVATE'">
                Private
              </template>
              <template v-else>
                Friends Only
              </template>
            </Badge>
          </div>
          <div class="absolute top-8 left-1 z-10">
            <Avatar
              v-if="game.community"
              :value="game.community.icon"
              size="sm"
              class="flex-shrink bg-stone-300 dark:bg-stone-950"
              aria-hidden="true"
            />
            <span
              v-if="game.community_name"
              class="sr-only"
            >
              Community: {{ game.community_name }}
            </span>
          </div>
          <div
            class="flex-grow items-center justify-center flex font-sorts text-3xl"
          >
            <div class="relative token-solarsystem">
              <Token
                v-if="
                  showCommunityCard === false &&
                  (lastCharacter(game.id).name ||
                    lastCharacter(game.id).alignment !== 'NEUTRAL')
                "
                :character="lastCharacter(game.id)"
                size="lg"
              />
              <div v-else class="bg-black/25 flex justify-center">
                <img
                  :src="
                    game.associated_script?.logo ??
                    scripts.scriptLogo(game.script)
                  "
                  class="w-2/3"
                />
              </div>
              <div v-if="uniquePlayableRoles(game).length">
                <Token
                  v-for="(role, i) in orbitRoles(game)"
                  :key="role.key"
                  :character="{
                    alignment: role.alignment,
                    role: {
                      id: role.id,
                      token_url: role.token_url,
                      alternate_token_urls: role.alternate_token_urls,
                      initial_alignment: role.initial_alignment,
                    },
                  }"
                  size="sm"
                  class="orbit-token"
                  :class="`orbit-token--${i}`"
                  :style="{ '--pos': orbitPos(game, i + orbitOffset(game)) }"
                />
                <Token
                  v-if="uniquePlayableRoles(game).length > 5"
                  :character="{
                    role: {
                      name: '',
                      token_url: '',
                    },
                  }"
                  size="sm"
                  class="orbit-token orbit-token--more"
                  :style="{ '--pos': orbitPos(game, 0) }"
                >
                  <span class="font-sorts font-semibold text-lg text-black"
                    >+{{ uniquePlayableRoles(game).length - 4 }}</span
                  >
                </Token>
              </div>
            </div>
          </div>
          <div class="absolute w-full top-0 left-0" />
          <div
            class="absolute top-0 right-0 p-2 flex gap-1 items-center justify-center game-winner game-winner--grid"
            v-html="displayWinIconSvg(game, props.showCommunityCard)"
          ></div>
        </component>
        <div
          class="absolute bottom-0 left-0 w-full flex justify-between bg-gradient-to-tr from-black/75 via-black/25 to-black/75"
        >
          <div
            class="absolute -top-6 md:-top-12 left-0 p-1 flex gap-2 items-center bg-gradient-to-r from-black/75 via-black/50 to-black-0 h-6 md:h-12"
          >
            <IconUI id="players" size="xxl" color="yellow" />
            <div class="text-white font-bold flex items-center gap-2">
              <span>{{ game.player_count }}</span>
              <template v-if="game.traveler_count">
                (+{{ game.traveler_count }})
              </template>
              <ul
                v-for="(player, index) in taggedPlayers(game)"
                class="tagged-players"
                :style="`--i: ${index}`"
              >
                <li>
                  <Avatar
                    size="xs"
                    :value="player?.avatar"
                    class="bg-stone-300 dark:bg-stone-950"
                    aria-hidden="true"
                  />
                  <span class="sr-only">{{ player?.display_name }}</span>
                </li>
              </ul>
            </div>
          </div>
          <div class="flex flex-grow justify-between gap-1 p-1">
            <div class="flex gap-1 items-center">
              <IconUI v-if="isFavorite(game)" id="star-bordered" class="text-primary" size="lg" />
              <div v-if="game.ls_game?.campaign?.id">
                <ImageUI image="living-scripts" class="w-7 h-7" />
              </div>
              <div
                class="font-gothic text-white md:text-lg flex gap-1 items-center"
              >
                <div class="text-sm md:text-base">
                  {{ game.script }}
                  <template
                    v-if="
                      game.associated_script &&
                      !scripts.isBaseScript(game.script)
                    "
                  >
                    <Badge size="xs" variant="overlay">
                      <template v-if="game.ls_game_id">
                        Game {{ game.associated_script.version }}
                      </template>
                      <template v-else>
                        {{ game.associated_script.version }}
                      </template>
                    </Badge>
                  </template>
                </div>
              </div>
            </div>
            <div
              class="game-actions gap-1 md:gap-2 items-center justify-center flex"
            >
              <Button
                component="nuxt-link"
                v-if="!selectMultipleGames.enabled && isMyGame(game)"
                :to="`/game/${game.id}/edit`"
                class="z-10"
                :title="`Edit game - ${
                  game.script && lastCharacter(game.id)?.name
                    ? `${game.script} as ${lastCharacter(game.id).name}`
                    : game.script || lastCharacter(game.id)?.name || ''
                }, played on ${formatDate(game.date)}`"
                size="sm"
                color="black"
                icon="edit"
                display="icon-only"
                circular
              >
                Edit
              </Button>

              <template v-if="!selectMultipleGames.enabled && game.bgg_id">
                <Button
                  component="a"
                  :href="`https://boardgamegeek.com/play/details/${game.bgg_id}`"
                  target="_blank"
                  class="z-10"
                  :title="`View this game on BoardGameGeek - ${
                    game.script && lastCharacter(game.id)?.name
                      ? `${game.script} as ${lastCharacter(game.id).name}`
                      : game.script || lastCharacter(game.id)?.name || ''
                  }, played on ${formatDate(game.date)}`"
                  color="black"
                  size="sm"
                  icon="bgg"
                  display="icon-only"
                  circular
                >
                  BGG
                </Button>
              </template>
              <template
                v-else-if="game.bgg_id"
              >
                <IconUI id="bgg" color="bgg" rounded dark />
              </template>

              <Button
                component="nuxt-link"
                v-show="!selectMultipleGames.enabled && canViewGame(game)"
                :to="getGameLink(game)"
                class="game-link"
                :title="`View game - ${
                  game.script && lastCharacter(game.id)?.name
                    ? `${game.script} as ${lastCharacter(game.id).name}`
                    : game.script || lastCharacter(game.id)?.name || ''
                }, played on ${formatDate(game.date)}`"
                size="sm"
                color="black"
                icon="view"
                display="icon-only"
                circular
              >
                View
              </Button>
              <div
                class="flex items-center justify-center select-status"
                v-show="selectMultipleGames.enabled"
              >
                <IconUI id="check" rounded dark />
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { displayWinIconSvg } from "~/composables/useGames";
import { FriendStatus } from "~/composables/useFriends";
const gamesStore = useGames();
const users = useUsers();
const me = useMe();
const friends = useFriends();
const user = useSupabaseUser();

const config = useRuntimeConfig();
const scripts = useScripts();
const selectMultipleGames = useSelectMultipleGames();

const props = withDefaults(
  defineProps<{
    games: GameRecord[];
    onCardClick?: (game: GameRecord) => void;
    showCommunityCard?: boolean;
    showSingleGame?: boolean;
  }>(),
  {
    showCommunityCard: false,
    showSingleGame: false,
  }
);

const getChildGameId = (game: GameRecord) => {
  if (me.value?.status !== Status.SUCCESS) return null;

  const userId = me.value.data.user_id;
  const childGame = game.child_games?.find((g) => g.user_id === userId);
  return childGame?.id ?? null;
};

const getGameLink = (game: GameRecord) => {
  const childGameId = getChildGameId(game);
  return childGameId ? `/game/${childGameId}` : `/game/${game.id}`;
};

const canViewGame = (game: GameRecord) => {
  if (game.privacy === "PUBLIC") return true;
  if (me.value?.status !== Status.SUCCESS) return false;

  if (me.value.data.user_id === game.user_id) return true;
  if (getChildGameId(game)) return true;

  if (game.privacy === "FRIENDS_ONLY") {
    return friends.getFriendStatus(game.user_id) === FriendStatus.FRIENDS;
  }

  return false;
};

const cardComponent = (game: GameRecord) => {
  if (!props.games.length) return "div";
  if (props.onCardClick) return "button";
  return canViewGame(game) ? defineNuxtLink({}) : "div";
};

const cardTitle = (game: GameRecord) => {
  if (canViewGame(game)) return undefined;
  return game.privacy === "FRIENDS_ONLY"
    ? "Friends only game"
    : "Private game";
};

const lastCharacters = computed<
  Record<string, ReturnType<typeof gamesStore.getLastCharater>>
>(() => {
  const entries: Record<
    string,
    ReturnType<typeof gamesStore.getLastCharater>
  > = {};
  for (const game of props.games) {
    entries[game.id] = gamesStore.getLastCharater(game.id);
  }
  return entries;
});

const lastCharacter = (gameId: string) => lastCharacters.value[gameId];

const dateFormatter = new Intl.DateTimeFormat(
  typeof navigator !== "undefined" ? navigator.language : "en-US",
  { timeZone: "UTC" }
);

function formatDate(date: Date) {
  return dateFormatter.format(new Date(date));
}

function fullImageUrl(file: string) {
  if (file.startsWith("http")) return file;
  return `${config.public.supabase.url}/storage/v1/object/public/game-attachments/${file}`;
}

function handleCardClick(game: GameRecord) {
  if (props.onCardClick) props.onCardClick(game);
}

function isFavorite(game: GameRecord) {
  const user = users.getUserById(game.user_id);

  if (user.status !== Status.SUCCESS) return false;

  return user.data.favorites.some((f) => f.game_id === game.id);
}

function isMyGame(game: GameRecord) {
  if (me.value.status !== Status.SUCCESS) return false;

  return me.value?.data.user_id === game.user_id;
}

function uniquePlayableRoles(game: GameRecord) {
  // Identify the final playable role to avoid duplicating it in the mini-row
  const lastPlayable = [...game.player_characters]
    .reverse()
    .find(
      (c) => c.role_id && c.role?.type !== "FABLED" && c.role?.type !== "LORIC"
    );
  const lastPlayableRoleId = lastPlayable?.role_id ?? null;
  const lastPlayableAlignment = lastPlayable?.alignment ?? "UNKNOWN";

  // Track which alignments we've already shown for each role_id (to avoid repeats).
  const seenAlignmentsByRole = new Map<string, Set<string>>();

  const roles: {
    key: string;
    id: string;
    name: string;
    token_url: string | null;
    alternate_token_urls?: string[] | null;
    alignment: string | null;
    initial_alignment: string | null;
  }[] = [];

  for (const [index, character] of game.player_characters.entries()) {
    if (!character.role_id || !character.name) continue;
    if (character.role?.type === "FABLED" || character.role?.type === "LORIC")
      continue;

    // Skip entries that match the final role/alignment (shown as the main token).
    if (
      lastPlayableRoleId &&
      character.role_id === lastPlayableRoleId &&
      (character.alignment ?? "UNKNOWN") === lastPlayableAlignment
    ) {
      continue;
    }

    const alignmentKey = character.alignment ?? "UNKNOWN";
    const seen =
      seenAlignmentsByRole.get(character.role_id) ?? new Set<string>();
    if (seen.has(alignmentKey)) continue;
    seen.add(alignmentKey);
    seenAlignmentsByRole.set(character.role_id, seen);

    roles.push({
      key: `${character.role_id}:${alignmentKey}:${index}`,
      id: character.role_id,
      name: character.name,
      token_url:
        character.role?.token_url ?? character.related_role?.token_url ?? null,
      alternate_token_urls: character.role?.alternate_token_urls ?? null,
      alignment: character.alignment ?? null,
      initial_alignment: character.role?.initial_alignment ?? null,
    });
  }

  return roles;
}

const orbitRoles = (game: GameRecord) => {
  const roles = uniquePlayableRoles(game);
  if (roles.length > 5) {
    // Keep the most recent 4 roles; oldest are summarized in +N.
    return roles.slice(-4);
  }
  // Keep up to the most recent 5 roles.
  return roles.slice(-5);
};

const orbitCount = (game: GameRecord) =>
  Math.min(uniquePlayableRoles(game).length, 5);

const orbitOffset = (game: GameRecord) =>
  uniquePlayableRoles(game).length > 5 ? 1 : 0;

const orbitPos = (game: GameRecord, index: number) => {
  const count = orbitCount(game);
  if (!count) return 0;
  return index - (count - 1) / 2;
};

type TaggedPlayer = NonNullable<
  GameRecord["grimoire"][number]["tokens"][number]["player"]
>;

const computeTaggedPlayers = (game: GameRecord): TaggedPlayer[] => {
  const seen = new Set<string>();
  const players: TaggedPlayer[] = [];

  for (const g of game.grimoire) {
    for (const t of g.tokens) {
      const player = t.player;
      if (!t.player_id || !player) continue;

      const key = player.id ?? player.username;
      if (!key || seen.has(key)) continue;

      seen.add(key);
      players.push(player);
    }
  }

  return players;
};

const taggedPlayersMap = computed<Record<string, TaggedPlayer[]>>(() => {
  const entries: Record<string, TaggedPlayer[]> = {};
  for (const game of props.games) {
    entries[game.id] = computeTaggedPlayers(game);
  }
  return entries;
});

const taggedPlayers = (game: GameRecord) => taggedPlayersMap.value[game.id] ?? [];

onMounted(() => {
  if (user.value?.id && friends.friends.status !== Status.SUCCESS) {
    friends.fetchFriends();
  }
});
</script>

<style scoped>
th {
  @apply cursor-pointer select-none;
}

.script-bg {
  background-image: var(--bg-image-url);

  &.is-trouble-brewing {
    --bg-image-url: url("/img/scripts/trouble-brewing-bg-grid.webp");
  }

  &.is-sects-and-violets {
    --bg-image-url: url("/img/scripts/sects-and-violets-bg-grid.webp");
  }

  &.is-bad-moon-rising {
    --bg-image-url: url("/img/scripts/bad-moon-rising-bg-grid.webp");
  }

  &.is-custom-script {
    --bg-image-url: url("/img/scripts/custom-script-bg-grid.webp");
  }

  &.is-unknown-script {
    --bg-image-url: url("/img/scripts/unknown-script-bg-grid.webp");
  }
}

.custom-script-name {
  -webkit-text-stroke-width: 1px;
  -webkit-text-stroke-color: white;
}

.tagged-players {
  @apply relative;
  left: calc(var(--i) * -1.75rem);
}

li.selected {
  position: relative;

  &::before {
    @apply bg-purple-800/30;

    content: "";
    position: absolute;
    inset: 0;
    z-index: 12;
  }
}
</style>

<style scoped>
.select-status {
  > span {
    @apply bg-white text-black dark:text-white dark:bg-black;

    position: relative;
    z-index: 13;

    .selected & {
      @apply bg-purple-600 text-white dark:text-white dark:bg-purple-800;
    }

    .select-multiple:hover & {
      @apply bg-purple-800 text-white dark:text-white dark:bg-purple-600;
    }
  }
}

/* .game-actions,
.select-status {
  > a,
  > span {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;

    @apply w-6 h-6 md:w-8 md:h-8;
  }
} */

.game-row {
  position: relative;
}

.game-link::after {
  content: "";
  inset: 0;
  position: absolute;
}
</style>

<style>
.game-winner--grid {
  z-index: 10;

  svg {
    @apply h-6 md:h-8;

    inline-size: auto;
  }
}

.token-solarsystem {
  --orbit-radius: 6rem;
}

@media (min-width: 768px) {
  .token-solarsystem {
    --orbit-radius: 9rem;
  }
}

/* Orbiting tokens */
.orbit-token {
  --angle-step: 22deg;
  --scale: 1;
  --offset: 0;

  position: absolute;
  top: calc(50% - (1.5rem));
  left: calc(50% - 1.5rem);

  @apply top-[calc(50%-1rem)] left-[calc(50%-1rem)] md:top-[calc(50%-1.5rem)] md:left-[calc(50%-1.5rem)];

  /* Orbit rotation */
  --orbit-transform: rotate(calc(0deg + var(--pos) * var(--angle-step)))
    translateX(var(--orbit-radius))
    rotate(calc(-0deg + var(--pos) * var(--angle-step) * -1));
  transform: var(--orbit-transform) scale(var(--scale));  
  transform-origin: center center;
}
</style>
