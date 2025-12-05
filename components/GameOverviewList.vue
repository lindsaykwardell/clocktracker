<template>
  <div class="flex flex-wrap">
    <table class="w-full mx-4">
      <thead>
        <tr>
          <th v-if="selectMultipleGames.enabled" class="w-16 md:w-20">Selected</th>
          <th></th>
          <th v-if="!props.showCommunityCard" class="w-16 md:w-20">Character</th>
          <th class="hidden md:table-cell">Date</th>
          <th class="text-start">Script</th>
          <th class="hidden md:table-cell text-start">Location</th>
          <th class="hidden lg:table-cell text-start">Community</th>
          <th class="hidden md:table-cell">Players (+Travelers)</th>
          <th>Result</th>
          <th v-if="!selectMultipleGames.enabled && !props.readonly">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="game in games"
          :key="game.id"
          class="table-row game-row bg-cover bg-center script-bg"
          :class="{
            'is-trouble-brewing': game.script === 'Trouble Brewing',
            'is-sects-and-violets': game.script === 'Sects and Violets',
            'is-bad-moon-rising': game.script === 'Bad Moon Rising',
            'is-custom-script':
              !['Trouble Brewing','Sects and Violets','Bad Moon Rising'].includes(game.script)
              && !game.associated_script?.background,
            'select-multiple': selectMultipleGames.enabled,
            selected: selectMultipleGames.selectedGames.includes(game.id),
          }"
          :style="
            game.associated_script?.background
              ? { '--bg-image-url': `url(${game.associated_script.background})` }
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
          <td 
            v-if="selectMultipleGames.enabled"
          >
            <div class="flex items-center justify-center select-status">
              <span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z"/>
                </svg>
              </span>
            </div>
          </td>
          <td class="w-6">
            <div v-if="isFavorite(game)" class="text-primary">
              <Star class="w-6" />
            </div>
          </td>
          <td 
            v-if="!props.showCommunityCard"
            class="flex items-center justify-center w-16 md:w-20"
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
            {{ game.script }}
            <template
              v-if="game.associated_script && !isBaseScript(game.script)"
            >
              <span class="inline-flex items-center rounded-sm bg-black/10 text-gray-800 dark:bg-black/40 dark:text-white text-xs font-medium badge">
                <template v-if="game.ls_game_id">
                  Game {{ game.associated_script.version }}
                </template>
                <template v-else>
                  {{ game.associated_script.version }}
                </template>
              </span>
            </template>
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
              v-html="displayWinIconSvg(game, props.showCommunityCard)">
            </div>
          </td>
          <td
            v-if="!selectMultipleGames.enabled && !props.readonly"
          >
            <div class="game-actions flex gap-2 items-center justify-center">
              <nuxt-link
                v-if="isMyGame(game)"
                class="bg-white dark:text-white dark:bg-black hover:bg-purple-600 transition-colors duration-250 ease-in-out z-10"
                :title="`Edit game - ${
                  game.script && gamesStore.getLastCharater(game.id)?.name
                    ? `${game.script} as ${gamesStore.getLastCharater(game.id).name}`
                    : game.script || gamesStore.getLastCharater(game.id)?.name || ''
                }, played on ${formatDate(game.date)}`"
                :to="`/game/${game.id}/edit`"
                >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                </svg>
              </nuxt-link>
              <a
                v-if="game.bgg_id"
                target="_blank"
                class="bg-white dark:text-white dark:bg-black hover:bg-purple-600 transition-colors duration-250 ease-in-out z-10"
                :title="`View this game on BoardGameGeek - ${
                  game.script && gamesStore.getLastCharater(game.id)?.name
                    ? `${game.script} as ${gamesStore.getLastCharater(game.id).name}`
                    : game.script || gamesStore.getLastCharater(game.id)?.name || ''
                }, played on ${formatDate(game.date)}`"
                :href="`https://boardgamegeek.com/play/details/${game.bgg_id}`"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 25.4 37.9" aria-hidden="true">
                  <path fill="currentColor" d="m24.9 7-3.8 1 3.7-8L.9 8.8l1.3 10.5L0 21.5l6.6 16.4 14-5.1 4.8-11.4-2.1-2L24.9 7z"/>
                </svg>
              </a>
              <nuxt-link
                v-if="!selectMultipleGames.enabled && !props.readonly"
                class="bg-white dark:text-white dark:bg-black hover:bg-purple-600 transition-colors duration-250 ease-in-out game-link"
                :title="`View game - ${
                  game.script && gamesStore.getLastCharater(game.id)?.name
                    ? `${game.script} as ${gamesStore.getLastCharater(game.id).name}`
                    : game.script || gamesStore.getLastCharater(game.id)?.name || ''
                }, played on ${formatDate(game.date)}`"
                :to="getGameLink(game)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                  <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                </svg>
              </nuxt-link>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { displayWinIconSvg } from "~/composables/useGames";

const gamesStore = useGames();
const selectMultipleGames = useSelectMultipleGames();
const { isBaseScript } = useScripts();
const users = useUsers();
const me = useMe();

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

const getGameLink = (game: GameRecord) => {
  if (me.value && me.value.status === Status.SUCCESS) {
    const userId = me.value.data.user_id;
    if (game.child_games) {
      const childGame = game.child_games.find((g) => g.user_id === userId);
      if (childGame) {
        return `/game/${childGame.id}`;
      }
    }
  }
  return `/game/${game.id}`;
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
</script>

<style scoped>

table { 
  border-collapse: separate; 
  border-spacing: 0 .25rem; 
  margin-top: -.25rem;
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
    border-top-left-radius: 1rem; 
    border-bottom-left-radius: 1rem;
  }

  &:last-child {
    border-bottom-right-radius: 1rem; 
    border-top-right-radius: 1rem; 
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

  background-image: linear-gradient(var(--bg-gradient-color), var(--bg-gradient-color)),
      var(--bg-image-url);

  &:hover {
    background-image: linear-gradient(var(--bg-gradient-color-hover), var(--bg-gradient-color-hover)),
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
}
</style>


<style>
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

.game-actions,
.select-status {
  > a,
  > span {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    block-size: 2rem;
    inline-size: 2rem;
  }

  svg {
    block-size: 1.125rem;
    inline-size: auto;
  }
}

.game-row {
  position: relative;
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