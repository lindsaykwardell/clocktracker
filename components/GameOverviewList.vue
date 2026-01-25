<template>
  <div class="flex flex-wrap">
    <table class="w-full mx-3 md:mx-4">
      <thead>
        <tr>
          <th v-if="selectMultipleGames.enabled" class="w-16 md:w-20">
            Selected
          </th>
          <th></th>
          <th v-if="!props.showCommunityCard" class="w-10 md:w-20">
            Char<span class="sr-only">acter</span>
          </th>
          <th class="hidden md:table-cell">Date</th>
          <th class="text-start">Script</th>
          <th class="hidden md:table-cell text-start">Location</th>
          <th class="hidden lg:table-cell text-start">Community</th>
          <th class="hidden md:table-cell">Players (+Travelers)</th>
          <th>Result</th>
          <th
            v-if="!selectMultipleGames.enabled && !props.readonly"
            class="hidden md:table-cell"
          >
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="game in games"
          :key="game.id"
          class="table-row game-row bg-cover bg-center script-bg"
          :title="rowTitle(game)"
          :class="{
            ...scriptBgClasses(
              game.script,
              !!game.associated_script?.background
            ),
            'select-multiple': selectMultipleGames.enabled,
            selected: selectMultipleGames.selectedGames.includes(game.id),
          }"
          :style="
            game.associated_script?.background
              ? {
                  '--bg-image-url': `url(${game.associated_script.background})`,
                }
              : {}
          "
          @click="
            selectMultipleGames.enabled
              ? selectMultipleGames.toggleGame(game.id)
              : onClick
              ? onClick(game)
              : null
          "
        >
          <td v-if="selectMultipleGames.enabled">
            <div class="flex items-center justify-center select-status">
              <IconUI id="check" rounded />
            </div>
          </td>
          <td class="w-4 md:w-6">
            <div v-if="isFavorite(game)" class="flex items-center justify-center" >
              <IconUI id="star" class="text-primary" />
            </div>
          </td>
          <td
            v-if="!props.showCommunityCard"
            class="flex items-center justify-center w-10 md:w-20"
          >
            <Token
              v-if="
                gamesStore.getLastCharater(game.id).name ||
                gamesStore.getLastCharater(game.id).alignment !== 'NEUTRAL'
              "
              :character="gamesStore.getLastCharater(game.id)"
              size="sm"
            />
          </td>
          <td class="hidden md:table-cell text-center">
            {{ formatDate(game.date) }}
          </td>
          <td>
            <div class="flex items-center gap-1 md:gap-2">
              <span v-if="game.script" class="line-clamp-1 md:line-clamp-none max-w-40 md:max-w-none">
                {{ game.script }}
              </span>
              <div class="flex items-center gap-1">
                <Badge
                  v-if="game.associated_script && !isBaseScript(game.script)"
                  size="xs"
                  variant="overlay"
                >
                  <template v-if="game.ls_game_id">
                    Game {{ game.associated_script.version }}
                  </template>
                  <template v-else>
                    {{ game.associated_script.version }}
                  </template>
                </Badge>
                <Badge
                  v-if="game.ignore_for_stats"
                  color="negative"
                  size="xs"
                  icon="disabled"
                  display="icon-only"
                  variant="overlay"
                >
                  <span class="sr-only">
                    Ignored for Stats
                  </span>
                </Badge>
                <Badge 
                v-if="game.privacy === 'PRIVATE' || game.privacy === 'FRIENDS_ONLY'"
                  color="negative"
                  size="xs"
                  icon="eye-slash" 
                  display="icon-only"
                  variant="overlay"
                >
                  <span class="sr-only">
                    Visibility: 
                    <template v-if="game.privacy === 'PRIVATE'">
                      Private
                    </template>
                    <template v-else>
                      Friends Only
                    </template>
                  </span>
                </Badge>
              </div>
            </div>
          </td>
          <td class="hidden md:table-cell text-start">
            <template v-if="game.location_type === 'IN_PERSON'">
              {{ game.location || "In Person" }}
            </template>
            <template v-else> Online </template>
          </td>
          <td class="hidden lg:table-cell">
            <div class="flex gap-2 items-center">
              <Avatar
                v-if="game.community"
                :value="game.community.icon"
                size="xs"
                class="flex-shrink bg-stone-300 dark:bg-stone-950"
              />
              {{ game.community_name }}
            </div>
          </td>
          <td class="hidden md:table-cell text-center">
            {{ game.player_count }}
            <template v-if="game.traveler_count && game.traveler_count > 0">
              (+{{ game.traveler_count }})
            </template>
          </td>
          <td>
            <div
              class="flex gap-1 items-center justify-center game-winner game-winner--table"
              v-html="displayWinIconSvg(game, props.showCommunityCard)"
            ></div>
          </td>
          <td v-if="!selectMultipleGames.enabled && !props.readonly">
            <div class="game-actions flex gap-2 items-center justify-center">
              <Button
                component="nuxt-link"
                v-if="isMyGame(game)"
                :to="`/game/${game.id}/edit`"
                class="bg-white dark:text-white dark:bg-black hover:bg-purple-600 transition-colors duration-250 ease-in-out z-10 hidden md:flex"
                :title="`Edit game - ${
                  game.script && gamesStore.getLastCharater(game.id)?.name
                    ? `${game.script} as ${
                        gamesStore.getLastCharater(game.id).name
                      }`
                    : game.script ||
                      gamesStore.getLastCharater(game.id)?.name ||
                      ''
                }, played on ${formatDate(game.date)}`"
                size="xs-sm"
                color="contrast"
                icon="edit"
                display="icon-only"
                circular
              >
                Edit
              </Button>
              <Button
                component="a"
                v-if="game.bgg_id"
                :href="`https://boardgamegeek.com/play/details/${game.bgg_id}`"
                target="_blank"
                class="z-10 hidden md:inline-flex"
                :title="`View this game on BoardGameGeek - ${
                  game.script && gamesStore.getLastCharater(game.id)?.name
                    ? `${game.script} as ${
                        gamesStore.getLastCharater(game.id).name
                      }`
                    : game.script ||
                      gamesStore.getLastCharater(game.id)?.name ||
                      ''
                }, played on ${formatDate(game.date)}`"
                size="xs-sm"
                color="contrast"
                icon="bgg"
                display="icon-only"
                circular
              >
                BGG
              </Button>
              <Button
                component="nuxt-link"
                v-if="
                  !selectMultipleGames.enabled &&
                  !props.readonly &&
                  canViewGame(game)
                "
                :to="getGameLink(game)"
                class="bg-white dark:text-white dark:bg-black hover:bg-purple-600 transition-colors duration-250 ease-in-out game-link"
                :title="`View game - ${
                  game.script && gamesStore.getLastCharater(game.id)?.name
                    ? `${game.script} as ${
                        gamesStore.getLastCharater(game.id).name
                      }`
                    : game.script ||
                      gamesStore.getLastCharater(game.id)?.name ||
                      ''
                }, played on ${formatDate(game.date)}`"
                size="xs-sm"
                color="contrast"
                icon="view"
                display="icon-only"
                circular
              >
                View
            </Button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { displayWinIconSvg } from "~/composables/useGames";
import { FriendStatus } from "~/composables/useFriends";

const gamesStore = useGames();
const selectMultipleGames = useSelectMultipleGames();
const { isBaseScript, scriptBgClasses } = useScripts();
const users = useUsers();
const me = useMe();
const friends = useFriends();
const user = useSupabaseUser();

const props = withDefaults(
  defineProps<{
    games: GameRecord[];
    onClick?: (game: GameRecord) => void;
    showCommunityCard?: boolean;
    readonly?: boolean;
  }>(),
  {
    showCommunityCard: false,
    readonly: false,
  }
);

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(navigator.language, {
    timeZone: "UTC",
  }).format(new Date(date));
}

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

const nuxtLink = resolveComponent("nuxt-link");

const componentIs = computed(() => {
  if (selectMultipleGames.enabled || props.onClick) return "tr";
  return nuxtLink;
});

function isFavorite(game: GameRecord) {
  const user = users.getUserById(game.user_id);

  if (user.status !== Status.SUCCESS) return false;

  return user.data.favorites.some((f) => f.game_id === game.id);
}

function isMyGame(game: GameRecord) {
  if (me.value.status !== Status.SUCCESS) return false;

  return me.value?.data.user_id === game.user_id;
}

function canViewGame(game: GameRecord) {
  if (game.privacy === "PUBLIC") return true;
  if (me.value?.status !== Status.SUCCESS) return false;

  if (me.value.data.user_id === game.user_id) return true;
  if (getChildGameId(game)) return true;

  if (game.privacy === "FRIENDS_ONLY") {
    return friends.getFriendStatus(game.user_id) === FriendStatus.FRIENDS;
  }

  return false;
}

function rowTitle(game: GameRecord) {
  if (canViewGame(game)) return undefined;
  return game.privacy === "FRIENDS_ONLY"
    ? "Friends only game"
    : "Private game";
}

onMounted(() => {
  if (user.value?.id && friends.friends.status !== Status.SUCCESS) {
    friends.fetchFriends();
  }
});
</script>

<style scoped>
table {
  border-collapse: separate;
  border-spacing: 0 0.25rem;
  margin-top: -0.25rem;
}

th,
td {
  vertical-align: middle;
  white-space: nowrap;
  text-overflow: ellipsis;
}

th {
  @apply px-1 md:px-2 cursor-pointer select-none text-sm lg:text-base;
}

td {
  @apply h-12 md:h-16 p-1 md:p-2 transition duration-150 text-sm lg:text-base;
  border-style: solid none;

  &:first-child {
    @apply rounded-tl-lg md:rounded-tl-2xl rounded-bl-lg md:rounded-bl-2xl
  }

  &:last-child {
    @apply rounded-tr-lg md:rounded-tr-2xl rounded-br-lg md:rounded-br-2xl
  }
}

tr {
  &.select-multiple:hover {
    cursor: pointer;
  }
}

.script-bg {
  --bg-gradient-color: rgba(255, 255, 255, 0.7);
  --bg-gradient-color-hover: rgba(255, 255, 255, 0.6);

  background-image: linear-gradient(
      var(--bg-gradient-color),
      var(--bg-gradient-color)
    ),
    var(--bg-image-url);

  &:hover {
    background-image: linear-gradient(
        var(--bg-gradient-color-hover),
        var(--bg-gradient-color-hover)
      ),
      var(--bg-image-url);
  }

  .dark & {
    --bg-gradient-color: rgba(0, 0, 0, 0.6);
    --bg-gradient-color-hover: rgba(0, 0, 0, 0.5);
  }

  &.is-trouble-brewing {
    --bg-image-url: url("/img/scripts/trouble-brewing-bg-thin.webp");
  }

  &.is-sects-and-violets {
    --bg-image-url: url("/img/scripts/sects-and-violets-bg-thin.webp");
  }

  &.is-bad-moon-rising {
    --bg-image-url: url("/img/scripts/bad-moon-rising-bg-thin.webp");
  }

  &.is-custom-script {
    --bg-image-url: url("/img/scripts/custom-script-bg-thin.webp");
  }

  &.is-unknown-script {
    --bg-image-url: url("/img/scripts/unknown-script-bg-thin.webp");
  }
}
</style>

<style scoped>
.select-status {
  > span {
    @apply bg-white dark:text-white dark:bg-black;

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

tr.game-row {
  /*
    Safari doesn't support `position: relative` on `<tr>` elements,
    but these two properties can be used as an alternative.
    Source: https://mtsknn.fi/blog/relative-tr-in-safari/
  */
  transform: translate(0);
  clip-path: inset(0);
}

.game-link::after {
  content: "";
  inset: 0;
  position: absolute;
}

.game-winner {
  z-index: 10;

  svg {
    inline-size: auto;
  }
}

.game-winner--table {
  position: relative;

  svg {
    block-size: 1.5rem;
  }
}
</style>
